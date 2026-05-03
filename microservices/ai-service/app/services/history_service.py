from __future__ import annotations

from app.contracts import RecommendationStore
from app.schemas.recommendations import RecommendationHistoryItem, RecommendationHistoryResponse


class RecommendationHistoryService:
    def __init__(self, recommendation_store: RecommendationStore) -> None:
        self._recommendation_store = recommendation_store

    async def list_history(self, user_id: str, limit: int = 20) -> RecommendationHistoryResponse:
        recommendations = await self._recommendation_store.list_for_user(user_id, limit)

        return RecommendationHistoryResponse(
            history=[
                RecommendationHistoryItem(
                    id=item.id,
                    user_id=item.user_id,
                    type=item.type.value,
                    question=item.question,
                    recommendation=item.response,
                    created_at=item.created_at,
                )
                for item in recommendations
            ]
        )
