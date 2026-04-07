import logging
from dispatch.registry import handles
from dispatch.context import RequestContext
from schemas.friend_request import FriendRequest, FriendAccept, FriendDecline, FriendRemove
from pydantic import ValidationError

logger = logging.getLogger(__name__)


# helper function that sends the response back to the caller, sends the notify back to the other user
async def _send_result(ctx: RequestContext, result: dict) -> None:
    await ctx.websocket.send_json(result["response"])
    for target_id, payload in result.get("notify", []):
        ws = ctx.deps.manager.get_connection(target_id)
        if ws:
            try:
                await ws.send_json(payload)
            except Exception as exc:
                logger.error("failed to send notification to user %s: %s", target_id, exc)


@handles("friend_request")
async def handle_friend_request(ctx: RequestContext) -> None:
    try:
        req = FriendRequest(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "error", "message": "invalid payload"})
        return
    result = await ctx.deps.friend_service.send_friend_request(req.to, ctx.user_id, ctx.user_email)
    await _send_result(ctx, result)


@handles("friend_accept")
async def handle_friend_accept(ctx: RequestContext) -> None:
    try:
        req = FriendAccept(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "error", "message": "invalid payload"})
        return
    result = await ctx.deps.friend_service.friend_request_accept(req.from_user, ctx.user_id, ctx.user_email)
    await _send_result(ctx, result)


@handles("friend_decline")
async def handle_friend_decline(ctx: RequestContext) -> None:
    try:
        req = FriendDecline(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "error", "message": "invalid payload"})
        return
    result = await ctx.deps.friend_service.friend_request_declined(req.from_user, ctx.user_id)
    await _send_result(ctx, result)


@handles("friend_remove")
async def handle_friend_remove(ctx: RequestContext) -> None:
    try:
        req = FriendRemove(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "error", "message": "invalid payload"})
        return
    result = await ctx.deps.friend_service.friend_remove(req.user_id, ctx.user_id)
    await _send_result(ctx, result)


@handles("friend_list")
async def handle_friend_list(ctx: RequestContext) -> None:
    result = await ctx.deps.friend_service.return_friend_list(ctx.user_id)
    await _send_result(ctx, result)


@handles("pending_list")
async def handle_pending_list(ctx: RequestContext) -> None:
    result = await ctx.deps.friend_service.return_pending_list(ctx.user_id)
    await _send_result(ctx, result)
