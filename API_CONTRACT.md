# API_CONTRACT

Base path: `/api`

This contract reflects the **current implementation** in `backend/server.py` + `backend/routers/*.py`, and the **current frontend usage** in `frontend/src/services/api.js` consumers.

## Current Implemented API

### Health
- `GET /api/`
- `GET /api/health`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/staff`

### Users
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/me`

### Branches & Zones
- `GET /api/branches`
- `POST /api/branches`
- `GET /api/branches/{branch_id}`
- `PATCH /api/branches/{branch_id}`
- `GET /api/zones`
- `POST /api/zones`
- `GET /api/zones/{zone_id}`
- `PATCH /api/zones/{zone_id}`

### Children & Customers
- `GET /api/children`
- `POST /api/children`
- `GET /api/children/{child_id}`
- `PATCH /api/children/{child_id}`
- `POST /api/children/staff`
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/card/{card_number}`
- `GET /api/customers/{customer_id}`
- `PATCH /api/customers/{customer_id}`
- `POST /api/customers/{customer_id}/waiver`

### Products & Orders
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/{product_id}`
- `POST /api/products/seed`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/{order_id}`
- `POST /api/orders/{order_id}/pay`
- `POST /api/orders/{order_id}/cancel`

### Sessions & Check-in
- `GET /api/sessions`
- `GET /api/sessions/active`
- `POST /api/sessions/checkin`
- `POST /api/sessions/checkout`
- `GET /api/sessions/{session_id}`
- `POST /api/checkin/scan`
- `POST /api/checkin`
- `POST /api/checkin/{session_id}/checkout`
- `GET /api/checkin/active`
- `GET /api/checkin/history`

### Subscriptions & Entitlements
- `GET /api/subscriptions`
- `POST /api/subscriptions`
- `POST /api/subscriptions/{subscription_id}/activate`
- `GET /api/subscriptions/visit-packs`
- `POST /api/subscriptions/visit-packs`
- `POST /api/subscriptions/visit-packs/{pack_id}/consume`
- `POST /api/entitlements/check`
- `POST /api/entitlements/peekaboo-usage`
- `GET /api/entitlements/peekaboo-usage`

### Reports
- `GET /api/reports/daily-summary`
- `GET /api/reports/revenue`
- `GET /api/reports/sessions-history`
- `GET /api/reports/export/daily`
- `GET /api/reports/export/revenue`

### Analytics
- `GET /api/analytics/revenue`
- `GET /api/analytics/attendance`
- `GET /api/analytics/sessions`

---

## Frontend-Wired Endpoints (Verified)

The frontend currently calls these endpoint groups, and they all exist in backend:

- Auth: `/auth/login`, `/auth/register`
- Branches/Zones: `/branches`, `/zones`
- Reception/POS: `/checkin/active`, `/checkin/scan`, `/checkin`, `/checkin/{id}/checkout`, `/customers`, `/customers/{id}/waiver`, `/products`, `/orders`, `/orders/{id}/pay`
- Dashboard/ops: `/analytics/revenue`, `/analytics/attendance`, `/analytics/sessions`, `/children`, `/users`

Status: **No route-level mismatch for currently wired frontend API calls**.

---

## Missing / Incomplete vs historical target plans

These are examples still not present in the implementation as previously planned in older docs:

- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- richer refunds/void endpoint variants used in earlier contract drafts
- CRM/enquiries/form publishing/public submission modules
- party/inventory modules
- broader loyalty module surface

These should be treated as backlog items, not regressions for current wired UI.

---

## Frontend-only MVP pages (localStorage)

The following pages remain localStorage-backed and are not yet server-backed:

- `TeacherToday`
- `TeacherAttendance`
- `TeacherChildLog`
- `TeacherNewActivity`
- `TeacherMessages`
- `TeacherPickupCheck`
- `ParentFeed`
- `ParentDailyReport`
- `ParentMessages`
- `ParentPickups`
