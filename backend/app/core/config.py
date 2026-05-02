import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # We use the URL-encoded format for the password
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://postgres:Pooja%23Kamalapur%40278@db.ipuzuhvqxfaixdtrebqm.supabase.co:5432/postgres"
    )
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "marine-aria-495106-s3")
    GCP_REGION: str = os.getenv("GCP_REGION", "us-central1")
    
    # JWT configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-development-only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
