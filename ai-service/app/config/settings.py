from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    # Database
    MONGO_URI: str

    # Auth
    JWT_SECRET: str
    JWT_EXPIRES_IN: str = '7d'

    # Ports
    BACKEND_PORT: int = 5000
    AI_SERVICE_PORT: int = 8000

    # Service URLs
    AI_SERVICE_URL: str = 'http://localhost:8000'

    # File upload
    MAX_FILE_SIZE_MB: int = 5

    class Config:
        # Points to the root .env, one level above ai-service/
        env_file = '.env'
        env_file_encoding = 'utf-8'

@lru_cache()  # only reads and validates once, reuses after
def get_settings() -> Settings:
    return Settings()