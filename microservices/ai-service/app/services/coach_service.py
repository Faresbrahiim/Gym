from app.contracts import (
    IntentDetector,
    LlmGenerator,
    PromptBuilderContract,
    RagSearcher,
    RecommendationStore,
    UserProfileReader,
)
from app.schemas.recommendations import RecommendationResponse


class CoachService:
    def __init__(
        self,
        user_profile_reader: UserProfileReader,
        intent_detector: IntentDetector,
        rag_searcher: RagSearcher,
        prompt_builder: PromptBuilderContract,
        llm_generator: LlmGenerator,
        recommendation_store: RecommendationStore,
    ) -> None:
        self._user_profile_reader = user_profile_reader
        self._intent_detector = intent_detector
        self._rag_searcher = rag_searcher
        self._prompt_builder = prompt_builder
        self._llm_generator = llm_generator
        self._recommendation_store = recommendation_store

    async def generate(self, user_id: str, question: str) -> RecommendationResponse:
        profil = await self._user_profile_reader.get_profile(user_id)

        intent = self._intent_detector.detect(question)
        print(f"Intent detecte : {intent}")

        docs = []
        if intent != "greeting":
            docs = await self._rag_searcher.search(question)

        prompt = self._prompt_builder.build(profil.model_dump(), docs, question, intent)
        response = await self._llm_generator.generate(prompt)
        recommendation = await self._recommendation_store.create(
            user_id=user_id,
            recommendation_type=intent,
            question=question,
            prompt_used=prompt,
            response=response,
        )

        return RecommendationResponse(
            id=recommendation.id,
            user_id=recommendation.user_id,
            question=question,
            intent=intent,
            recommendation=response,
            created_at=recommendation.created_at,
        )
