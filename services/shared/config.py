from pydantic_settings import BaseSettings


class BaseServiceSettings(BaseSettings):
    JWT_PUBLIC_KEY: str = ""
    JWT_ALGORITHMS: list[str] = ["RS256"]
