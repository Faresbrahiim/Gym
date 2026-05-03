from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.dependencies import get_coach_service, get_feedback_service, get_history_service
from app.schemas.feedback import FeedbackRequest, FeedbackResponse
from app.schemas.recommendations import (
    HealthResponse,
    RecommendationHistoryResponse,
    RecommendationResponse,
    RecommendRequest,
)
from app.services.coach_service import CoachService
from app.services.feedback_service import FeedbackService
from app.services.history_service import RecommendationHistoryService

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="Coach IA")


@router.post("/recommend", response_model=RecommendationResponse)
async def recommend(
    request: RecommendRequest,
    coach_service: CoachService = Depends(get_coach_service),
) -> RecommendationResponse:
    try:
        return await coach_service.generate(
            user_id=str(request.user_id),
            question=request.question,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/history", response_model=RecommendationHistoryResponse)
async def history(
    user_id: UUID = Query(...),
    limit: int = Query(20, ge=1, le=100),
    history_service: RecommendationHistoryService = Depends(get_history_service),
) -> RecommendationHistoryResponse:
    try:
        return await history_service.list_history(str(user_id), limit)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.put("/recommendations/{recommendation_id}/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    recommendation_id: UUID,
    request: FeedbackRequest,
    feedback_service: FeedbackService = Depends(get_feedback_service),
) -> FeedbackResponse:
    try:
        return await feedback_service.submit_feedback(
            recommendation_id=str(recommendation_id),
            user_id=str(request.user_id),
            rating=request.rating,
            comment=request.comment,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
