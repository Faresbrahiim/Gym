from __future__ import annotations

from uuid import UUID

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.feedback import Feedback


class FeedbackRepository:
    async def upsert_for_recommendation(
        self,
        recommendation_id: str,
        rating: int,
        comment: str | None,
    ) -> Feedback:
        parsed_recommendation_id = self._parse_uuid(recommendation_id, "recommendation_id")

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Feedback).where(Feedback.recommendation_id == parsed_recommendation_id)
            )
            feedback = result.scalar_one_or_none()

            if feedback is None:
                feedback = Feedback(
                    recommendation_id=parsed_recommendation_id,
                    rating=rating,
                    comment=comment,
                )
                session.add(feedback)
            else:
                feedback.rating = rating
                feedback.comment = comment

            await session.commit()
            await session.refresh(feedback)

        return feedback

    @staticmethod
    def _parse_uuid(value: str, field_name: str) -> UUID:
        try:
            return UUID(value)
        except ValueError as exc:
            raise ValueError(f"Invalid {field_name} '{value}'. Expected a UUID.") from exc
