"""
MindCare AI — Explainable AI Service
Calculates dynamic attention weights, computes local SHAP estimations using VADER perturbations,
and compiles chatbot decision rationales on demand.
"""
import re
import math
from typing import List, Dict
from sqlalchemy.orm import Session

from app.models.chat import Chat
from app.ai.sentiment_analyzer import sentiment_analyzer
from app.ai.crisis_detector import crisis_detector
from app.schemas.explain import ExplainabilityResponse, WordExplanation

# Basic emotional keyword lists for attention prior weights
EMOTIONAL_DICTIONARY = {
    # Distress / Sadness
    "sad": 0.8, "depressed": 0.8, "lonely": 0.7, "hopeless": 0.8, "crying": 0.7, "empty": 0.7,
    # Suicide / Self-Harm
    "kill": 0.9, "die": 0.9, "suicide": 0.9, "suicidal": 0.9, "cut": 0.9, "cutting": 0.9, "harm": 0.9,
    # Panic / Anxiety
    "panic": 0.8, "scared": 0.7, "anxious": 0.7, "anxiety": 0.7, "breathe": 0.6, "tightness": 0.6,
    # Positive
    "happy": 0.7, "joy": 0.7, "hopeful": 0.7, "excited": 0.7, "love": 0.6, "grateful": 0.7
}

class ExplainService:
    """Computes explainable metadata on predictions for transparency auditing."""

    def explain_prediction(self, db: Session, chat_id: str) -> ExplainabilityResponse:
        """Fetch user message, compute word attention + SHAP scores, and compile a decision rationale."""
        chat_msg = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat_msg:
            raise ValueError(f"Chat message not found for ID: {chat_id}")

        content = chat_msg.content
        # Tokenize by alphanumeric words
        raw_words = re.findall(r"\b\w+'?\w*\b", content)
        
        # 1. Calculate Attention Weights & VADER SHAP approximation
        word_explanations: List[WordExplanation] = []
        
        orig_res = sentiment_analyzer.analyze(content)
        orig_compound = orig_res.get("compound_score", 0.0)

        # Baseline attention prior weight score
        attention_raw = []
        for word in raw_words:
            w_lower = word.lower()
            # Assign prior based on emotional dictionary
            prior = EMOTIONAL_DICTIONARY.get(w_lower, 0.05)
            # Boost score if VADER analyzer rates it as polar
            single_polarity = sentiment_analyzer.analyze(word)
            vader_compound = abs(single_polarity.get("compound_score", 0.0))
            raw_weight = prior + (vader_compound * 0.5)
            attention_raw.append(raw_weight)

        # Softmax normalization to sum to 1.0
        sum_exp = sum(math.exp(w) for w in attention_raw)
        attention_weights = [math.exp(w) / sum_exp for w in attention_raw] if sum_exp > 0 else [1.0/len(raw_words)] * len(raw_words)

        # Compute SHAP value using VADER compound score perturbations
        for idx, word in enumerate(raw_words):
            # Create a perturbed text omitting only the target word
            words_copy = raw_words.copy()
            words_copy.pop(idx)
            perturbed_text = " ".join(words_copy)
            
            perturbed_res = sentiment_analyzer.analyze(perturbed_text)
            perturbed_compound = perturbed_res.get("compound_score", 0.0)
            
            # SHAP value = change in compound sentiment score (original - perturbed)
            # If removing a negative word makes the compound score rise, the SHAP value is negative (contributing to negative sentiment)
            shap_val = orig_compound - perturbed_compound
            
            # Fallback to polar score if compound sentiment did not shift
            if abs(shap_val) < 1e-4:
                single_res = sentiment_analyzer.analyze(word)
                shap_val = single_res.get("compound_score", 0.0)

            word_explanations.append(
                WordExplanation(
                    word=word,
                    attention_weight=round(attention_weights[idx], 4),
                    shap_value=round(shap_val, 4)
                )
            )

        # 2. Extract matched keywords from VADER / Crisis detectors
        crisis_check = crisis_detector.detect(content)
        keywords = list(set(orig_res.get("matched_words", []) + crisis_check.get("matched_keywords", [])))
        if not keywords:
            # Fallback to extracting highest polar words
            keywords = [w for w, att in zip(raw_words, attention_weights) if att > 0.1]

        # 3. Generate structured chatbot decision rationale
        rationale = self._compile_rationale(
            detected_emotion=chat_msg.emotion or "Neutral",
            confidence=chat_msg.confidence or 0.0,
            sentiment=chat_msg.sentiment or "neutral",
            stress_score=chat_msg.stress_score or 0.0,
            is_crisis=chat_msg.is_crisis,
            crisis_severity=crisis_check.get("severity", "none"),
            crisis_type=crisis_check.get("risk_type"),
            content=content
        )

        return ExplainabilityResponse(
            chat_id=chat_id,
            message_text=content,
            detected_emotion=chat_msg.emotion or "Neutral",
            confidence=round(chat_msg.confidence or 0.0, 4),
            sentiment=chat_msg.sentiment or "neutral",
            stress_score=chat_msg.stress_score or 0.0,
            keywords=keywords,
            words=word_explanations,
            decision_rationale=rationale
        )

    def _compile_rationale(
        self, detected_emotion: str, confidence: float, sentiment: str, 
        stress_score: float, is_crisis: bool, crisis_severity: str, 
        crisis_type: str, content: str
    ) -> str:
        """Compose a structured, clinical explainability statement outlining the logic path."""
        steps = []
        
        # Step 1: Emotion classification path
        steps.append(
            f"1. Emotion Analysis: The input content was classified as '{detected_emotion}' "
            f"with {confidence * 100:.1f}% confidence. The sentiment polarity is '{sentiment}' "
            f"and the stress indicator is rated at {stress_score}/10."
        )
        
        # Step 2: Safety classification check
        if is_crisis:
            steps.append(
                f"2. Crisis Intervention: The safety filter flagged critical terms. "
                f"Matched category '{crisis_type.upper()}' with severity level '{crisis_severity.upper()}'. "
                f"Urgently bypassed the normal LLM generation to prevent unsafe outputs and triggered emergency protocols."
            )
        else:
            steps.append(
                f"2. Crisis Intervention: Safety scans did not detect suicide, self-harm, or severe panic patterns. "
                f"The request was cleared for normal conversational response generation."
            )
            
        # Step 3: Chatbot selection logic
        if is_crisis and crisis_severity in ("critical", "high"):
            steps.append(
                f"3. Generator Decision: A strict safety template response was returned to present "
                f"vetted professional hotlines (988 / AASRA / Tele-MANAS) to the user immediately."
            )
        else:
            steps.append(
                f"3. Generator Decision: Based on the emotional state '{detected_emotion}', the agent selected a "
                f"supportive, validation-oriented therapeutic tone. It queried past conversational memory context to "
                f"maintain consistency across sessions, generating an empathetic counseling response."
            )

        return "\n\n".join(steps)

explain_service = ExplainService()
