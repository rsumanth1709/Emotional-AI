"""
MindCare AI — Global Multilingual Emotion Detector
Hybrid 3-tier Global Multilingual Emotion Detection Engine:
1. Tier 1 (Primary): Custom Fine-Tuned Multilingual & Transliterated 10-Class Calibrated Model
   (Trained on 77,000+ samples across 82+ human languages + Hinglish, Tenglish, Spanglish, etc.)
2. Tier 2 (Fallback): HuggingFace DistilRoBERTa (j-hartmann/emotion-english-distilroberta-base)
3. Tier 3 (Heuristic): Multilingual keyword & transliterated fallback engine

Outputs 10 Therapeutic Categories:
Happy, Sad, Angry, Fear, Anxiety, Stress, Lonely, Hopeful, Excited, Neutral
"""

import os
import re
import joblib
import numpy as np
from typing import Dict, Optional

from app.utils.logger import logger
from app.ai.translator import detect_and_translate

_ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")

# Paths for Multilingual Calibrated Model
_MULTI_MODEL_PATH = os.path.join(_ARTIFACTS_DIR, "multilingual_emotion_classifier.joblib")
_MULTI_VEC_PATH = os.path.join(_ARTIFACTS_DIR, "multilingual_tfidf_vectorizer.joblib")

# Paths for Monolingual Calibrated Model
_MODEL_PATH = os.path.join(_ARTIFACTS_DIR, "emotion_classifier.joblib")
_VEC_PATH = os.path.join(_ARTIFACTS_DIR, "tfidf_vectorizer.joblib")

_BASE_MAPPING: Dict[str, str] = {
    "joy":      "Happy",
    "surprise": "Excited",
    "neutral":  "Neutral",
    "sadness":  "Sad",
    "anger":    "Angry",
    "disgust":  "Angry",
    "fear":     "Fear",
}

_LONELINESS_KEYWORDS = ["alone", "lonely", "nobody", "no one", "isolated", "abandoned", "empty", "akela", "akeli", "naku chala lonely", "solo", "seul"]
_ANXIETY_KEYWORDS = ["anxious", "anxiety", "panic", "nervous", "worry", "worried", "overthink", "darr", "ghabrahat", "ansioso", "angst"]
_STRESS_KEYWORDS = ["stressed", "overwhelmed", "exhausted", "pressure", "too much", "can't cope", "burnout", "tired", "thak", "pareshan", "estresado"]
_HOPEFUL_KEYWORDS = ["hope", "hopeful", "better", "improve", "looking forward", "optimistic", "ummeed", "esperanza", "espoir"]
_EXCITED_KEYWORDS = ["excited", "amazing", "great", "fantastic", "thrilled", "can't wait", "kushi", "excitado"]


def _refine_emotion(base_emotion: str, text: str) -> str:
    """Apply keyword-based refinement for fine-grained subcategories across languages."""
    text_lower = text.lower()

    if base_emotion in ["Sad", "Neutral"]:
        if any(kw in text_lower for kw in _LONELINESS_KEYWORDS):
            return "Lonely"

    if base_emotion in ["Fear", "Neutral", "Sad"]:
        if any(kw in text_lower for kw in _ANXIETY_KEYWORDS):
            return "Anxiety"
        if any(kw in text_lower for kw in _STRESS_KEYWORDS):
            return "Stress"

    if base_emotion in ["Happy", "Neutral"]:
        if any(kw in text_lower for kw in _HOPEFUL_KEYWORDS):
            return "Hopeful"
        if any(kw in text_lower for kw in _EXCITED_KEYWORDS):
            return "Excited"

    return base_emotion


def _preprocess(text: str) -> str:
    """Clean and normalize input text."""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text


