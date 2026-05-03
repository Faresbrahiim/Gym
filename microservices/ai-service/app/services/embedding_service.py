from sentence_transformers import SentenceTransformer


class EmbeddingService:

    def __init__(self):
        self.model = None

    def _get_model(self) -> SentenceTransformer:
        if self.model is None:
            self.model = SentenceTransformer("all-MiniLM-L6-v2")

        return self.model

    def get_embedding(self, text: str) -> list[float]:
        vector = self._get_model().encode(text)
        return vector.tolist()


embedding_service = EmbeddingService()
