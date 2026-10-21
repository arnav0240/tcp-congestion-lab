"""
Algorithms catalog endpoint.
"""
from fastapi import APIRouter
from app.simulation import ALGORITHM_METADATA

router = APIRouter()

@router.get("/algorithms")
def get_algorithms():
    """Lists all available TCP Congestion Control algorithms with technical specifications and RFC standards."""
    return {
        "count": len(ALGORITHM_METADATA),
        "algorithms": list(ALGORITHM_METADATA.values())
    }
