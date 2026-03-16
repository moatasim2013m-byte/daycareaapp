import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone

sys.path.append(str(Path(__file__).resolve().parents[1]))

import pytest

from models.device import DeviceEventRequest, DeviceRegisterRequest
from routers.devices import _effective_status


def test_device_register_accepts_allowed_device_types():
    device = DeviceRegisterRequest(id=" dev-1 ", deviceType="scanner", branchId=" branch-1 ")
    assert device.id == "dev-1"
    assert device.branchId == "branch-1"
    assert device.deviceType == "scanner"
    assert device.status == "online"


def test_device_register_rejects_unknown_device_type():
    with pytest.raises(Exception):
        DeviceRegisterRequest(id="dev-1", deviceType="camera", branchId="branch-1")


def test_device_event_restricts_and_normalizes_event_types():
    evt = DeviceEventRequest(id="dev-1", eventType="heartbeat", payload={"ok": True})
    assert evt.eventType == "DEVICE_HEARTBEAT"

    scan_evt = DeviceEventRequest(id="dev-1", eventType="scan")
    assert scan_evt.eventType == "DEVICE_SCAN"

    kiosk_evt = DeviceEventRequest(id="dev-1", eventType="DEVICE_KIOSK_ACTION")
    assert kiosk_evt.eventType == "DEVICE_KIOSK_ACTION"

    with pytest.raises(Exception):
        DeviceEventRequest(id="dev-1", eventType="UNKNOWN_EVENT")


def test_device_event_coerces_non_dict_payload():
    evt = DeviceEventRequest(id="dev-1", eventType="DEVICE_SCAN", payload="tag-123")
    assert evt.payload == {"raw": "tag-123"}


def test_effective_status_uses_last_seen_and_maintenance():
    now = datetime.now(timezone.utc)
    online_device = {"status": "online", "lastSeen": now.isoformat()}
    offline_device = {"status": "online", "lastSeen": (now - timedelta(minutes=10)).isoformat()}
    maintenance_device = {"status": "maintenance", "lastSeen": (now - timedelta(minutes=10)).isoformat()}

    assert _effective_status(online_device) == "online"
    assert _effective_status(offline_device) == "offline"
    assert _effective_status(maintenance_device) == "maintenance"
