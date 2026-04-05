from dispatch.registry import handles
from dispatch.context import RequestContext
from schemas.friend_request import FriendRequest, FriendAccept, FriendDecline, FriendRemove
from services.friend_service import (
    send_friend_request, friend_request_accept, friend_request_declined,
    friend_remove, return_friend_list, return_pending_list,
)
from connection_manager import manager
from pydantic import ValidationError

# helper function that sends the response back to the caller, sends the notify back to the other user
async def _send_result(ctx: RequestContext, result: dict) -> None:
    await ctx.websocket.send_json(result["response"])
    for target_id, payload in result.get("notify", []):
        ws = manager.get_connection(target_id)
        if ws:
            try:
                await ws.send_json(payload)
            except Exception:
                pass


@handles("friend_request")
async def handle_friend_request(ctx: RequestContext) -> None:
    try:
        req = FriendRequest(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "error", "message": "invalid payload"})
        return
    result = await send_friend_request(req.to, ctx.user_id, ctx.user_email)
    await _send_result(ctx, result)


@handles("friend_accept")
async def handle_friend_accept(ctx: RequestContext) -> None:
    try:
        req = FriendAccept(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "error", "message": "invalid payload"})
        return
    result = await friend_request_accept(req.from_user, ctx.user_id, ctx.user_email)
    await _send_result(ctx, result)


@handles("friend_decline")
async def handle_friend_decline(ctx: RequestContext) -> None:
    try:
        req = FriendDecline(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "error", "message": "invalid payload"})
        return
    result = await friend_request_declined(req.from_user, ctx.user_id)
    await _send_result(ctx, result)


@handles("friend_remove")
async def handle_friend_remove(ctx: RequestContext) -> None:
    try:
        req = FriendRemove(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "error", "message": "invalid payload"})
        return
    result = await friend_remove(req.user_id, ctx.user_id)
    await _send_result(ctx, result)


@handles("friend_list")
async def handle_friend_list(ctx: RequestContext) -> None:
    result = await return_friend_list(ctx.user_id)
    await _send_result(ctx, result)


@handles("pending_list")
async def handle_pending_list(ctx: RequestContext) -> None:
    result = await return_pending_list(ctx.user_id)
    await _send_result(ctx, result)
