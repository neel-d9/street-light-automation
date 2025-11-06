from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str

class RequestCreate(BaseModel):
    username: str
    light_id: int
    type: str
    description: str
