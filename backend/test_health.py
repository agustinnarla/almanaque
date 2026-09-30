import pytest

from services.health import compute_health_score


def test_health_score_formula():
    score = compute_health_score(0.2, 0.1, 0.05)
    assert score == pytest.approx(7.5)


def test_health_score_rounds_to_two_decimals():
    score = compute_health_score(0.123456, 0.1, 0.1)
    expected = round((0.123456 - 0.1 * 0.5 - 0.1 * 1.5) * 100, 2)
    assert score == expected


def test_health_score_none_when_any_rate_is_none():
    assert compute_health_score(None, 0.1, 0.05) is None
    assert compute_health_score(0.2, None, 0.05) is None
    assert compute_health_score(0.2, 0.1, None) is None
    assert compute_health_score(None, None, None) is None


def test_health_score_can_be_negative():
    score = compute_health_score(0.05, 0.4, 0.1)
    assert score is not None
    assert score < 0
