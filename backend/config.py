from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = 'Atmos Weather'
    debug: bool = False

settings = Settings()
