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

## Run on Google Cloud Run (recommended for hosted preview)

Because Cloud Run services do **not** share `localhost`, deploy backend and frontend as **two services** and wire the frontend to the backend URL.

### 0) One-time setup: create separate service accounts

Use separate identities so backend and frontend can have different permissions:

```bash
PROJECT_ID=<YOUR_GCP_PROJECT_ID>
REGION=<YOUR_REGION>
DEPLOYER=<YOUR_USER_OR_CICD_SA_EMAIL>

gcloud config set project "$PROJECT_ID"

gcloud iam service-accounts create daycareaapp-backend-sa \
  --display-name="DaycareApp Backend Cloud Run SA"

gcloud iam service-accounts create daycareaapp-frontend-sa \
  --display-name="DaycareApp Frontend Cloud Run SA"
```

Allow your deployer identity to attach those runtime service accounts during `gcloud run deploy`:

```bash
gcloud iam service-accounts add-iam-policy-binding \
  daycareaapp-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --member="serviceAccount:${DEPLOYER}" \
  --role="roles/iam.serviceAccountUser"

gcloud iam service-accounts add-iam-policy-binding \
  daycareaapp-frontend-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --member="serviceAccount:${DEPLOYER}" \
  --role="roles/iam.serviceAccountUser"
```

> If deploying from your local user account instead of CI, use:
> `--member="user:<YOUR_GOOGLE_ACCOUNT_EMAIL>"`.

If backend uses Secret Manager for `MONGO_URL`, grant only backend runtime SA access:

```bash
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:daycareaapp-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 1) Deploy backend service

```bash
gcloud run deploy daycareaapp-backend \
  --source ./backend \
  --region "$REGION" \
  --allow-unauthenticated \
  --service-account daycareaapp-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --set-env-vars "MONGO_URL=<YOUR_MONGO_URL>,DB_NAME=daycareaapp"
```

After deploy, copy the backend HTTPS URL, for example:

`https://daycareaapp-backend-xxxxx-uc.a.run.app`

### 2) Deploy frontend service (pointing to backend)

```bash
gcloud run deploy daycareaapp-frontend \
  --source ./frontend \
  --region "$REGION" \
  --allow-unauthenticated \
  --service-account daycareaapp-frontend-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --set-build-env-vars "REACT_APP_BACKEND_URL=https://daycareaapp-backend-xxxxx-uc.a.run.app"
```

### 3) Verify Cloud Run

- Backend health: `GET https://<backend-url>/api/health`
- Frontend: open `https://<frontend-url>` and confirm API calls succeed.

> Important: do **not** use `http://localhost:8000` or `http://localhost:3000` in Cloud Run settings.


## Backend vs Frontend API Status (Current)

A current audit of frontend API usage vs backend implementation is documented in:

- `docs/current_status.md`
- `API_CONTRACT.md`

Snapshot:

- All endpoints currently called via `frontend/src/services/api.js` consumers are implemented in backend routes.
- Several parent/teacher experience pages are still frontend-only MVP flows backed by browser `localStorage` (not server APIs yet).
- Backlog API surfaces from older planning docs (for example auth refresh/logout and CRM/forms modules) are not blocking current wired screens but remain future backend work.

---
## Parent Help Center Content

- Consolidated parent onboarding + bus tracking article: `docs/illumine_parents_guide.md`

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
CORS_ORIGINS=http://localhost:3000,https://<your-frontend-cloud-run-url>
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

# Cloud Run example:
# REACT_APP_BACKEND_URL=https://<your-backend-cloud-run-url>
```

### 3) Start frontend dev server

```bash
cd frontend
yarn start
```

### 4) Verify frontend

Open `http://localhost:3000` and ensure the browser console logs the backend root message from `/api/`.

If you're using Cloud Run (or Codespaces), open the generated HTTPS frontend URL (not localhost) and verify requests go to your deployed backend URL.

---



## Onboarding Guides

- Step 6/7: [Set Up Forms & Generate Reports](docs/onboarding/step-6-forms-and-reports.md)

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
- `docs/student-attendance-guide.md`
- `DATA_MODEL.md`
- `API_CONTRACT.md`
- `ACCEPTANCE_TESTS.md`

These documents capture the current baseline plus the target expansion model requested for upcoming phases.

## Operations Playbooks

- `memory/student_attendance_guide.md`
