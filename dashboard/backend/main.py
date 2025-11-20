from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from sqlalchemy import desc
from . import models, schemas, database
from .database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # dotenv is optional in production — env vars can be set by the environment
    pass

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [FRONTEND_URL]

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

# --- AUTH & REQUESTS ---

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

# --- STREETLIGHTS ---

@app.get("/api/streetlights", response_model=list[schemas.Streetlight])
def get_streetlights(db: Session = Depends(get_db)):
    return db.query(models.Streetlight).all()

@app.post("/api/streetlights", response_model=schemas.Streetlight)
def create_streetlight(streetlight: schemas.StreetlightCreate, db: Session = Depends(get_db)):
    existing_light = db.query(models.Streetlight).filter(models.Streetlight.id == streetlight.id).first()
    if existing_light:
        raise HTTPException(status_code=400, detail="Streetlight ID already registered")
    db_streetlight = models.Streetlight(id=streetlight.id, status=streetlight.status)
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

# --- USERS & LOGS ---

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
    db_log = models.Log(
        streetlight_id=log.streetlight_id,
        status=log.status,
        timestamp=log.timestamp
    )
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

# --- ANALYTICS HELPER ---

def calculate_cutoff(duration: str) -> datetime:
    now = datetime.utcnow()
    if duration == "1h":
        return now - timedelta(hours=1)
    elif duration == "6h":
        return now - timedelta(hours=6)
    elif duration == "12h":
        return now - timedelta(hours=12)
    elif duration == "24h":
        return now - timedelta(hours=24)
    elif duration == "7d":
        return now - timedelta(days=7)
    elif duration == "30d":
        return now - timedelta(days=30)
    else:
        return now - timedelta(hours=24) # Default fallback

# --- ANALYTICS ENDPOINTS ---

@app.get("/api/analytics/{light_id}/timeline")
def get_light_timeline(light_id: int, duration: str = "24h", db: Session = Depends(get_db)):
    """
    Returns intervals (Start -> End) for ON/OFF/DIM status.
    Used for Gantt chart visualization.
    """
    cutoff_time = calculate_cutoff(duration)

    logs = db.query(models.Log)\
             .filter(models.Log.streetlight_id == light_id, models.Log.timestamp >= cutoff_time)\
             .order_by(models.Log.timestamp)\
             .all()

    if not logs:
        return []

    timeline = []
    current_start = logs[0].timestamp
    current_status = logs[0].status

    for i in range(1, len(logs)):
        log = logs[i]
        if log.status != current_status:
            timeline.append({
                "status": current_status,
                "start_time": current_start,
                "end_time": log.timestamp,
                "duration_minutes": (log.timestamp - current_start).total_seconds() / 60
            })
            current_status = log.status
            current_start = log.timestamp

    # Close the last interval
    timeline.append({
        "status": current_status,
        "start_time": current_start,
        "end_time": datetime.utcnow(), # Cap at 'now'
        "duration_minutes": (datetime.utcnow() - current_start).total_seconds() / 60
    })

    return timeline

@app.get("/api/analytics/{light_id}/traffic")
def get_traffic_analysis(light_id: int, duration: str = "24h", db: Session = Depends(get_db)):
    """
    Aggregates traffic data based on light status.
    - Short durations (<= 24h) bucket by HOUR.
    - Long durations (> 24h) bucket by DAY.
    """
    cutoff_time = calculate_cutoff(duration)

    logs = db.query(models.Log)\
             .filter(models.Log.streetlight_id == light_id, models.Log.timestamp >= cutoff_time)\
             .order_by(models.Log.timestamp)\
             .all()

    if not logs:
        return []

    # Determine Bucketing Strategy
    is_long_duration = duration in ["7d", "30d"]
    bucket_format = "%Y-%m-%d" if is_long_duration else "%Y-%m-%d %H:00"

    bucketed_stats = {}

    for log in logs:
        bucket_key = log.timestamp.strftime(bucket_format)

        if bucket_key not in bucketed_stats:
            bucketed_stats[bucket_key] = {"ON": 0, "DIM": 0, "OFF": 0, "total": 0}

        bucketed_stats[bucket_key][log.status] += 1
        bucketed_stats[bucket_key]["total"] += 1

    analysis_result = []

    for time_key, stats in bucketed_stats.items():
        total = stats["total"]
        if total == 0: continue

        on_ratio = stats["ON"] / total
        dim_ratio = stats["DIM"] / total
        off_ratio = stats["OFF"] / total

        traffic_desc = "Moderate"
        if off_ratio > 0.8:
            traffic_desc = "Inactive (Day)"
        elif on_ratio > 0.6:
            traffic_desc = "High Traffic"
        elif dim_ratio > 0.6:
            traffic_desc = "Low Traffic"

        analysis_result.append({
            "time_bucket": time_key,
            "traffic_level": traffic_desc,
            "activity_score": round(on_ratio * 100, 1), # Score derived from ON time
            "raw_counts": stats
        })

    # Sort chronologically
    analysis_result.sort(key=lambda x: x["time_bucket"])

    return analysis_result