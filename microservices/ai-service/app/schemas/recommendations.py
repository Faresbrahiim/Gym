from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    question: str = Field(min_length=1)
    user_id: UUID


class RecommendationResponse(BaseModel):
    id: UUID
    user_id: UUID
    question: str
    intent: str
    recommendation: str
    created_at: datetime


class RecommendationHistoryItem(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    question: str
    recommendation: str
    created_at: datetime


class RecommendationHistoryResponse(BaseModel):
    history: list[RecommendationHistoryItem]


class HealthResponse(BaseModel):
    status: str
    service: str


class UserProfileContext(BaseModel):
    firstName: str = "cher membre"
    age: int | None = None
    weight_kg: int | None = None
    height_cm: int | None = None
    fitness_goal: str | None = None
    experience_level: str | None = None
    gender: str | None = None
