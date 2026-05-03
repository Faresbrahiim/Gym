from __future__ import annotations

from uuid import UUID

from sqlalchemy import desc, select

from app.db.database import AsyncSessionLocal
from app.models.recommendation import Recommendation, RecommendationType


class RecommendationRepository:
    async def create(
        self,
        user_id: str,
        recommendation_type: str,
        question: str,
        prompt_used: str | None,
        response: str,
    ) -> Recommendation:
        recommendation = Recommendation(
            user_id=self._parse_user_id(user_id),
            type=RecommendationType(recommendation_type),
            question=question,
            prompt_used=prompt_used,
            response=response,
        )

        async with AsyncSessionLocal() as session:
            session.add(recommendation)
            await session.commit()
            await session.refresh(recommendation)

        return recommendation

    async def list_for_user(self, user_id: str, limit: int = 20) -> list[Recommendation]:
        parsed_user_id = self._parse_user_id(user_id)

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Recommendation)
                .where(Recommendation.user_id == parsed_user_id)
                .order_by(desc(Recommendation.created_at))
                .limit(limit)
            )

        return list(result.scalars().all())

    @staticmethod
    def _parse_user_id(user_id: str) -> UUID:
        try:
            return UUID(user_id)
        except ValueError as exc:
            raise ValueError(f"Invalid user_id '{user_id}'. Expected a UUID.") from exc
