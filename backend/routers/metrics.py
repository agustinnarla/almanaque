from datetime import date

from fastapi import APIRouter, Depends, Query
import sqlite3

from db_manager import get_db_connection
from repositories.metrics_repo import fetch_metrics

router = APIRouter(prefix="/api", tags=["metrics"])


@router.get("/metrics")
def list_metrics(
    start_date: date = Query(...),
    end_date: date = Query(...),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return fetch_metrics(conn, start_date, end_date)
