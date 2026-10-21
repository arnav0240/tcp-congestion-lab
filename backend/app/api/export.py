"""
Export API endpoints for CSV, JSON, and Markdown downloads.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.experiment import Experiment
from app.services.export_service import (
    export_experiment_json,
    export_aggregate_metrics_csv,
    export_timeseries_csv,
    export_markdown_report
)

router = APIRouter()

@router.get("/experiments/{experiment_id}/export")
def export_experiment(
    experiment_id: str,
    format: str = Query("json", pattern="^(json|csv_metrics|csv_timeseries|markdown)$"),
    db: Session = Depends(get_db)
):
    """Exports actual experiment measurements in the requested format."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")

    safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in exp.title)[:30]

    if format == "json":
        content = export_experiment_json(exp)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="tcp_exp_{safe_title}_{exp.id[:8]}.json"'}
        )
    elif format == "csv_metrics":
        content = export_aggregate_metrics_csv(exp)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="tcp_metrics_{safe_title}_{exp.id[:8]}.csv"'}
        )
    elif format == "csv_timeseries":
        content = export_timeseries_csv(exp)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="tcp_timeseries_{safe_title}_{exp.id[:8]}.csv"'}
        )
    elif format == "markdown":
        content = export_markdown_report(exp)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="tcp_report_{safe_title}_{exp.id[:8]}.md"'}
        )
