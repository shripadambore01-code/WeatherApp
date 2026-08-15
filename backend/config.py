import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    app_name: str = 'Atmos Weather'
    debug: bool = False
    gemini_api_key: Optional[str] = os.getenv('GEMINI_API_KEY', '')

    class Config:
        env_file = '.env'
        extra = 'ignore'

settings = Settings()
