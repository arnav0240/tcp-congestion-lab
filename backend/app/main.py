"""
FastAPI Application Entry Point for TCP Congestion Control Research Lab.
Configures CORS, routes, database initialization, and startup checks.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine, Base, SessionLocal
from app.models.experiment import Experiment
from app.api import health, algorithms, scenarios, experiments, compare, export
from app.schemas.experiment import ExperimentCreate
from app.services.experiment_service import run_experiment_task

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Verify database and seed an initial baseline experiment if database is clean."""
    db = SessionLocal()
    try:
        count = db.query(Experiment).count()
        if count == 0:
            print("Database is empty. Seeding initial baseline experiment (Lossy Wireless Comparison)...")
            initial_req = ExperimentCreate(
                title="Baseline: Lossy Wireless Network Study",
                scenario_id="lossy_wireless",
                algorithms=["reno", "newreno", "cubic", "bbr"],
                bandwidth_mbps=25.0,
                base_rtt_ms=45.0,
                jitter_ms=5.0,
                packet_loss_rate=0.02, # 2% loss
                queue_limit_packets=50,
                duration_seconds=12.0,
                flow_count=1,
                background_traffic_ratio=0.05,
                seed=42,
                repetitions=2
            )
            run_experiment_task(db, initial_req)
            print("Initial baseline experiment seeded successfully.")
    except Exception as e:
        print(f"Startup database check: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title="TCP Congestion Control Research Lab API",
    description="Backend API for simulating, analyzing, and comparing TCP Reno, NewReno, CUBIC, and BBR under varying network conditions.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api/v1
app.include_router(health.router, prefix="/api/v1", tags=["Health & System"])
app.include_router(algorithms.router, prefix="/api/v1", tags=["Algorithms"])
app.include_router(scenarios.router, prefix="/api/v1", tags=["Scenarios"])
app.include_router(experiments.router, prefix="/api/v1", tags=["Experiments"])
app.include_router(compare.router, prefix="/api/v1", tags=["Comparison"])
app.include_router(export.router, prefix="/api/v1", tags=["Exports"])

@app.get("/")
def root():
    return {
        "title": "TCP Congestion Control Research Lab",
        "description": "Interactive platform for comparing TCP Reno, NewReno, CUBIC, and BBR under configurable network conditions.",
        "api_documentation": "/api/docs",
        "health": "/api/v1/health"
    }
