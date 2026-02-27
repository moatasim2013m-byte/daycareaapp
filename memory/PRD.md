# Peekaboo Indoor Playground Management System - PRD

## Original Problem Statement
Build a complete management platform for an indoor playground and daycare center, similar to Parafait/ROLLER. The system should support:
- Hourly booking
- Monthly subscriptions
- Day care shifts
- Check-in/out via QR/wristband
- POS (Point of Sale)
- Inventory management
- Reporting

## Core Requirements
- **Tech Stack**: FastAPI backend, React frontend, MongoDB database
- **Language**: Arabic-first UI with RTL support
- **Design System**: "Peekaboo Playful" - playful shell with professional data surfaces

## Phased Development Plan

### Phase 0 - Repo Audit & Specifications ✅ COMPLETED
- Repository audited
- Created specification documents:
  - `PRODUCT_SPEC.md` - Roles, domain objects, state machines
  - `DATA_MODEL.md` - MongoDB collections and indexes
  - `API_CONTRACT.md` - API endpoint definitions
  - `ACCEPTANCE_TESTS.md` - E2E test scenarios
  - `UI_STYLE_GUIDE.md` - Peekaboo Playful design system

### Phase 1 - Core Platform Foundation ✅ COMPLETED
- Multi-branch architecture
- Zone management per branch
- Role-Based Access Control (RBAC)
  - Roles: ADMIN, MANAGER, CASHIER, ATTENDANT, INSTRUCTOR, PARENT
- Admin pages for branches, zones, users
- Arabic RTL layout foundation

### Phase 2 - Unified Order Engine + POS ✅ COMPLETED (Feb 27, 2026)
**Backend:**
- Products CRUD API (`/api/products`)
  - Create, read, update products
  - Category support: ADMISSION, FOOD, BEVERAGE, RETAIL, ADDON, MEMBERSHIP, PARTY_PACKAGE
  - Product types: HOURLY_PASS, VISIT_PACK, MONTHLY_SUBSCRIPTION, DAYCARE, CONSUMABLE, etc.
  - Branch-scoped products with SKU uniqueness
- Orders API (`/api/orders`)
  - Create orders with multiple items
  - Automatic price/tax calculation (15% VAT)
  - Order lifecycle: DRAFT → CONFIRMED → PAID
  - Cancel order support
  - Order number generation (ORD-YYYYMMDD-XXXX)

**Frontend:**
- POS page (`/pos`) with green accent theme
- Product grid with category filters
- Color-coded category icons (green=admission, orange=food, blue=beverages, yellow=retail)
- Shopping cart with quantity controls
- Checkout confirmation dialog
- Payment success receipt with order details

**Test Coverage:** 100% backend, 100% frontend

### Phase 3 - Waivers (PENDING)
- Waiver templates
- Digital signature capture
- Guardian/child waiver signing
- Waiver verification and expiry

### Phase 4 - Booking + Capacity (PENDING)
- Slot-based booking engine
- Zone capacity management
- Booking calendar interface

### Phase 5 - Sessions + Time Tracking + Wristbands (PENDING)
- Session management (check-in/out)
- Live timers
- Overdue fee calculation
- Wristband/device activator integration
- **Note:** Activator code needs to be built from scratch

### Phase 6 - Memberships / Visit Packs / Entitlements (PENDING)
- Subscription plans
- Visit pack management
- Entitlement consumption tracking

### Phase 7 - Parties (PENDING)
- Party package booking
- Deposit handling
- Task management for party preparation

### Phase 8 - Inventory + Reporting (PENDING)
- Inventory tracking
- Low stock alerts
- Business reports (daily close, revenue, etc.)

## Current Architecture

```
/app
├── backend/
│   ├── models/
│   │   ├── branch.py
│   │   ├── order.py      ✅
│   │   ├── product.py    ✅
│   │   ├── user.py
│   │   └── zone.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── branches.py
│   │   ├── orders.py     ✅
│   │   ├── products.py   ✅
│   │   ├── users.py
│   │   └── zones.py
│   └── server.py
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── POS.js    ✅
│       │   ├── Dashboard.js
│       │   ├── Branches.js
│       │   ├── Zones.js
│       │   └── Users.js
│       └── App.js
├── PRODUCT_SPEC.md
├── DATA_MODEL.md
├── API_CONTRACT.md
├── ACCEPTANCE_TESTS.md
└── UI_STYLE_GUIDE.md
```

## Test Credentials
- **Admin**: admin@example.com / adminpassword
- **Branch ID**: 35df2b42-c334-41cf-915e-f0e6f551f913

## Key Technical Decisions
1. MongoDB for flexible document storage
2. JWT authentication with role-based access
3. Arabic-first RTL design with bilingual support
4. Tailwind CSS with custom Peekaboo design tokens
5. Shadcn/UI components for consistent UI

## Design System Colors
- Primary Yellow: #FFD93B
- Blue: #00BBF9
- Red: #FF595E
- Orange: #FF924C
- Green: #8AC926 (POS accent)

## Next Priority Tasks
1. Phase 3 - Waivers implementation
2. Phase 4 - Booking system
3. Phase 5 - Session management with wristbands
