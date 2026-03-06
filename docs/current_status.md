# Current Backend/Frontend Status Audit

This document audits the **currently wired frontend API usage** against the **actual FastAPI routes** mounted in `backend/server.py`.

## Scope

- Frontend calls reviewed from:
  - `frontend/src/context/AuthContext.js`
  - `frontend/src/pages/{Branches,Zones,CheckIn,POS,Dashboard,Users}.js`
- Backend routes reviewed from:
  - `backend/server.py`
  - `backend/routers/*.py`

---

## 1) Routes Actually Implemented (Backend)

Base: `/api`

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

### Branches and Zones
- `GET /api/branches`
- `POST /api/branches`
- `GET /api/branches/{branch_id}`
- `PATCH /api/branches/{branch_id}`
- `GET /api/zones`
- `POST /api/zones`
- `GET /api/zones/{zone_id}`
- `PATCH /api/zones/{zone_id}`

### Children and Customers
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

### Products, Orders, Billing
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/{product_id}`
- `POST /api/products/seed`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/{order_id}`
- `POST /api/orders/{order_id}/pay`
- `POST /api/orders/{order_id}/cancel`

### Sessions and Check-in
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

### Subscriptions and Entitlements
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

---

## 2) Routes Expected by Frontend but Missing/Incomplete

### A) Currently called by frontend (`api.js`) and backend availability

All currently invoked frontend endpoints are present in backend:

- Auth: `/auth/login`, `/auth/register`
- Master data: `/branches`, `/zones`, `/users`, `/children`, `/products`
- Check-in/POS: `/checkin/active`, `/checkin/scan`, `/checkin`, `/checkin/{id}/checkout`, `/customers`, `/customers/{id}/waiver`, `/orders`, `/orders/{id}/pay`
- Dashboard: `/reports/daily-summary`, `/sessions/active`

Status: **No hard missing route among currently wired frontend API calls**.

### B) Incomplete relative to broader product docs/plans (not currently used by frontend)

The following are examples of API surfaces often mentioned in planning docs but not implemented as shown there (or implemented with different shapes):

- Token refresh/logout endpoints (e.g., `/api/auth/refresh`, `/api/auth/logout`)
- Dedicated payment/refund/void variants in older contract wording (`/payments`, `/void`, `/refund` path style)
- Forms/enquiries/CRM/public submit flows
- Party/inventory specific modules
- Membership/loyalty endpoints in older naming style

These are not blockers for currently wired pages, but remain candidate backend backlog work.

---

## 3) Pages Currently localStorage-only (Frontend MVP)

These pages currently persist/read data via browser `localStorage` and do not call backend APIs:

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

Implication: these page experiences are currently **frontend-only MVP state** and are not server-backed yet.
