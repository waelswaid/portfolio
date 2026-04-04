from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_PUBLIC_KEY : str = ""
    DATABASE_URL : str = ""
    CHAT_DATABASE_URL : str = ""
    KAFKA_BOOTSTRAP_SERVERS : str = "localhost:9092"


settings = Settings()