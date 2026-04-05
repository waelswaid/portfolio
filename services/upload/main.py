from fastapi import FastAPI
from contextlib import asynccontextmanager
from shared.observability import init_observability, shutdown_observability
from shared.health import check_redis, build_health_response
from upload_route import upload_router
from core.config import settings

init_observability("upload")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    shutdown_observability()


app = FastAPI(lifespan=lifespan)


@app.get("/health")
async def health():
    checks = {}
    checks.update(await check_redis(settings.REDIS_URL))
    return build_health_response(checks)


app.include_router(upload_router, prefix="/server")
