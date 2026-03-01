import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from models.session import calculate_overtime_fee


def test_overtime_fee_no_extra_minutes():
    assert calculate_overtime_fee(0) == 0.0
    assert calculate_overtime_fee(-10) == 0.0


def test_overtime_fee_rounds_up_by_hour():
    assert calculate_overtime_fee(1) == 3.0
    assert calculate_overtime_fee(59) == 3.0
    assert calculate_overtime_fee(60) == 3.0
    assert calculate_overtime_fee(61) == 6.0
    assert calculate_overtime_fee(121) == 9.0
