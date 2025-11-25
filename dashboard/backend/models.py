from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    submitted_by_user = Column(String, index=True)
    light_id = Column(Integer)
    type = Column(String)
    description = Column(String)
    status = Column(String, default="pending")
    override_start_time = Column(DateTime, nullable=True)
    override_end_time = Column(DateTime, nullable=True)
    

class Streetlight(Base):
    __tablename__ = "streetlights"
    id = Column(Integer, primary_key=True, unique=True)
    status = Column(String, default="OFF")

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"))
    status = Column(String)
    timestamp = Column(DateTime, server_default=func.now())