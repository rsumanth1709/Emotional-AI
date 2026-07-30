"""
MindCare AI — Explainable AI Schemas
"""
from typing import List, Optional
from pydantic import BaseModel

class WordExplanation(BaseModel):
    word: str
    attention_weight: float
    shap_value: float

class ExplainabilityResponse(BaseModel):
    chat_id: str
    message_text: str
    detected_emotion: str
    confidence: float
    sentiment: str
    stress_score: float
    keywords: List[str]
    words: List[WordExplanation]
    decision_rationale: str
