from __future__ import annotations

from app.contracts import FeedbackStore, RecommendationStore
from app.schemas.feedback import FeedbackResponse


class FeedbackService:
    def __init__(
        self,
        recommendation_store: RecommendationStore,
        feedback_store: FeedbackStore,
    ) -> None:
        self._recommendation_store = recommendation_store
        self._feedback_store = feedback_store

    async def submit_feedback(
        self,
        recommendation_id: str,
        user_id: str,
        rating: int,
        comment: str | None,
    ) -> FeedbackResponse:
        recommendation = await self._recommendation_store.get_by_id(recommendation_id)

        if recommendation is None:
            raise LookupError(f"Recommendation '{recommendation_id}' was not found.")

        if str(recommendation.user_id) != user_id:
            raise PermissionError("This recommendation does not belong to the provided user.")

        feedback = await self._feedback_store.upsert_for_recommendation(
            recommendation_id=recommendation_id,
            rating=rating,
            comment=comment,
        )

        return FeedbackResponse(
            id=feedback.id,
            recommendation_id=feedback.recommendation_id,
            rating=feedback.rating,
            comment=feedback.comment,
            created_at=feedback.created_at,
        )
