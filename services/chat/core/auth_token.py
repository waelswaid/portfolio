from shared.auth import validate_token as _validate
from core.config import settings


def validate_token(token: str) -> tuple[str, str]:
    return _validate(token, settings.JWT_PUBLIC_KEY, settings.JWT_ALGORITHMS)
