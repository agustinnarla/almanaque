"""Spec 061: every endpoint declares a strict response model."""
import pytest
from fastapi.exceptions import ResponseValidationError

import routers.campaigns as campaigns_router
from test_api import client, memory_conn, seed_metrics  # noqa: F401  (fixtures)


def test_every_api_route_declares_a_response_model(client):  # noqa: F811
    # Without a response_model, FastAPI documents the 200 response as an empty schema.
    paths = client.get("/openapi.json").json()["paths"]
    schemas = {
        path: operation["get"]["responses"]["200"]["content"]["application/json"]["schema"]
        for path, operation in paths.items()
        if path.startswith("/api")
    }
    assert len(schemas) == 21
    assert [path for path, schema in schemas.items() if not schema] == []


def test_an_undeclared_field_fails_instead_of_being_dropped(client, monkeypatch):  # noqa: F811
    def summary_with_extra(conn, campaign_name, start_date, end_date):
        return {
            "campaign": campaign_name, "total_calls": 0, "agent_answers": 0, "machine_answers": 0,
            "rejected_calls": 0, "agent_answer_rate": None, "attendable_answer_rate": None,
            "nuevo_campo": 1,
        }

    monkeypatch.setattr(campaigns_router, "get_summary", summary_with_extra)
    with pytest.raises(ResponseValidationError):
        client.get("/api/campaigns/35/summary", params={"start_date": "2026-09-01", "end_date": "2026-09-30"})


def test_excluded_amd_only_on_routing_recommendations(client, monkeypatch):  # noqa: F811
    recs = [
        {"id": "r1", "type": "ROUTING", "category": "Ruteo", "entity": "GW37", "text": "…", "excluded_amd": ["IPLAN"]},
        {"id": "r2", "type": "PACING", "category": "Ritmo", "entity": "GW20", "text": "…"},
    ]
    monkeypatch.setattr(
        campaigns_router,
        "build_range_recommendations",
        lambda *args, **kwargs: {
            "campaign": "35", "start_date": "2026-09-01", "end_date": "2026-09-30",
            "min_calls_applied": 50, "recommendations": recs,
        },
    )
    data = client.get(
        "/api/campaigns/35/recommendations",
        params={"start_date": "2026-09-01", "end_date": "2026-09-30", "min_calls": 50},
    ).json()
    assert data["recommendations"][0]["excluded_amd"] == ["IPLAN"]
    assert "excluded_amd" not in data["recommendations"][1]


def test_openapi_documents_the_models(client):  # noqa: F811
    schemas = client.get("/openapi.json").json()["components"]["schemas"]
    for name in ("Summary", "CrossCompare", "CompareDiagnostics", "Recommendation", "Methodology", "Routing"):
        assert name in schemas
    assert set(schemas["Summary"]["required"]) >= {"campaign", "total_calls", "agent_answer_rate"}
