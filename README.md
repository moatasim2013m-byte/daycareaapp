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
- Optional: Docker / Docker Compose

---

## Quick Preview Options

### Option A: Native run (recommended for development)

#### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=daycareaapp
CORS_ORIGINS=http://localhost:3000
```

Run backend:

```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend

```bash
cd frontend
yarn install
```

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

Run frontend:

```bash
cd frontend
yarn start
```

Preview at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/`

---

### Option B: Docker Compose preview (single command)

This starts MongoDB + backend + frontend together.

```bash
docker compose up --build
```

Preview at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/`

---

## Cloud Run Deployment (important for your screenshot)

Because this is a monorepo, **do not use `/Dockerfile`** in Cloud Run source deploy unless you create one at repo root.
Use one service per app and set source location to:

- Backend service Dockerfile: `/backend/Dockerfile`
- Frontend service Dockerfile: `/frontend/Dockerfile`

### Backend Cloud Run settings
- Source location: `/backend/Dockerfile`
- Port: `8080` (already used by Dockerfile command)
- Required env vars:
  - `MONGO_URL`
  - `DB_NAME`
  - `CORS_ORIGINS` (set to frontend Cloud Run URL)

### Frontend Cloud Run settings
- Source location: `/frontend/Dockerfile`
- Build arg:
  - `REACT_APP_BACKEND_URL=https://<your-backend-cloud-run-url>`

---

## Build & Test Commands

### Backend

```bash
cd backend
python -m py_compile server.py
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
