"""
MindCare AI — Recommendation Schemas
"""
from typing import List, Optional
from pydantic import BaseModel


class RecommendationItemResponse(BaseModel):
    id: str
    category: str
    title: str
    author: str
    description: str
    link: str
    emotions: List[str]
    mood_effect: str
    duration: str


class CategoryItemResponse(BaseModel):
    key: str
    label: str
    icon: str


class RecommendationResponse(BaseModel):
    emotion_context: str
    category_filter: Optional[str]
    total_count: int
    recommendations: List[RecommendationItemResponse]
