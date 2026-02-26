from datetime import datetime, timezone
import uuid


async def log_audit(db, entity_type: str, entity_id: str, action: str, 
                   actor_id: str, actor_role: str, before_state=None, 
                   after_state=None, notes: str = ""):
    """
    Write audit log entry to database
    """
    log_entry = {
        "log_id": str(uuid.uuid4()),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "action": action,
        "actor_id": actor_id,
        "actor_role": actor_role,
        "before_state": before_state,
        "after_state": after_state,
        "notes": notes,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.audit_logs.insert_one(log_entry)
    return log_entry