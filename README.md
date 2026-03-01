# Daycare App Monorepo

This repository contains:

- **Backend**: FastAPI + MongoDB (`/backend`)
- **Frontend**: React (CRA + CRACO) + Tailwind + Radix UI (`/frontend`)

## Current Architecture Snapshot

- Backend entrypoint app object: `backend/server.py` (`app = FastAPI()`)
- API router prefix: `/api`
- MongoDB driver: `motor` (`AsyncIOMotorClient`)
- Frontend API base URL: `REACT_APP_BACKEND_URL` environment variable

## Prerequisites

- Python 3.11+
- Node.js 18+ and Yarn 1.x (or npm)
- MongoDB instance (local or hosted)

---

## Backend: Local Run

### 1) Create virtual environment and install dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) Configure environment

Create `backend/.env` (you can copy from `backend/.env.example`):

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=daycareaapp
CORS_ORIGINS=http://localhost:3000
JWT_SECRET=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24
```

### 3) Start FastAPI server

```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 4) Verify backend

- Health/root endpoint: `GET http://localhost:8000/api/`
- Health endpoint: `GET http://localhost:8000/api/health`

---

## Frontend: Local Run

### 1) Install dependencies

```bash
cd frontend
yarn install
```

(Alternative with npm: `npm install`)

### 2) Configure environment

Create `frontend/.env` (you can copy from `frontend/.env.example`):

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

### 3) Start frontend dev server

```bash
cd frontend
yarn start
```

### 4) Verify frontend

Open `http://localhost:3000` and ensure the browser console logs the backend root message from `/api/`.

---


## Phase 4 (Reception Operations)

- Checkout now applies overtime billing rules for walk-in sessions:
  - Walk-in 1h = 7 JD
  - Walk-in 2h = 10 JD
  - After included time: `overdue_fee = ceil(extra_minutes/60) * 3 JD`
- If overtime exists at checkout, an overtime order is auto-generated and linked on the check-in session via `overtime_order_id` and `overtime_order_number`.
- Overtime orders are created in the standard `orders` collection with status `OPEN` and can be settled from normal order/payment flows.

## Build & Test Commands

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
yarn test
yarn build
```

---

## Phase 4 (Reception Operations)

- Check-out applies overtime billing using fixed rules:
  - Walk-in 1 hour = **7 JD**
  - Walk-in 2 hours = **10 JD**
  - After included time: `ceil(extra_minutes / 60) * 3 JD`
- If a child checks out after included minutes, the backend creates an overtime order automatically in `orders` with `status=OPEN` and links it to child/guardian context when available.
- The reception check-in screen now shows included time, elapsed time, overdue indication, and a structured checkout summary with overtime amount + overtime order number.

No new environment variables are required for this phase.

---

## Phase-0 Documentation

- `PRODUCT_SPEC.md`
- `DATA_MODEL.md`
- `API_CONTRACT.md`
- `ACCEPTANCE_TESTS.md`

These documents capture the current baseline plus the target expansion model requested for upcoming phases.
