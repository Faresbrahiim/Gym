from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    GROQ_API_KEY: str = ""
    USER_SERVICE_URL: str = ""
    MEMBERSHIP_SERVICE_URL: str = ""
    INTERNAL_TOKEN: str = ""
    SQL_ECHO: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:4200"

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
