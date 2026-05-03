from __future__ import annotations

from typing import Protocol

from app.models.feedback import Feedback
from app.models.recommendation import Recommendation
from app.schemas.recommendations import UserProfileContext


class UserProfileReader(Protocol):
    async def get_profile(self, user_id: str) -> UserProfileContext:
        ...


class RecommendationStore(Protocol):
    async def create(
        self,
        user_id: str,
        recommendation_type: str,
        question: str,
        prompt_used: str | None,
        response: str,
    ) -> Recommendation:
        ...

    async def list_for_user(self, user_id: str, limit: int = 20) -> list[Recommendation]:
        ...

    async def get_by_id(self, recommendation_id: str) -> Recommendation | None:
        ...


class FeedbackStore(Protocol):
    async def upsert_for_recommendation(
        self,
        recommendation_id: str,
        rating: int,
        comment: str | None,
    ) -> Feedback:
        ...


class IntentDetector(Protocol):
    def detect(self, question: str) -> str:
        ...


class RagSearcher(Protocol):
    async def search(self, question: str) -> list[str]:
        ...


class PromptBuilderContract(Protocol):
    def build(self, profil: dict, docs: list[str], question: str, intent: str = "general") -> str:
        ...


class LlmGenerator(Protocol):
    async def generate(self, prompt: str) -> str:
        ...
