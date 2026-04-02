from fastapi import UploadFile, File, APIRouter, Depends
from services.upload_service import upload_file
from core.auth_token import validate_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.redis import rate_limit

security = HTTPBearer() # handles http header parsing
upload_router = APIRouter()




@upload_router.post("/upload/")
async def upload_route(credentials: HTTPAuthorizationCredentials = Depends(security), file: UploadFile = File(...)):
    sender_id, sender_email = validate_token(credentials.credentials)
    contents = await file.read()
    await rate_limit(sender_email, file, len(contents))
    return await upload_file(sender_id, file, contents)

