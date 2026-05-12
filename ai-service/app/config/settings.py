from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    MONGO_URI: str

   # Ports
    AI_SERVICE_PORT: int = 8000

    # Service URLs
    AI_SERVICE_URL: str = 'http://localhost:8000'

    # File upload
    MAX_FILE_SIZE_MB: int = 5
    
    # AI Model
    EMBEDDING_MODEL: str = 'all-MiniLM-L6-v2'
    HF_TOKEN:str

    # AI parser fallback
    PARSER_AI_ENABLED: bool = False
    PARSER_AI_URL: Optional[str] = None
    PARSER_AI_API_KEY: Optional[str] = None
    PARSER_AI_TIMEOUT_SECONDS: float = 20.0

@lru_cache()  # only reads and validates once, reuses after
def get_settings() -> Settings:
    return Settings()
