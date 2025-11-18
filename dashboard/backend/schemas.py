from pydantic import BaseModel
from datetime import datetime
from typing import Optional

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

class RequestUpdate(BaseModel):
    status: str
    override_start_time: Optional[datetime] = None
    override_end_time: Optional[datetime] = None

class StreetlightBase(BaseModel):
    status: str #changed

class StreetlightCreate(StreetlightBase):
    id: int #changed

class Streetlight(StreetlightBase):
    id: int

    class Config:
        from_attributes = True
        
class StreetlightStatusUpdate(BaseModel):
    status: str

class LogBase(BaseModel):
    streetlight_id: int
    status: str

class LogCreate(LogBase):
    pass

class Log(LogBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True