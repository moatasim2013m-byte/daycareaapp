import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import pytest

from models.device import DeviceEventRequest, DeviceRegisterRequest


def test_device_register_accepts_allowed_device_types():
    device = DeviceRegisterRequest(id="dev-1", deviceType="scanner", branchId="branch-1")
    assert device.deviceType == "scanner"
    assert device.status == "online"


def test_device_register_rejects_unknown_device_type():
    with pytest.raises(Exception):
        DeviceRegisterRequest(id="dev-1", deviceType="camera", branchId="branch-1")


def test_device_event_restricts_event_types():
    evt = DeviceEventRequest(id="dev-1", eventType="DEVICE_HEARTBEAT", payload={"ok": True})
    assert evt.eventType == "DEVICE_HEARTBEAT"

    with pytest.raises(Exception):
        DeviceEventRequest(id="dev-1", eventType="UNKNOWN_EVENT")
