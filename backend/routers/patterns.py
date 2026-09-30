from datetime import date
import sqlite3

from fastapi import APIRouter, Depends, Query

from db_manager import get_db_connection
from repositories.metrics_repo import fetch_metrics
from services.pattern_detector import evaluate_campaigns

router = APIRouter(prefix="/api", tags=["patterns"])


@router.get("/patterns")
def list_patterns(
    start_date: date = Query(...),
    end_date: date = Query(...),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    rows = fetch_metrics(conn, start_date, end_date)
    return evaluate_campaigns(rows)
