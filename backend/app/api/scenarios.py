"""
Scenario presets endpoint.
"""
from fastapi import APIRouter
from app.simulation.presets import list_scenarios, get_scenario

router = APIRouter()

@router.get("/scenarios")
def get_scenarios():
    """Lists standard educational presets for studying TCP under varying network regimes."""
    return {
        "count": len(list_scenarios()),
        "scenarios": list_scenarios()
    }

@router.get("/scenarios/{scenario_id}")
def get_single_scenario(scenario_id: str):
    return get_scenario(scenario_id)
