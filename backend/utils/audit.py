from datetime import datetime, timezone
from typing import Optional
from services.notification_service import maybe_send_whatsapp_notification


async def log_audit(
    db,
    entity_type: str,
    entity_id: str,
    action: str,
    actor_user_id: str,
    actor_role: str,
    before_state: Optional[dict] = None,
    after_state: Optional[dict] = None,
    notes: Optional[str] = None
):
    """Log an audit entry for sensitive actions"""
    import uuid
    
    audit_entry = {
        "audit_id": str(uuid.uuid4()),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "action": action,
        "actor_user_id": actor_user_id,
        "actor_role": actor_role,
        "before_state": before_state,
        "after_state": after_state,
        "notes": notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.audit_logs.insert_one(audit_entry)
    await maybe_send_whatsapp_notification(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        after_state=after_state,
        notes=notes,
    )
    return audit_entry
