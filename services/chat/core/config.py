from shared.config import BaseServiceSettings

class Settings(BaseServiceSettings):
    DATABASE_URL: str = ""
    CHAT_DATABASE_URL: str = ""
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"


settings = Settings()
