from pydantic import Field
from schemas.friend_request import WSMessage


class MarkRead(WSMessage):
    notification_ids: list[int] = Field(min_length=1, max_length=100)
