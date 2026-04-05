import jwt


def validate_token(token: str, public_key: str, algorithms: list[str]) -> tuple[str, str]:
    try:
        decoded = jwt.decode(token, public_key, algorithms=algorithms)
    except jwt.PyJWTError:
        raise Exception("invalid or expired token")
    user_id = decoded.get("sub")
    if not user_id:
        raise Exception("invalid token: missing sub")
    user_email = decoded.get("email")
    if not user_email:
        raise Exception("email not included in token")
    return str(user_id), str(user_email)
