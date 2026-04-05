from pydantic_settings import BaseSettings


class BaseServiceSettings(BaseSettings):
    JWT_PUBLIC_KEY: str = ""
    JWT_ALGORITHMS: list[str] = ["RS256"]
    OTEL_SERVICE_NAME: str = "unknown"
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"
