from shared.config import BaseServiceSettings

class Settings(BaseServiceSettings):
    S3_BUCKET_NAME: str = ""
    AWS_REGION: str = "us-east-1"
    CDN_DOMAIN: str = ""
    REDIS_URL: str = ""
    UPLOAD_LIMIT_TTL: int = 60 * 30  # 30 mins
    UPLOAD_RATE_LIMIT: int = 10
    SIZE_RATE_LIMIT: int = 8 * 1024 * 1024  # 8mb


settings = Settings()
