from sqlalchemy import Column, Integer, String, ForeignKey
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

class Streetlight(Base):
    __tablename__ = "streetlights"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True)
    status = Column(String, default="OFF")