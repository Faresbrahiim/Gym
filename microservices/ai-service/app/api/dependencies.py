from __future__ import annotations

from functools import lru_cache

from app.repositories.feedback_repository import FeedbackRepository
from app.repositories.recommendation_repository import RecommendationRepository
from app.services.coach_service import CoachService
from app.services.feedback_service import FeedbackService
from app.services.history_service import RecommendationHistoryService
from app.services.user_profile_service import UserProfileService
from app.services.intent_service import IntentService
from app.services.llm_service import LLMService
from app.services.prompt_builder import PromptBuilder
from app.services.rag_service import RagService


@lru_cache
def get_recommendation_repository() -> RecommendationRepository:
    return RecommendationRepository()


@lru_cache
def get_feedback_repository() -> FeedbackRepository:
    return FeedbackRepository()


@lru_cache
def get_user_profile_service() -> UserProfileService:
    return UserProfileService()


@lru_cache
def get_intent_service() -> IntentService:
    return IntentService()


@lru_cache
def get_rag_service() -> RagService:
    return RagService()


@lru_cache
def get_prompt_builder() -> PromptBuilder:
    return PromptBuilder()


@lru_cache
def get_llm_service() -> LLMService:
    return LLMService()


@lru_cache
def get_coach_service() -> CoachService:
    return CoachService(
        user_profile_reader=get_user_profile_service(),
        intent_detector=get_intent_service(),
        rag_searcher=get_rag_service(),
        prompt_builder=get_prompt_builder(),
        llm_generator=get_llm_service(),
        recommendation_store=get_recommendation_repository(),
    )


@lru_cache
def get_history_service() -> RecommendationHistoryService:
    return RecommendationHistoryService(get_recommendation_repository())


@lru_cache
def get_feedback_service() -> FeedbackService:
    return FeedbackService(
        recommendation_store=get_recommendation_repository(),
        feedback_store=get_feedback_repository(),
    )
