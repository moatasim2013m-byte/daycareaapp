import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.pricing_service import calculateSessionPrice


def test_calculate_session_price_within_base_duration():
    start = datetime.now(timezone.utc) - timedelta(minutes=45)
    end = datetime.now(timezone.utc)

    duration, charge = calculateSessionPrice(
        {"sessionStart": start, "sessionEnd": end},
        {"baseDurationMinutes": 60, "basePrice": 7.0, "extraMinutePrice": 0.1},
    )

    assert duration == 45
    assert charge == 7.0


def test_calculate_session_price_with_extra_minutes():
    start = datetime.now(timezone.utc) - timedelta(minutes=135)
    end = datetime.now(timezone.utc)

    duration, charge = calculateSessionPrice(
        {"sessionStart": start, "sessionEnd": end},
        {"baseDurationMinutes": 120, "basePrice": 10.0, "extraMinutePrice": 0.05},
    )

    assert duration == 135
    assert charge == 10.75
