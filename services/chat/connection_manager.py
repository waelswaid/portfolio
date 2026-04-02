import asyncio
import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)

GRACE_PERIOD_SECONDS = 300  # 5 minutes

class ConnectionManager:
    def __init__(self):
        # {user_id: {"websocket": WebSocket | None, "email": str}}
        # websocket is None when user is in grace period (disconnected but timer still running)
        self.active_connections: dict[str, dict] = {}

        # tracks pending disconnect timers: {user_id: asyncio.Task}
        self.pending_disconnects: dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, user_id: str, user_email: str) -> bool:
        """
        Returns True if user was already online (grace period reconnect or tab replace) — skip user_joined broadcast.
        Returns False if this is a fresh connection.
        """
        await websocket.accept()

        # reconnecting during grace period — cancel timer, restore websocket
        if user_id in self.pending_disconnects:
            self.pending_disconnects[user_id].cancel()
            del self.pending_disconnects[user_id]
            self.active_connections[user_id]["websocket"] = websocket
            return True

        # already connected from another tab replace the old websocket
        # update reference first, then close old. ordering matters:
        # old tab's disconnect() will fire but the identity check makes it a no-op
        if user_id in self.active_connections and self.active_connections[user_id]["websocket"] is not None:
            old_ws = self.active_connections[user_id]["websocket"]
            self.active_connections[user_id]["websocket"] = websocket
            await old_ws.close()
            return True

        # fresh connection
        self.active_connections[user_id] = {"websocket": websocket, "email": user_email}
        return False

    async def disconnect(self, user_id: str, websocket: WebSocket):
        """
        Start grace period instead of removing user immediately.
        User stays in active_connections with websocket=None so they appear online.
        """
        if user_id not in self.active_connections:
            return

        # stale connection (replaced by a newer tab) — ignore
        if self.active_connections[user_id]["websocket"] is not websocket:
            return

        # set websocket to None — user appears online but can't receive messages in real time
        self.active_connections[user_id]["websocket"] = None

        # if there's already a pending disconnect (rapid disconnect/reconnect/disconnect),
        # cancel the old timer and start a new one
        if user_id in self.pending_disconnects:
            self.pending_disconnects[user_id].cancel()

        # start grace period timer
        task = asyncio.create_task(self._grace_period_disconnect(user_id))
        self.pending_disconnects[user_id] = task

    async def _grace_period_disconnect(self, user_id: str):
        """
        waits for grace period to expire, then fully disconnects the user.
        If the user reconnects before this completes, the task gets cancelled.
        """
        try:
            await asyncio.sleep(GRACE_PERIOD_SECONDS)

            # grace period expired without reconnect, user is removed
            email = self.active_connections[user_id]["email"]
            del self.active_connections[user_id]
            del self.pending_disconnects[user_id]
            await self.broadcast({"type": "user_left", "user_id": user_id, "email": email})
        except asyncio.CancelledError:
            # user reconnected in time — do nothing
            pass

    async def send_personal_message(self, msg_type: str, to: str, message: str, sender_id: str):
        # active_connections --> {user_id: {"websocket": websocket | None, "email": user_email}}
        to_conn = self.active_connections.get(to)
        sender_conn = self.active_connections.get(sender_id)
        if not to_conn or not sender_conn:
            return

        # recipient is in grace period — skip sending, message is already persisted in DB
        # they'll load it via load_history on reconnect
        if to_conn["websocket"] is None:
            return

        # email is the human readable display name for the "from" field,
        # and user_id is the internal lookup key for routing
        sender_email = sender_conn["email"]
        try:
            await to_conn["websocket"].send_json({"type": msg_type, "from": sender_email, "from_id": sender_id, "message": message})
        except Exception:
            logger.warning("send_personal_message failed for user %s", to)

    async def broadcast(self, message: dict):
        for inner in self.active_connections.values():
            # skip users in grace period (no active websocket)
            if inner["websocket"] is not None:
                try:
                    await inner["websocket"].send_json(message)
                except Exception:
                    logger.warning("broadcast send failed for a connection")

    def get_connection(self, user_id: str) -> WebSocket | None:
        inner = self.active_connections.get(user_id)
        if inner:
            return inner["websocket"]
        return None

    def get_email(self, user_id: str) -> str | None:
        inner = self.active_connections.get(user_id)
        if inner:
            return inner["email"]
        return None

    def get_online_users(self) -> list[dict]:
        # includes users in grace period
        return [
            {"user_id": uid, "email": inner["email"]}
            for uid, inner in self.active_connections.items()
        ]

    def cancel_all_pending(self):
        """Cancel all grace period timers. Call on server shutdown."""
        for task in self.pending_disconnects.values():
            task.cancel()
        self.pending_disconnects.clear()


manager = ConnectionManager()
