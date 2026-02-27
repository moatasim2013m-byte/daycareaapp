from datetime import datetime, timezone
from typing import Optional


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
    return audit_entry
