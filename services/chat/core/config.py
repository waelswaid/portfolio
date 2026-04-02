from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_PUBLIC_KEY : str = ""
    DATABASE_URL : str = ""
    CHAT_DATABASE_URL : str = ""


settings = Settings()