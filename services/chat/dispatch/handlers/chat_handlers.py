import logging
from dispatch.registry import handles
from dispatch.context import RequestContext, Deps
from schemas.message import Message, LoadHistory
from schemas.file_message import FileMessage
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError

logger = logging.getLogger(__name__)


async def _send_message(msg_type: str, message: str, sender_id: str, receiver_id: str, deps: Deps) -> None:
    """Orchestrates: ensure chat → persist (Kafka or DB fallback) → deliver via WebSocket."""
    chat_id = await deps.chat_service.ensure_chat_exists(sender_id, receiver_id)
    try:
        await deps.producer.produce(msg_type, message, sender_id, receiver_id, chat_id)
    except Exception:
        logger.warning("Kafka produce failed, falling back to direct DB write", exc_info=True)
        await deps.chat_service.persist_message(msg_type, message, sender_id, chat_id)
    await deps.manager.send_personal_message(msg_type, receiver_id, message, sender_id)


@handles("message")
async def handle_message(ctx: RequestContext) -> None:
    try:
        message_model = Message(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "message_error", "message": "invalid payload"})
        return
    try:
        await _send_message("message", message_model.message, ctx.user_id, message_model.to, ctx.deps)
    except SQLAlchemyError:
        await ctx.websocket.send_json({"type": "message_error", "message": "failed to send"})


@handles("file_upload")
async def handle_file_upload(ctx: RequestContext) -> None:
    try:
        file_received = FileMessage(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "message_error", "message": "invalid payload"})
        return
    try:
        await _send_message("file_upload", file_received.url, ctx.user_id, file_received.to, ctx.deps)
    except SQLAlchemyError:
        await ctx.websocket.send_json({"type": "message_error", "message": "failed to send"})


@handles("load_history")
async def handle_load_history(ctx: RequestContext) -> None:
    try:
        load_history = LoadHistory(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "load_history_error", "message": "invalid payload"})
        return
    await ctx.websocket.send_json(await ctx.deps.chat_service.load_chat(load_history.dm_key, load_history.before, ctx.user_id))


@handles("chat_list")
async def handle_chat_list(ctx: RequestContext) -> None:
    await ctx.websocket.send_json(await ctx.deps.chat_service.chat_list(ctx.user_id))
