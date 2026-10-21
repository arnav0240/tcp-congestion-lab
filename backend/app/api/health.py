"""
Health check and environment status endpoint.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import get_db
from app.simulation.ns3_runner import ns3_runner

router = APIRouter()

@router.get("/health")
def get_health(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    engine_status = ns3_runner.get_status()
    
    return {
        "status": "healthy" if db_ok else "degraded",
        "database_connected": db_ok,
        "engine": engine_status,
        "supported_algorithms": ["reno", "newreno", "cubic", "bbr"],
        "api_version": "v1"
    }
