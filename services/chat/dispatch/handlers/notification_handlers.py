from dispatch.registry import handles
from dispatch.context import RequestContext
from schemas.notification import MarkRead
from pydantic import ValidationError


@handles("unread_notifications")
async def handle_unread_notifications(ctx: RequestContext) -> None:
    notifications = await ctx.deps.notification_service.get_unread(ctx.user_id)
    await ctx.websocket.send_json({"type": "unread_notifications", "notifications": notifications})


@handles("mark_read")
async def handle_mark_read(ctx: RequestContext) -> None:
    try:
        req = MarkRead(**ctx.data)
    except ValidationError:
        await ctx.websocket.send_json({"type": "error", "message": "invalid payload"})
        return
    count = await ctx.deps.notification_service.mark_read(ctx.user_id, req.notification_ids)
    await ctx.websocket.send_json({"type": "marked_read", "count": count})
