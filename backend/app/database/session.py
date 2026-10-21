"""
Database configuration and session management using SQLAlchemy and SQLite.
Ensures persistent local storage that survives application and server restarts.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/lab.db"
else:
    DB_PATH = os.environ.get("LAB_DB_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "lab.db"))

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Connect args needed for SQLite multithreading support in FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
