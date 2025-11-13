from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, database
from .database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

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

@app.patch("/api/requests/{request_id}")
def update_request(request_id: int, request_update: schemas.RequestUpdate, db: Session = Depends(get_db)):
    db_issue = db.query(models.Issue).filter(models.Issue.id == request_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Request not found")
    
    db_issue.status = request_update.status
    if request_update.override_start_time:
        db_issue.override_start_time = request_update.override_start_time
    if request_update.override_end_time:
        db_issue.override_end_time = request_update.override_end_time
        
    db.commit()
    db.refresh(db_issue)
    return db_issue

@app.get("/api/admin/requests")
def get_admin_requests(db: Session = Depends(get_db)):
    return db.query(models.Issue).all()

@app.get("/api/streetlights", response_model=list[schemas.Streetlight])
def get_streetlights(db: Session = Depends(get_db)):
    return db.query(models.Streetlight).all()


@app.post("/api/streetlights", response_model=schemas.Streetlight)
def create_streetlight(streetlight: schemas.StreetlightCreate, db: Session = Depends(get_db)):
    db_streetlight = models.Streetlight(name=streetlight.name, status=streetlight.status)
    db.add(db_streetlight)
    db.commit()
    db.refresh(db_streetlight)
    return db_streetlight

@app.patch("/api/streetlights/{streetlight_id}", response_model=schemas.Streetlight)
def update_streetlight_status(
    streetlight_id: int, 
    streetlight_update: schemas.StreetlightStatusUpdate, 
    db: Session = Depends(get_db)
):
    db_streetlight = db.query(models.Streetlight).filter(models.Streetlight.id == streetlight_id).first()
    if db_streetlight is None:
        raise HTTPException(status_code=404, detail="Streetlight not found")
    
    db_streetlight.status = streetlight_update.status
    db.commit()
    db.refresh(db_streetlight)
    return db_streetlight

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

@app.post("/api/logs", response_model=schemas.Log)
def create_log_entry(log: schemas.LogCreate, db: Session = Depends(get_db)):
    db_log = models.Log(streetlight_id=log.streetlight_id, status=log.status)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/api/logs/{streetlight_id}", response_model=list[schemas.Log])
def get_logs_for_streetlight(streetlight_id: int, db: Session = Depends(get_db)):
    logs = db.query(models.Log).filter(models.Log.streetlight_id == streetlight_id).all()
    return logs

@app.get("/api/users/{username}/requests")
def get_user_requests(username: str, db: Session = Depends(get_db)):
    return db.query(models.Issue).filter(models.Issue.submitted_by_user == username).all()

@app.get("/api/overrides/schedule")
def get_active_overrides(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return db.query(models.Issue).filter(
        models.Issue.status == "Approved",
        models.Issue.override_start_time <= now,
        models.Issue.override_end_time >= now
    ).all()
