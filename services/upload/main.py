from fastapi import FastAPI
from upload_route import upload_router


app = FastAPI()


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(upload_router, prefix="/server")
