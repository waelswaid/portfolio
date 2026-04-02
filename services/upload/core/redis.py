import redis.asyncio as redis
from core.config import settings
from fastapi import UploadFile, HTTPException

# parses the url (host="redis", port=6379, db=1)
redis_client = redis.from_url(settings.REDIS_URL)

RATE_LIMIT_BY_NUM_SCRIPT = """
local count = redis.call('INCR', KEYS[1])
if count == 1 then
redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
"""

RATE_LIMIT_BY_SIZE_SCRIPT = """
local size = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local count = redis.call('INCRBY', KEYS[1], size)
if count == size then
    redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
end
if count > limit then
    return 1
end
return 0
"""

rate_limit_script = redis_client.register_script(RATE_LIMIT_BY_NUM_SCRIPT)
size_rate_limit_script = redis_client.register_script(RATE_LIMIT_BY_SIZE_SCRIPT)

# In the function
async def rate_limit_by_num(sender_email: str) -> None:
    redis_key = f"rate:num:{sender_email}"
    count = int(await rate_limit_script(keys=[redis_key], args=[settings.UPLOAD_LIMIT_TTL]))
    if count > settings.UPLOAD_RATE_LIMIT:
        raise HTTPException(status_code=429, detail="too many uploads, try again later")


async def rate_limit_by_size(sender_email:str, file_size: int)->None:
     redis_key = f"rate:size:{sender_email}"
     result = int(await size_rate_limit_script(keys=[redis_key], args=[settings.UPLOAD_LIMIT_TTL, file_size, settings.SIZE_RATE_LIMIT]))
     if result == 1:
         raise HTTPException(status_code=429, detail="too many uploads, try again later")


async def rate_limit(sender_email:str, file:UploadFile, file_size:int) -> None:
    is_audio = file.content_type and file.content_type.startswith("audio/")
    if not is_audio:
        await rate_limit_by_num(sender_email)
    else:
        await rate_limit_by_size(sender_email, file_size)
    return
