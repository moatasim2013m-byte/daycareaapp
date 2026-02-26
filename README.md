# Indoor Playground Management System
## Parafait/ROLLER-like Platform

Multi-branch indoor playground + daycare management system with unified POS/online ordering, wristband-based check-in/out, memberships, party bookings, and inventory.

---

## ARCHITECTURE

- **Backend**: FastAPI (Python 3.11+) + Motor (async MongoDB)
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI (Arabic-first, RTL)
- **Database**: MongoDB 7.0+
- **Authentication**: JWT Bearer tokens
- **Payment**: Stripe integration (configurable)

---

## PROJECT STRUCTURE

```
/app/
├── backend/
│   ├── server.py           # FastAPI entry point
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js          # React entry point
│   │   ├── components/ui/  # Shadcn UI components
│   │   └── ...
│   ├── package.json        # Node dependencies
│   └── .env                # Frontend environment variables
├── memory/
│   ├── hourly_booking_logic.md      # Hourly booking specs
│   ├── subscription_system_logic.md # Membership/subscription specs
│   └── daycare_system_logic.md      # Day care specs
├── PRODUCT_SPEC.md         # Complete product specification
├── DATA_MODEL.md           # MongoDB collections & indexes
├── API_CONTRACT.md         # REST API endpoints
└── ACCEPTANCE_TESTS.md     # End-to-end test scenarios
```

---

## QUICK START

### Prerequisites
- Python 3.11+
- Node.js 18+ & Yarn
- MongoDB 7.0+ (local or Docker)
- Git

### 1. Clone & Setup

```bash
cd /app
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # Create if doesn't exist
nano .env  # Edit values:
```

**Backend .env file** (`/app/backend/.env`):
```env
# MongoDB Connection
MONGO_URL=mongodb://localhost:27017
DB_NAME=playzone_db

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# JWT Secret (generate: openssl rand -hex 32)
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# Stripe (optional for Phase 2+)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (optional for notifications)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

**Start Backend**:
```bash
# Development (hot reload)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Production
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

Backend runs at: `http://localhost:8001`  
API docs: `http://localhost:8001/docs` (Swagger UI)

---

### 3. Frontend Setup

```bash
cd /app/frontend

# Install dependencies
yarn install

# Configure environment
cp .env.example .env  # Create if doesn't exist
nano .env  # Edit values:
```

**Frontend .env file** (`/app/frontend/.env`):
```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001

# WebSocket Port (for dev server)
WDS_SOCKET_PORT=443

# Health Check
ENABLE_HEALTH_CHECK=false
```

**Start Frontend**:
```bash
# Development
yarn start

# Build for production
yarn build
```

Frontend runs at: `http://localhost:3000`

---

## MONGODB SETUP

### Local MongoDB

```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongo --eval 'db.runCommand({ connectionStatus: 1 })'
```

### Docker MongoDB

```bash
docker run -d \
  --name playzone-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v playzone_data:/data/db \
  mongo:7.0
```

Update `MONGO_URL` in backend `.env`:
```
MONGO_URL=mongodb://admin:password@localhost:27017
```

---

## SEEDING TEST DATA

### Option 1: Manual Seed (Phase 0)
Create seed script `/app/backend/seed.py`:
```python
# See ACCEPTANCE_TESTS.md for required seed data
# - 1 Branch
# - 2 Zones (SOFTPLAY, SAND)
# - Admin, Cashier, Parent users
# - Products (admission, F&B)
# - Waiver template
# - 10 Wristbands
```

Run:
```bash
cd /app/backend
python seed.py
```

### Option 2: API-based Seed (After Phase 1)
Use curl commands from ACCEPTANCE_TESTS.md

---

## TESTING

### Backend Tests
```bash
cd /app/backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd /app/frontend
yarn test
```

### Linting
```bash
# Backend
cd /app/backend
black . --check
flake8 .

# Frontend
cd /app/frontend
yarn lint
```

### End-to-End Tests
See `ACCEPTANCE_TESTS.md` for full scenarios with curl commands

**Example: Quick smoke test**
```bash
# Health check
curl http://localhost:8001/api/

# Login (get token)
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@playzone.sa", "password": "Admin123!"}' \
  | jq -r '.data.token')

# Get branches
curl http://localhost:8001/api/branches \
  -H "Authorization: Bearer $TOKEN"
```

---

## ENVIRONMENT VARIABLES REFERENCE

### Backend Required
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `playzone_db` |
| `JWT_SECRET` | Secret key for JWT signing | `openssl rand -hex 32` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:3000` |

### Backend Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `JWT_EXPIRY_HOURS` | Token expiry | `24` |
| `STRIPE_SECRET_KEY` | Stripe API key | None |
| `TWILIO_ACCOUNT_SID` | Twilio SID for SMS | None |

### Frontend Required
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | Backend API base URL | `http://localhost:8001` |

---

## WRISTBAND / DEVICE ACTIVATOR

**NOTE**: Existing wristband/device activator code must be **INTEGRATED**, not rebuilt.

**Current Status** (Phase 0 audit):
- ❌ No wristband-specific code found in current repo
- ❌ No device activator endpoints detected
- ⚠️ **TO BE LOCATED**: Check for separate device repo or legacy code

**Integration Plan** (Phase 5):
1. Locate existing device activator interface
2. Map RFID scan events to `/api/devices/scan` endpoint
3. Link wristband RFID to session check-in/out
4. Implement offline queue for device sync

**Expected Device Flow**:
```
Device scans RFID → POST /api/devices/scan
                    {rfid_code, device_id, scan_type}
                  ↓
Backend lookups wristband → finds session → checks in/out
                  ↓
Returns child info + alerts to device display
```

---

## DEVELOPMENT WORKFLOW

### Phase-by-Phase Implementation (See CREDIT CONTROL MODE Plan)

**PHASE 0** (COMPLETE):
- ✅ Repository audit
- ✅ Specification documents created
- ✅ README updated

**PHASE 1** (Next): Core Platform
- Multi-branch + zones CRUD
- RBAC (roles & permissions)
- Arabic-first RTL scaffolding
- Admin UI for branches/zones/users

**PHASE 2**: Unified Order Engine + POS  
**PHASE 3**: Waivers  
**PHASE 4**: Booking + Capacity  
**PHASE 5**: Sessions + Wristbands Integration  
**PHASE 6**: Memberships / Entitlements  
**PHASE 7**: Parties  
**PHASE 8**: Inventory + Reporting  

---

## CURRENT STATUS

**Repository State**:
- Backend: Minimal FastAPI starter (Hello World endpoint)
- Frontend: React starter with Shadcn UI components
- Database: Empty (no collections yet)
- Specs: Complete (PRODUCT_SPEC, DATA_MODEL, API_CONTRACT, ACCEPTANCE_TESTS)

**Next Steps**:
1. Implement Phase 1 (branches, zones, RBAC)
2. Set up seed data
3. Build admin UI
4. Run acceptance tests

---

## SUPPORT & DOCUMENTATION

- **Product Spec**: See `PRODUCT_SPEC.md`
- **Data Model**: See `DATA_MODEL.md`
- **API Docs**: See `API_CONTRACT.md` + `http://localhost:8001/docs`
- **Acceptance Tests**: See `ACCEPTANCE_TESTS.md`
- **Business Logic**: See `/app/memory/*.md` for detailed rules

---

## LICENSE

Proprietary - All Rights Reserved