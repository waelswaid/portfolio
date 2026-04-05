async def check_postgres(engine) -> dict:
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"postgres": "ok"}
    except Exception as e:
        return {"postgres": str(e)}


async def check_redis(redis_url: str) -> dict:
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(redis_url)
        try:
            await r.ping()
            return {"redis": "ok"}
        finally:
            await r.aclose()
    except Exception as e:
        return {"redis": str(e)}


async def check_kafka(bootstrap_servers: str) -> dict:
    try:
        from aiokafka import AIOKafkaProducer
        p = AIOKafkaProducer(bootstrap_servers=bootstrap_servers, request_timeout_ms=3000)
        try:
            await p.start()
            return {"kafka": "ok"}
        finally:
            await p.stop()
    except Exception as e:
        return {"kafka": str(e)}


def build_health_response(checks: dict) -> dict:
    all_ok = all(v == "ok" for v in checks.values())
    return {
        "status": "ok" if all_ok else "degraded",
        "checks": checks,
    }
