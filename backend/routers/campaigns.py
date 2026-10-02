from datetime import date
import sqlite3

from fastapi import APIRouter, Depends, Query

from db_manager import get_db_connection
from services.routing_detector import detect_routing
from repositories.campaigns_repo import (
    build_compare_diagnostics,
    build_compare_recommendations,
    build_cross_campaign_compare,
    build_cross_campaign_diagnostics,
    build_cross_campaign_recommendations,
    build_range_recommendations,
    compute_deltas,
    get_campaign_diagnostics,
    get_daily_device_rows,
    get_daily_trend,
    get_day_metrics,
    get_device_metrics,
    get_device_rankings,
    get_hourly_rankings,
    get_hourly_trend,
    get_ranking,
    get_summary,
    list_campaigns,
)

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.get("")
def campaigns_catalog(
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return list_campaigns(conn)


@router.get("/compare-campaigns")
def cross_campaign_compare(
    campaign_a: str = Query(..., min_length=1),
    campaign_b: str = Query(..., min_length=1),
    start_date: date = Query(...),
    end_date: date = Query(...),
    min_calls: int = Query(50, ge=1),
    start_date_b: date | None = Query(None),
    end_date_b: date | None = Query(None),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return build_cross_campaign_compare(
        conn, campaign_a, campaign_b, start_date, end_date, min_calls, start_date_b, end_date_b
    )


@router.get("/compare-campaigns/diagnostics")
def cross_campaign_diagnostics(
    campaign_a: str = Query(..., min_length=1),
    campaign_b: str = Query(..., min_length=1),
    start_date: date = Query(...),
    end_date: date = Query(...),
    min_calls: int = Query(50, ge=1),
    start_date_b: date | None = Query(None),
    end_date_b: date | None = Query(None),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return build_cross_campaign_diagnostics(
        conn, campaign_a, campaign_b, start_date, end_date, min_calls, start_date_b, end_date_b
    )


@router.get("/compare-campaigns/recommendations")
def cross_campaign_recommendations(
    campaign_a: str = Query(..., min_length=1),
    campaign_b: str = Query(..., min_length=1),
    start_date: date = Query(...),
    end_date: date = Query(...),
    min_calls: int = Query(50, ge=1),
    start_date_b: date | None = Query(None),
    end_date_b: date | None = Query(None),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return build_cross_campaign_recommendations(
        conn, campaign_a, campaign_b, start_date, end_date, min_calls, start_date_b, end_date_b
    )


@router.get("/{campaign_name}/summary")
def campaign_summary(
    campaign_name: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return get_summary(conn, campaign_name, start_date, end_date)


@router.get("/{campaign_name}/compare")
def campaign_compare(
    campaign_name: str,
    date_a: date = Query(...),
    date_b: date = Query(...),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    day_a = get_day_metrics(conn, campaign_name, date_a)
    day_b = get_day_metrics(conn, campaign_name, date_b)
    return {
        "campaign": campaign_name,
        "date_a": day_a,
        "date_b": day_b,
        "deltas": compute_deltas(day_a, day_b),
    }


@router.get("/{campaign_name}/bases-ranking")
def campaign_bases_ranking(
    campaign_name: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    min_calls: int = Query(50, ge=1),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return get_ranking(conn, campaign_name, start_date, end_date, min_calls)


@router.get("/{campaign_name}/routing")
def campaign_routing(
    campaign_name: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    rows = get_daily_device_rows(conn, campaign_name, start_date, end_date)
    volume = [
        {"fecha": row["fecha"], "device": row["device"], "total_calls": row["total_calls"]}
        for row in sorted(rows, key=lambda row: (row["fecha"], row["device"]))
    ]
    return {**detect_routing(rows), "volume": volume}


@router.get("/{campaign_name}/hourly-trend")
def campaign_hourly_trend(
    campaign_name: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return get_hourly_trend(conn, campaign_name, start_date, end_date)


@router.get("/{campaign_name}/devices")
def campaign_devices(
    campaign_name: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return get_device_metrics(conn, campaign_name, start_date, end_date)


@router.get("/{campaign_name}/daily")
def campaign_daily(
    campaign_name: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return get_daily_trend(conn, campaign_name, start_date, end_date)


@router.get("/{campaign_name}/devices/ranking")
def campaign_devices_ranking(
    campaign_name: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    min_calls: int = Query(50, ge=1),
    limit: int = Query(5, ge=1),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return get_device_rankings(
        conn, campaign_name, start_date, end_date, min_calls, limit
    )


@router.get("/{campaign_name}/hours/ranking")
def campaign_hours_ranking(
    campaign_name: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    min_calls: int = Query(50, ge=1),
    limit: int = Query(5, ge=1),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return get_hourly_rankings(
        conn, campaign_name, start_date, end_date, min_calls, limit
    )


@router.get("/{campaign_name}/compare/diagnostics")
def campaign_compare_diagnostics(
    campaign_name: str,
    date_a: date = Query(...),
    date_b: date = Query(...),
    min_calls: int = Query(50, ge=1),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return build_compare_diagnostics(conn, campaign_name, date_a, date_b, min_calls)


@router.get("/{campaign_name}/compare/recommendations")
def campaign_compare_recommendations(
    campaign_name: str,
    date_a: date = Query(...),
    date_b: date = Query(...),
    min_calls: int = Query(50, ge=1),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return build_compare_recommendations(
        conn, campaign_name, date_a, date_b, min_calls
    )


@router.get("/{campaign_name}/recommendations")
def campaign_range_recommendations(
    campaign_name: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    min_calls: int = Query(50, ge=1),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return build_range_recommendations(
        conn, campaign_name, start_date, end_date, min_calls
    )


@router.get("/{campaign_name}/diagnostics")
def campaign_diagnostics(
    campaign_name: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    min_calls: int = Query(50, ge=1),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    return get_campaign_diagnostics(
        conn, campaign_name, start_date, end_date, min_calls
    )
