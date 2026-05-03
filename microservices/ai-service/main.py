from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.core.config import settings
from app.db.database import init_db
from app.services.coach_service import coach_service

app = FastAPI(title="Service Coach IA", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendRequest(BaseModel):
    question: str
    user_id: str = "default-user"

@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/health")
def health():
    return {"status": "ok", "service": "Coach IA"}

@app.post("/recommend")
async def recommend(request: RecommendRequest):
    profil = {
        "firstName": "Ahmed",
        "age": 25,
        "weight_kg": 90,
        "height_cm": 180,
        "fitness_goal": "perte de poids",
        "experience_level": "debutant"
    }
    result = await coach_service.generate(
        user_id=request.user_id,
        question=request.question,
        profil=profil
    )
    return result

@app.get("/history")
def history():
    return {"history": []}
