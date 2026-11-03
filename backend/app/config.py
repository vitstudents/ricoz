import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "LedgerAI – Continuous Bank Reconciliation & Bookkeeping Agent"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ledgerai-super-secure-production-secret-key-32bytes!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite by default for zero-setup execution, PostgreSQL supported via env
    # In Vercel serverless environment, use /tmp which is the only writable directory
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:////tmp/ledgerai.db" if os.getenv("VERCEL") else "sqlite:///./ledgerai.db"
    )
    
    CORS_ORIGINS: list[str] = ["*"]
    DEFAULT_BASE_CURRENCY: str = "USD"
    
    # LLM integration (Gemini / OpenAI optional, fallback to intelligent rule & NLP engine)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

