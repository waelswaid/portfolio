from dataclasses import dataclass
from fastapi import WebSocket


@dataclass
class RequestContext:
    user_id: str
    user_email: str
    websocket: WebSocket
    data: dict


"""
The @dataclass decorator auto-generates __init__, __repr__, __eq__, and other methods based on the class's type-annotated fields.
without it, this would be: 


class RequestContext:
    def __init__(self, user_id: str, user_email: str, websocket: WebSocket, data: dict):
        self.user_id = user_id
        self.user_email = user_email
        self.websocket = websocket
        self.data = data

    def __repr__(self):
        return (
            f"RequestContext(user_id={self.user_id!r}, user_email={self.user_email!r}, "
            f"websocket={self.websocket!r}, data={self.data!r})"
        )

    def __eq__(self, other):
        if not isinstance(other, RequestContext):
            return NotImplemented
        return (
            self.user_id == other.user_id
            and self.user_email == other.user_email
            and self.websocket == other.websocket
            and self.data == other.data
        )
"""