# Backend QA Audit — March 26, 2026

## Scope
Deep backend QA audit for:

1. Health and DB readiness
2. Authentication (`/auth/register`, `/auth/login`, `/auth/me`, `/auth/staff`)
3. Parent portal (`/parent/feed`, `/parent/attendance`, `/parent/payments`, `/parent/messages`, `/parent/bookings`)

## Environment + Method
- Date: 2026-03-26
- App served locally via Uvicorn with `MONGO_URL` unset (intentional DB-disconnected mode).
- API checks run with `curl` and targeted async function probes for auth behavior branches.

## Results

## 1) Health and DB readiness

### ✅ What works
- `GET /api/health` returns HTTP `200` with JSON indicating DB state:
  - `{"status":"healthy","database":"disconnected"}` when DB is unavailable.

### ⚠️ Risk / inconsistency
- Health endpoint reports `status: healthy` even when database is disconnected. This can mislead infra probes and upstream monitors into treating a degraded backend as fully healthy.

### ❌ DB-disconnected hard-fail endpoints
- Auth write/read flows (`/api/auth/register`, `/api/auth/login`) hard-fail with `500` when DB is missing because handlers dereference `db.users` without a DB guard.
- This is a blocker for graceful degraded mode and operational clarity.

## 2) Authentication QA

### Status-code validation

| Flow | Observed status | Notes |
|---|---:|---|
| `POST /api/auth/login` with missing password field | `422` | Pydantic validation error before handler logic. |
| `POST /api/auth/login` unknown user | `401` | Correct invalid-credentials behavior. |
| `POST /api/auth/login` wrong password | `401` | Correct invalid-credentials behavior. |
| `POST /api/auth/login` inactive account | `403` | Correct blocked-account behavior. |
| `GET /api/auth/me` without token | `401` | Correct unauthorized behavior. |
| `POST /api/auth/staff` without token | `401` | Correct unauthorized behavior. |
| `POST /api/auth/staff` with non-admin role | `403` | Correct role enforcement. |
| `POST /api/auth/register` with DB disconnected | `500` | Unhandled DB-none path (blocker). |
| `POST /api/auth/login` with DB disconnected | `500` | Unhandled DB-none path (blocker). |

### Additional auth observations
- `POST /api/auth/login` has a manual guard for empty strings, but schema-required field failures are `422`. This produces mixed client error classes (`422` vs `400`) depending on payload shape.

## 3) Parent portal backend QA

### ❌ Critical routing blocker
- Parent portal router is implemented but **not mounted** into the API router.
- Result: `GET /api/parent/feed` returns `404 Not Found` (same for attendance/payments/messages/bookings).
- This is a hard blocker for all parent portal backend QA and frontend integration.

### Code-level data/response issues (when router is mounted)

1. **Potential data leakage in payments endpoint**
   - `GET /parent/payments` fetches payments with `db.payments.find({})` (no guardian/child filter).
   - Risk: parent can receive unrelated payment history.

2. **Response-shape inconsistency risk**
   - Some parent endpoints return synthetic sample data when DB is `None`; other backend domains return `500` on DB loss.
   - This creates inconsistent degraded-mode semantics across APIs.

3. **Null-safety review**
   - Parent handlers generally guard empty child sets and serialize datetime fields.
   - `attendance.date` can be `null` when `checkin_at` is absent/non-string (acceptable if contract allows nullable date).

## Blocker summary

1. Parent portal routes unavailable (`404`) because router is not mounted.
2. Auth core endpoints crash (`500`) in DB-disconnected mode instead of returning controlled service errors.
3. Parent payments query is unscoped and can leak cross-family payment records.

## Recommended fix order (backend-only)

1. Mount `parent_portal.router` under `/api` immediately to unblock QA surface.
2. Add DB-readiness guard dependency (or per-endpoint guard) that returns deterministic `503 Service Unavailable` for DB-required routes.
3. Scope `/parent/payments` queries by the authenticated parent's children/household.
4. Normalize validation semantics for login/register client errors (`400` vs `422`) if API contract requires consistency.
