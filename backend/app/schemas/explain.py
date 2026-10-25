"""
MindCare AI — Explainable AI Schemas
Includes Transformer attention matrices, word SHAP scores, decision rationales,
and epistemic/aleatoric uncertainty estimates.
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel


class WordExplanation(BaseModel):
    word: str
    attention_weight: float
    shap_value: float
    impact_direction: str  # "positive", "negative", or "neutral"
    color_intensity: float  # 0.0 to 1.0


class ConfidenceInterval(BaseModel):
    lower: float
    upper: float
    margin: float


class ExplainabilityResponse(BaseModel):
    chat_id: Optional[str] = None
    message_text: str
    detected_emotion: str
    confidence: float
    sentiment: str
    stress_score: float
    keywords: List[str]
    words: List[WordExplanation]
    decision_rationale: str

    # Transformer Attention & Uncertainty Additions
    tokens: List[str]
    attention_matrix: List[List[float]]  # N x N self-attention heatmap
    head_attentions: Optional[List[List[List[float]]]] = None  # 4-head attention weights
    epistemic_uncertainty: float  # Model epistemic entropy (0.0 to 1.0)
    aleatoric_uncertainty: float  # Data aleatoric noise (0.0 to 1.0)
    confidence_interval: ConfidenceInterval
    top_emotion_probabilities: Dict[str, float]
    influential_words: List[Dict[str, Any]]
