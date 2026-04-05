from fastapi import UploadFile, File, APIRouter, Depends
from upload_service import upload_file
from core.auth_token import validate_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.redis import rate_limit
from shared.metrics import upload_requests_total, upload_bytes_total

security = HTTPBearer() # handles http header parsing
upload_router = APIRouter()



@upload_router.post("/upload/")
async def upload_route(credentials: HTTPAuthorizationCredentials = Depends(security), file: UploadFile = File(...)):
    sender_id, sender_email = validate_token(credentials.credentials)
    contents = await file.read()
    await rate_limit(sender_email, file, len(contents))
    result = await upload_file(sender_id, file, contents)
    base_type = file.content_type.split(";")[0].strip() if file.content_type else "unknown"
    upload_requests_total.add(1, {"content_type": base_type})
    upload_bytes_total.add(len(contents))
    return result
