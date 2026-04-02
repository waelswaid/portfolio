from pydantic import BaseModel




class Message(BaseModel):
    to: str
    message: str



class LoadHistory(BaseModel):
    dm_key: str
    before: int | None = None