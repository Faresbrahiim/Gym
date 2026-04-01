from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: str
    USER_SERVICE_URL: str
    INTERNAL_TOKEN: str

    class Config:
        env_file = ".env"

settings = Settings()