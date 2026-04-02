from pydantic import BaseModel


class FileMessage(BaseModel):
    to: str
    url: str
