from core.config import settings
import jwt



public_key = settings.JWT_PUBLIC_KEY

def validate_token(token: str) -> tuple[str,str]:
    try:
        decoded = jwt.decode(token, public_key, algorithms=["RS256"])
    except jwt.PyJWTError:
        raise Exception("invalid or expired token")
    user_id = decoded.get("sub")
    if not user_id:
        raise Exception("invalid token: missing sub")
    user_email = decoded.get("email")
    if not user_email:
        raise Exception("email not included in token")
    return str(user_id), str(user_email)
