from fastapi import FastAPI

app = FastAPI(title="Service Coach IA", version="1.0.0")

@app.on_event("startup")
async def startup():
    from app.db.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
def health():
    return {"status": "ok", "service": "Coach IA"}

@app.post("/recommend")
async def recommend():
    return {"message": "recommendation working"} 