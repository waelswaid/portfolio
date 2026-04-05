from pydantic import BaseModel


class ChatMessageEvent(BaseModel):
    msg_type: str
    message: str
    sender_id: str
    receiver_id: str
    chat_id: str