class EmotionDetector:
    """
    Singleton Multilingual Emotion Detection Service.
    Supports 82+ global human languages, transliterations, and automatic fallbacks.
    """

    _instance: Optional["EmotionDetector"] = None
    _multi_model = None
    _multi_vec = None
    _mono_model = None
    _mono_vec = None
    _classes = None
    _hf_pipeline = None
    _loaded = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_models(self):
        """Lazy load custom multilingual model or HuggingFace fallback."""
        if self._loaded:
            return
        
        self._loaded = True

        # 1. Try Loading Multilingual Model Artifacts
        if os.path.exists(_MULTI_MODEL_PATH) and os.path.exists(_MULTI_VEC_PATH):
            try:
                logger.info(f"Loading Multilingual emotion model from: {_MULTI_MODEL_PATH}")
                self._multi_model = joblib.load(_MULTI_MODEL_PATH)
                self._multi_vec = joblib.load(_MULTI_VEC_PATH)
                self._classes = list(self._multi_model.classes_)
                logger.info(f"Multilingual emotion model loaded successfully ({len(self._classes)} classes).")
            except Exception as e:
                logger.error(f"Failed to load multilingual emotion model: {e}")
                self._multi_model = None

        # 2. Try Loading Monolingual Model Artifacts
        if os.path.exists(_MODEL_PATH) and os.path.exists(_VEC_PATH):
            try:
                self._mono_model = joblib.load(_MODEL_PATH)
                self._mono_vec = joblib.load(_VEC_PATH)
                if not self._classes:
                    self._classes = list(self._mono_model.classes_)
            except Exception as e:
                logger.error(f"Failed to load monolingual emotion model: {e}")

        # 3. Try HuggingFace pipeline
        try:
            from transformers import pipeline as hf_pipeline
            from app.config import settings
            logger.info(f"Loading HuggingFace emotion model: {settings.EMOTION_MODEL_NAME}")
            self._hf_pipeline = hf_pipeline(
                "text-classification",
                model=settings.EMOTION_MODEL_NAME,
                return_all_scores=True,
                device=-1,
            )
            logger.info("HuggingFace emotion model loaded successfully.")
        except Exception as e:
            logger.warning(f"HuggingFace pipeline unavailable ({e}); using heuristic fallback engine.")
            self._hf_pipeline = None

    def detect(self, text: str) -> Dict:
        """
        Run global multilingual emotion detection on text in any language.

        Returns:
            {
                "emotion": str,              # 10 Therapeutic Categories
                "confidence": float,         # 0.0 – 1.0
                "raw_scores": dict,          # Raw model probabilities
                "all_mapped_scores": dict,   # Mapped therapeutic scores
                "detected_language": str,    # Auto-detected ISO language code
                "engine": str                # "multilingual_model" | "custom_model" | "huggingface" | "heuristic"
            }
        """
        if not text or len(text.strip()) < 2:
            return self._neutral_result()

        self._load_models()

        cleaned = _preprocess(text[:512])

        # Step 1: Detect language & translate if non-English
        translated_en, detected_lang = detect_and_translate(cleaned)

        # Step 2: Multilingual Classifier Inference
        if self._multi_model is not None and self._multi_vec is not None:
            try:
                # Combine native text and translated text for dual-script feature extraction
                combined_input = f"{cleaned} {translated_en}" if translated_en != cleaned else cleaned
                vec = self._multi_vec.transform([combined_input])
                probs = self._multi_model.predict_proba(vec)[0]
                
                raw_scores = {c: round(float(p), 4) for c, p in zip(self._classes, probs)}
                top_idx = int(np.argmax(probs))
                top_cat = self._classes[top_idx]
                refined_cat = _refine_emotion(top_cat, cleaned)

                mapped_scores: Dict[str, float] = {}
                for cat, prob in zip(self._classes, probs):
                    r_cat = _refine_emotion(cat, cleaned)
                    mapped_scores[r_cat] = round(mapped_scores.get(r_cat, 0.0) + float(prob), 4)

                return {
                    "emotion": refined_cat,
                    "confidence": round(float(probs[top_idx]), 4),
                    "raw_scores": raw_scores,
                    "all_mapped_scores": mapped_scores,
                    "detected_language": detected_lang,
                    "engine": "multilingual_model",
                }
            except Exception as e:
                logger.error(f"Error in multilingual model inference: {e}")

        # Step 3: Monolingual / Translated Text Model Inference
        target_text = translated_en if translated_en else cleaned
        if self._mono_model is not None and self._mono_vec is not None:
            try:
                vec = self._mono_vec.transform([target_text])
                probs = self._mono_model.predict_proba(vec)[0]
                
                classes = list(self._mono_model.classes_)
                raw_scores = {c: round(float(p), 4) for c, p in zip(classes, probs)}
                top_idx = int(np.argmax(probs))
                top_cat = classes[top_idx]
                refined_cat = _refine_emotion(top_cat, target_text)

                mapped_scores: Dict[str, float] = {}
                for cat, prob in zip(classes, probs):
                    r_cat = _refine_emotion(cat, target_text)
                    mapped_scores[r_cat] = round(mapped_scores.get(r_cat, 0.0) + float(prob), 4)

                return {
                    "emotion": refined_cat,
                    "confidence": round(float(probs[top_idx]), 4),
                    "raw_scores": raw_scores,
                    "all_mapped_scores": mapped_scores,
                    "detected_language": detected_lang,
                    "engine": "custom_model",
                }
            except Exception as e:
                logger.error(f"Error in custom monolingual inference: {e}")

        # Step 4: HuggingFace Pipeline Fallback
        if self._hf_pipeline is not None:
            try:
                results = self._hf_pipeline(target_text)[0]
                raw_scores = {r["label"]: round(r["score"], 4) for r in results}
                top = max(results, key=lambda x: x["score"])
                base_emotion = _BASE_MAPPING.get(top["label"], "Neutral")
                refined_emotion = _refine_emotion(base_emotion, target_text)

                mapped_scores = {}
                for r in results:
                    cat = _refine_emotion(_BASE_MAPPING.get(r["label"], "Neutral"), target_text)
                    mapped_scores[cat] = round(mapped_scores.get(cat, 0) + r["score"], 4)

                return {
                    "emotion": refined_emotion,
                    "confidence": round(top["score"], 4),
                    "raw_scores": raw_scores,
                    "all_mapped_scores": mapped_scores,
                    "detected_language": detected_lang,
                    "engine": "huggingface",
                }
            except Exception as e:
                logger.error(f"Error in HuggingFace inference: {e}")

        # Step 5: Heuristic Fallback Engine
        res = self._fallback_detect(target_text)
        res["detected_language"] = detected_lang
        return res

    def _neutral_result(self) -> Dict:
        return {
            "emotion": "Neutral",
            "confidence": 1.0,
            "raw_scores": {"Neutral": 1.0},
            "all_mapped_scores": {"Neutral": 1.0},
            "detected_language": "en",
            "engine": "default",
        }

    def _fallback_detect(self, text: str) -> Dict:
        """Heuristic keyword fallback engine."""
        text_lower = text.lower()
        if any(w in text_lower for w in ["happy", "joy", "great", "wonderful", "excited", "feliz", "heureux", "glücklich", "kushi"]):
            emotion = "Happy"
        elif any(w in text_lower for w in ["sad", "depressed", "cry", "grief", "hopeless", "triste", "traurig"]):
            emotion = "Sad"
        elif any(w in text_lower for w in ["angry", "anger", "furious", "rage", "frustrated", "enojado", "wütend", "gussa"]):
            emotion = "Angry"
        elif any(w in text_lower for w in ["anxious", "anxiety", "panic", "nervous", "worry", "ansioso", "ängstlich", "darr"]):
            emotion = "Anxiety"
        elif any(w in text_lower for w in ["stressed", "overwhelmed", "exhausted", "burnout", "estresado", "pareshan"]):
            emotion = "Stress"
        elif any(w in text_lower for w in ["scared", "afraid", "fear", "terrified", "miedo"]):
            emotion = "Fear"
        elif any(w in text_lower for w in ["alone", "lonely", "isolated", "nobody", "solo", "akela"]):
            emotion = "Lonely"
        else:
            emotion = "Neutral"

        return {
            "emotion": emotion,
            "confidence": 0.6,
            "raw_scores": {"fallback": 1.0},
            "all_mapped_scores": {emotion: 0.6, "Neutral": 0.4},
            "engine": "heuristic",
        }


# Module-level singleton
emotion_detector = EmotionDetector()
