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

Create `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=daycareaapp
CORS_ORIGINS=http://localhost:3000
```

### 3) Start FastAPI server

```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 4) Verify backend

- Health/root endpoint: `GET http://localhost:8000/api/`
- Status endpoint: `GET http://localhost:8000/api/status`

---

## Frontend: Local Run

### 1) Install dependencies

```bash
cd frontend
yarn install
```

(Alternative with npm: `npm install`)

### 2) Configure environment

Create `frontend/.env`:

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

## Phase-0 Documentation

- `PRODUCT_SPEC.md`
- `DATA_MODEL.md`
- `API_CONTRACT.md`
- `ACCEPTANCE_TESTS.md`

These documents capture the current baseline plus the target expansion model requested for upcoming phases.
