from pydantic import BaseModel


class Upload(BaseModel):
    to: str
    url:str