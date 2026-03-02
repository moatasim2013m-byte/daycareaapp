# API_CONTRACT

## Current Implemented API (Phase-0 baseline)

Base path: `/api`

### 1) `GET /api/`
Response 200:
```json
{ "message": "Hello World" }
```

### 2) `POST /api/status`
Request:
```json
{ "client_name": "frontend" }
```

Response 200:
```json
{
  "id": "uuid",
  "client_name": "frontend",
  "timestamp": "2026-01-01T12:00:00+00:00"
}
```

### 3) `GET /api/status`
Response 200:
```json
[
  {
    "id": "uuid",
    "client_name": "frontend",
    "timestamp": "2026-01-01T12:00:00+00:00"
  }
]
```

---

## Target API Surface (Planned)

## Auth
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Branches & Zones
- `GET /api/branches`
- `POST /api/branches`
- `PATCH /api/branches/{branch_id}`
- `GET /api/branches/{branch_id}/zones`
- `POST /api/branches/{branch_id}/zones`
- `PATCH /api/zones/{zone_id}`

## Users & RBAC
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/{user_id}`
- `POST /api/users/{user_id}/roles`

## Products & Orders (Unified Engine)
- `GET /api/products`
- `POST /api/products`
- `POST /api/orders`
- `GET /api/orders/{order_id}`
- `POST /api/orders/{order_id}/payments`
- `POST /api/orders/{order_id}/void`
- `POST /api/orders/{order_id}/refund`

## Waivers
- `GET /api/waiver-templates`
- `POST /api/waiver-templates`
- `POST /api/waivers/sign`
- `GET /api/guardians/{guardian_id}/waiver-status`

## Bookings & Capacity
- `GET /api/availability`
- `POST /api/bookings`
- `PATCH /api/bookings/{booking_id}/cancel`
- `POST /api/bookings/{booking_id}/manager-override`

## Sessions & Wristbands
- `POST /api/sessions`
- `POST /api/sessions/{session_id}/checkin`
- `POST /api/sessions/{session_id}/activate`
- `POST /api/sessions/{session_id}/extend`
- `POST /api/sessions/{session_id}/checkout`
- `GET /api/sessions/active`
- `POST /api/device/scan-event`

## Memberships & Loyalty
- `GET /api/membership/plans`
- `POST /api/membership/plans`
- `POST /api/membership/purchase`
- `POST /api/membership/consume`
- `GET /api/loyalty/{guardian_id}`
- `POST /api/loyalty/redeem`

## Admissions Enquiries CRM
- `GET /api/enquiries/forms`
- `POST /api/enquiries/forms`
- `PATCH /api/enquiries/forms/{form_id}`
- `POST /api/enquiries/forms/{form_id}/publish`
- `POST /api/enquiries/forms/{form_id}/disable`
- `GET /api/enquiries/forms/{form_id}/share`
- `POST /api/enquiries/forms/{form_id}/submit` (public endpoint)
- `GET /api/enquiries/leads`
- `POST /api/enquiries/leads`
- `GET /api/enquiries/leads/{lead_id}`
- `PATCH /api/enquiries/leads/{lead_id}`
- `POST /api/enquiries/leads/{lead_id}/status`
- `POST /api/enquiries/leads/{lead_id}/activities`
- `GET /api/enquiries/leads/{lead_id}/activities`
- `POST /api/enquiries/leads/{lead_id}/tasks`
- `GET /api/enquiries/tasks`
- `PATCH /api/enquiries/tasks/{task_id}`
- `GET /api/enquiries/email-templates`
- `POST /api/enquiries/email-templates`
- `PATCH /api/enquiries/email-templates/{template_id}`
- `POST /api/enquiries/leads/{lead_id}/emails`

## Parties, Inventory, Reports
- `GET /api/party-packages`
- `POST /api/parties`
- `GET /api/inventory/items`
- `POST /api/inventory/movements`
- `GET /api/reports/daily-close`
- `GET /api/reports/sales-by-category`
- `GET /api/reports/active-sessions`
- `GET /api/reports/overdue-fees`

---

## Schema Conventions
- IDs are string UUIDs unless otherwise specified.
- Timestamps are ISO-8601 UTC.
- Standard error envelope:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```
- Branch-scoped endpoints must require and validate `branch_id` context.
