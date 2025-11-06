from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, database
from .database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/login")
def login(user_login: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_login.username).first()
    if not user or user.password != user_login.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"role": user.role}

@app.post("/api/requests")
def create_request(request: schemas.RequestCreate, db: Session = Depends(get_db)):
    db_issue = models.Issue(
        submitted_by_user=request.username,
        light_id=request.light_id,
        type=request.type,
        description=request.description,
        status="pending"
    )
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    return db_issue

@app.get("/api/admin/requests")
def get_admin_requests(db: Session = Depends(get_db)):
    return db.query(models.Issue).all()

@app.post("/create_user")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_user = models.User(username=user.username, password=user.password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
