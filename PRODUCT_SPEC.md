# PRODUCT SPECIFICATION - Indoor Playground Management System
## Parafait/ROLLER-like Platform

---

## SYSTEM OVERVIEW

A comprehensive multi-branch indoor playground + daycare management platform with unified POS/online ordering, wristband-based check-in/out, memberships, party bookings, and inventory management.

---

## USER ROLES & PERMISSIONS

### 1. ADMIN (HQ Level)
**Scope**: All branches
**Permissions**:
- Full system configuration
- Create/edit branches, zones, products
- User management (create staff, assign roles)
- View all reports across branches
- Audit log access
- Refund/void approvals
- System settings (pricing rules, waiver templates, capacity limits)

### 2. MANAGER (Branch Level)
**Scope**: Assigned branch(es)
**Permissions**:
- View branch dashboard & reports
- Manage branch zones & capacity
- Staff scheduling
- Approve manual overrides (capacity, late fees, refunds)
- Inventory management
- Party booking management
- View audit logs (branch-scoped)

### 3. CASHIER (POS)
**Scope**: Assigned branch
**Permissions**:
- Process POS transactions (orders, payments, refunds)
- Walk-in bookings
- Issue wristbands
- View active sessions
- Print receipts
- Basic inventory lookup

### 4. RECEPTION
**Scope**: Assigned branch
**Permissions**:
- Check-in/check-out customers (scan wristbands)
- Verify waivers
- Walk-in bookings
- View active sessions & bookings
- Extend session times
- Calculate overdue fees
- Emergency check-out with manager approval

### 5. STAFF
**Scope**: Assigned branch/zone
**Permissions**:
- View assigned tasks (party setup, zone supervision)
- Mark tasks complete
- View active sessions in assigned zone
- Safety incident reporting

### 6. PARENT (Customer)
**Scope**: Own account
**Permissions**:
- Create child profiles
- Sign waivers
- Online booking (hourly, subscriptions, day care)
- Purchase memberships/visit packs
- View booking history & active sessions
- View receipts/invoices
- Party booking requests
- Manage payment methods

---

## DOMAIN OBJECTS

### Core Entities

#### Branch
- branch_id (PK)
- name, address, phone, email
- operating_hours (JSON: {monday: {open, close}, ...})
- timezone
- status (active/inactive)
- settings (JSON: grace_periods, overdue_rates, etc.)

#### Zone
- zone_id (PK)
- branch_id (FK)
- zone_name (e.g., "Indoor Playground", "Sand Area", "Day Care - Morning")
- zone_type (SOFTPLAY | SAND | DAYCARE | PARTY_ROOM | CAFE)
- capacity_per_slot (int)
- session_length_minutes (default duration, e.g., 60)
- grace_period_minutes (e.g., 10)
- overdue_rate_per_15min (decimal, SAR)
- operating_hours (can override branch hours)
- status (active/maintenance/closed)

#### User
- user_id (PK)
- email, password_hash
- role (ADMIN | MANAGER | CASHIER | RECEPTION | STAFF | PARENT)
- branch_id (FK, nullable for ADMIN)
- name, phone
- status (active/inactive)
- created_at, last_login

#### Customer (Parent)
- customer_id (PK, extends User)
- user_id (FK)
- loyalty_points (int)
- account_balance (decimal, for prepaid/credit)
- preferred_language (ar/en)
- emergency_contact_phone

#### Child
- child_id (PK)
- customer_id (FK)
- name, date_of_birth, age (computed)
- gender
- photo_url
- allergies (JSON array)
- medical_notes (text)
- emergency_contacts (JSON array: [{name, phone, relationship, authorized_pickup}])

---

### Waiver System

#### WaiverTemplate
- template_id (PK)
- branch_id (FK)
- name (e.g., "General Liability Waiver")
- content_ar (text)
- content_en (text)
- validity_days (e.g., 365)
- required_for_zones (JSON array of zone_types)
- version (int)
- active (boolean)

#### Waiver
- waiver_id (PK)
- template_id (FK)
- customer_id (FK, guardian)
- child_ids (JSON array)
- signed_at (datetime)
- expires_at (datetime, calculated from signed_at + validity_days)
- signature_data (JSON: device, IP, consent)
- status (DRAFT | SIGNED | VERIFIED | EXPIRED)
- verified_by (user_id, staff who verified at check-in)
- verified_at (datetime)

**State Transitions**:
- DRAFT → SIGNED (parent signs online)
- SIGNED → VERIFIED (staff verifies at check-in)
- VERIFIED → EXPIRED (after expires_at date)

---

### Product & Ordering

#### Product
- product_id (PK)
- branch_id (FK)
- sku (string, unique per branch)
- name_ar, name_en
- category (ADMISSION | ADDON | FOOD | BEVERAGE | RETAIL | MEMBERSHIP | PARTY_PACKAGE)
- product_type (HOURLY_PASS | VISIT_PACK | MONTHLY_SUBSCRIPTION | DAYCARE | CONSUMABLE | etc.)
- zone_id (FK, if admission product)
- price (decimal)
- tax_rate (decimal, e.g., 0.15 for 15% VAT)
- inventory_tracked (boolean)
- active (boolean)

#### Order
- order_id (PK)
- branch_id (FK)
- order_number (string, unique, e.g., "ORD-20260226-0123")
- order_source (POS | ONLINE | KIOSK)
- customer_id (FK, nullable for walk-in)
- created_by (user_id, staff who created order)
- status (DRAFT | CONFIRMED | PAID | PARTIALLY_REFUNDED | REFUNDED | CANCELLED)
- subtotal (decimal)
- discount_amount (decimal)
- tax_amount (decimal)
- total_amount (decimal)
- created_at, confirmed_at

#### OrderItem
- order_item_id (PK)
- order_id (FK)
- product_id (FK)
- quantity (int)
- unit_price (decimal, snapshot at order time)
- discount_amount (decimal, per item)
- tax_amount (decimal)
- total_amount (decimal)
- notes (text, e.g., "Extra spicy" for food items)

#### Payment
- payment_id (PK)
- order_id (FK)
- payment_method (CASH | CARD | WALLET | BANK_TRANSFER | ACCOUNT_CREDIT)
- amount (decimal)
- payment_gateway_id (string, from Stripe/etc if online)
- status (PENDING | COMPLETED | FAILED | REFUNDED)
- processed_at (datetime)
- processed_by (user_id)

#### Refund
- refund_id (PK)
- payment_id (FK)
- order_id (FK)
- amount (decimal)
- reason (enum or text)
- refund_method (ORIGINAL_METHOD | ACCOUNT_CREDIT | CASH)
- approved_by (user_id, manager)
- processed_at (datetime)
- status (PENDING | COMPLETED | FAILED)

---

### Booking & Sessions

#### Booking
- booking_id (PK)
- branch_id (FK)
- booking_number (string, unique)
- booking_type (HOURLY | DAYCARE | PARTY)
- customer_id (FK)
- child_ids (JSON array)
- zone_id (FK)
- order_id (FK, links to payment)
- booking_date (date)
- start_time, end_time (datetime)
- slot_id (FK, for slotted bookings)
- status (CREATED | CONFIRMED | CHECKED_IN | NO_SHOW | CANCELLED)
- cancellation_reason (text)
- cancelled_at (datetime)
- created_at

**State Transitions**:
- CREATED → CONFIRMED (after payment)
- CONFIRMED → CHECKED_IN (wristband scan at entry)
- CONFIRMED → NO_SHOW (if not checked in by start_time + grace)
- CONFIRMED → CANCELLED (user or admin cancellation)

#### Session
- session_id (PK)
- booking_id (FK)
- zone_id (FK)
- child_id (FK)
- wristband_id (FK, nullable if manual check-in)
- status (CREATED | CHECKED_IN | ACTIVE | ENDED | OVERDUE | CLOSED)
- check_in_time (datetime)
- scheduled_end_time (datetime)
- actual_end_time (datetime, nullable)
- check_out_time (datetime)
- duration_minutes (int, computed)
- extended_minutes (int, default 0)
- overdue_minutes (int, default 0)
- overdue_fee (decimal, default 0)
- checked_in_by (user_id, staff)
- checked_out_by (user_id)
- notes (text)

**State Machine**:
1. **CREATED**: Session created after booking confirmed
2. **CHECKED_IN**: Wristband scanned at entry, timer starts
3. **ACTIVE**: Session in progress (same as CHECKED_IN, explicit state)
4. **ENDED**: Check-out before/at scheduled_end_time (on-time)
5. **OVERDUE**: Check-out after scheduled_end_time + grace_period (fee applied)
6. **CLOSED**: Final state after payment settled (if overdue) or session completed

**Transition Rules**:
- CREATED → CHECKED_IN: Wristband scan + waiver verified
- CHECKED_IN/ACTIVE → ENDED: Check-out within grace period
- CHECKED_IN/ACTIVE → OVERDUE: Check-out after grace period
- OVERDUE → CLOSED: Overdue fee paid
- ENDED → CLOSED: Automatic (no fee)

#### Wristband
- wristband_id (PK)
- rfid_code (string, unique, scanned from physical band)
- branch_id (FK)
- status (AVAILABLE | ASSIGNED | ACTIVE | DAMAGED | LOST)
- current_session_id (FK, nullable)
- assigned_at (datetime)
- returned_at (datetime)
- notes (text)

**Lifecycle**:
- AVAILABLE: In stock, ready to assign
- ASSIGNED: Linked to session but not yet checked in
- ACTIVE: Session in progress
- AVAILABLE: Returned after check-out (reusable)
- DAMAGED/LOST: Taken out of circulation

---

### Memberships & Entitlements

#### MembershipPlan
- plan_id (PK)
- branch_id (FK)
- name_ar, name_en
- plan_type (UNLIMITED_MONTHLY | VISIT_PACK | QUARTERLY | ANNUAL)
- duration_days (int, e.g., 30 for monthly)
- total_visits (int, nullable for unlimited)
- allowed_zones (JSON array of zone_ids or zone_types)
- price (decimal)
- benefits (JSON: {discount_percentage, priority_booking, late_fee_waived, etc.})
- active (boolean)

#### Membership
- membership_id (PK)
- customer_id (FK)
- child_id (FK, if per-child plan)
- plan_id (FK)
- order_id (FK)
- membership_number (string, unique)
- status (ACTIVE | FROZEN | EXPIRED | CANCELLED)
- start_date (date)
- end_date (date)
- freeze_start_date (date, nullable)
- freeze_end_date (date, nullable)
- frozen_days_used (int, max allowed pauses)
- auto_renew (boolean)
- created_at

**State Transitions**:
- ACTIVE → FROZEN (user requests pause, extends end_date)
- FROZEN → ACTIVE (auto-resume at freeze_end_date)
- ACTIVE → EXPIRED (after end_date)
- ACTIVE/FROZEN → CANCELLED (user/admin cancellation)

#### Entitlement
- entitlement_id (PK)
- membership_id (FK)
- total_visits (int, from plan)
- visits_used (int)
- visits_remaining (computed: total - used)
- last_used_at (datetime)
- expires_at (datetime, from membership end_date)

**Consumption Rules**:
- Decrement visits_used at session CHECKED_IN state (not booking)
- Enforce visits_remaining > 0 before check-in
- Enforce expires_at not passed

#### LoyaltyTransaction
- transaction_id (PK)
- customer_id (FK)
- transaction_type (EARNED | REDEEMED | EXPIRED | ADJUSTED)
- points (int, positive for earned, negative for redeemed)
- order_id (FK, nullable)
- session_id (FK, nullable)
- notes (text)
- created_at

---

### Party System

#### PartyPackage
- package_id (PK)
- branch_id (FK)
- name_ar, name_en
- description_ar, description_en
- duration_minutes (e.g., 120)
- max_children (int)
- included_items (JSON: food, decorations, activities, etc.)
- price (decimal)
- deposit_amount (decimal)
- deposit_required (boolean)
- available_zones (JSON array of zone_ids)
- active (boolean)

#### PartyBooking
- party_booking_id (PK)
- branch_id (FK)
- customer_id (FK)
- package_id (FK)
- party_date (date)
- start_time, end_time (datetime)
- zone_id (FK, assigned party room)
- num_children (int)
- num_adults (int)
- order_id (FK, links to payment)
- deposit_paid (decimal)
- balance_due (decimal)
- status (REQUESTED | CONFIRMED | DEPOSIT_PAID | COMPLETED | CANCELLED)
- special_requests (text)
- created_at, confirmed_at

**Deposit Logic**:
- Booking requires deposit (e.g., 30% of total)
- Balance due at party completion or X days before
- Cancellation refund rules based on days before party

#### PartyTask
- task_id (PK)
- party_booking_id (FK)
- task_name (e.g., "Setup decorations", "Prepare cake", "Clean up")
- assigned_to (user_id, staff)
- due_time (datetime)
- completed (boolean)
- completed_at (datetime)
- completed_by (user_id)
- notes (text)

---

### Inventory

#### InventoryItem
- item_id (PK)
- branch_id (FK)
- sku (string, unique per branch)
- name_ar, name_en
- category (FOOD | BEVERAGE | RETAIL | SUPPLIES | CLEANING | OTHER)
- unit_of_measure (e.g., "piece", "kg", "liter")
- current_stock (decimal)
- reorder_level (decimal, low stock threshold)
- reorder_quantity (decimal)
- unit_cost (decimal)
- product_id (FK, nullable if not sold directly)
- active (boolean)

#### InventoryMovement
- movement_id (PK)
- item_id (FK)
- branch_id (FK)
- movement_type (PURCHASE | SALE | ADJUSTMENT | TRANSFER | WASTE | RETURN)
- quantity (decimal, positive for in, negative for out)
- unit_cost (decimal, at time of movement)
- total_cost (decimal)
- reference_id (order_id or transfer_id, nullable)
- notes (text)
- created_by (user_id)
- created_at

**Auto-deduction**:
- When order with inventory-tracked product is PAID, create SALE movement
- Decrement current_stock

---

### Audit & Reporting

#### AuditLog
- log_id (PK)
- entity_type (enum: ORDER, PAYMENT, BOOKING, SESSION, MEMBERSHIP, WAIVER, etc.)
- entity_id (UUID)
- action (enum: CREATED, UPDATED, DELETED, STATUS_CHANGED, OVERRIDE_APPLIED, etc.)
- actor_id (user_id, who performed action)
- actor_role (enum: ADMIN, MANAGER, CASHIER, etc.)
- before_state (JSON, snapshot before)
- after_state (JSON, snapshot after)
- ip_address (string)
- device_info (string)
- notes (text)
- timestamp (datetime)

**Mandatory Logging**:
- All manual overrides (capacity, refunds, late fee waivers)
- All status changes (orders, bookings, sessions, memberships)
- All payment/refund transactions
- All admin configuration changes

---

## KEY BUSINESS RULES

### Booking & Capacity
1. **Capacity Enforcement**: sum(confirmed_bookings for slot) <= zone.capacity_per_slot
2. **Manager Override**: Managers can override capacity with audit log + justification
3. **Slot Expiry**: Cart bookings expire after 10 minutes if not paid
4. **No Double Booking**: One child cannot have overlapping CONFIRMED bookings in same zone

### Waiver Verification
1. **Check-in Block**: Cannot check in (scan wristband) if waiver not SIGNED for guardian + child
2. **Expiry Check**: Waiver must not be expired (signed_at + validity_days > today)
3. **Zone Requirement**: Some zones may require specific waiver types

### Session Timing & Overdue
1. **Grace Period**: Defined per zone (e.g., 10 minutes)
2. **Overdue Calculation**: 
   - overdue_minutes = max(0, (check_out_time - scheduled_end_time) - grace_period)
   - Round up to next 15-min interval
   - overdue_fee = (overdue_minutes / 15) × zone.overdue_rate_per_15min
3. **Auto-Extension**: Cashier/Reception can extend session before check-out (adds to scheduled_end_time)
4. **Block New Bookings**: Customer with unpaid overdue fees cannot make new bookings

### Membership Consumption
1. **Deduction Point**: Decrement visits_used at SESSION.CHECKED_IN (not at booking)
2. **Freeze Rules**: 
   - Max 2 freeze periods per membership
   - Min 7 days, Max 30 days per freeze
   - Extends end_date by freeze duration
3. **Expiry**: Membership expires at end_date even if visits remain
4. **Benefits**: Members get discounts, priority booking, late fee grace

### Inventory Auto-Deduction
1. **Trigger**: Order status changes to PAID
2. **Action**: Create SALE movement for each inventory-tracked product in order
3. **Low Stock Alert**: If current_stock <= reorder_level, flag for manager

### Party Deposits
1. **Deposit Required**: Configurable per package (e.g., 30%)
2. **Balance Due**: X days before party (configurable)
3. **Cancellation Refund**:
   - >30 days: 100% refund
   - 15-30 days: 50% refund
   - <15 days: No refund (forfeit deposit)

---

## MULTI-BRANCH SCOPING

### Global Entities (No branch_id)
- User (roles), Role, AuditLog (but logs branch context)

### Branch-Scoped Entities (Must have branch_id)
- Branch, Zone, Product, Order, Booking, Session, Wristband, Membership, PartyBooking, InventoryItem

### HQ Admin View
- Can switch branch context or view "All Branches"
- Reports aggregate across branches or filter by branch

### Branch Staff View
- See only their assigned branch_id data
- Cannot access other branches

---

## INTEGRATION POINTS

### Payment Gateway
- Stripe/local gateway for online orders
- POS terminal integration for card payments at reception

### Notification Services
- WhatsApp (via Twilio or provider) for booking confirmations, reminders
- SMS for OTPs, late pickup alerts
- Email for receipts, invoices, party booking confirmations

### QR Code / RFID Scanner
- **Device Activator** (existing in repo): Must integrate, not rebuild
- Scan wristband RFID → lookup session → trigger check-in/out

### Reporting & Analytics
- Daily close summary
- Sales by category, zone, time slot
- Utilization reports (capacity vs actual)
- Overdue fees collected
- Membership renewal rates

---

## STATE MACHINE SUMMARY

### Session States
```
CREATED → CHECKED_IN → ACTIVE → ENDED (on-time check-out)
                              ↓
                          OVERDUE (late check-out) → CLOSED (fee paid)
```

### Waiver States
```
DRAFT → SIGNED (parent signs) → VERIFIED (staff checks at entry) → EXPIRED (after validity_days)
```

### Booking States
```
CREATED → CONFIRMED (paid) → CHECKED_IN (session starts)
                          ↘
                           CANCELLED (before check-in)
                          ↓
                        NO_SHOW (past grace period, no check-in)
```

### Membership States
```
ACTIVE ⇄ FROZEN (pause/resume, max 2 times)
  ↓
EXPIRED (after end_date)
  or
CANCELLED (user/admin action)
```

---

## ACCEPTANCE CRITERIA (High-Level)

1. **End-to-End Booking Flow**:
   - Parent creates account → adds child → signs waiver
   - Books hourly session → pays online → receives QR code
   - Reception scans wristband → waiver verified → session starts (timer)
   - Child plays for duration + stays 20 min extra
   - Reception scans out → overdue fee calculated → parent pays → session closed

2. **POS Walk-In Flow**:
   - Walk-in customer at reception
   - Cashier creates order → selects zone + duration → checks waiver (signs on tablet if needed)
   - Payment (cash/card) → prints receipt → assigns wristband → check-in
   - Session ends on-time → check-out → wristband returned

3. **Membership Flow**:
   - Parent purchases monthly unlimited plan online
   - System creates membership + entitlement (unlimited visits)
   - Parent books slot using membership (no payment, just reservation)
   - Check-in decrements visit (if visit-based plan)
   - At end of month, membership expires or auto-renews

4. **Party Booking Flow**:
   - Parent requests party booking (date, package, num children)
   - Manager reviews → confirms → sends deposit invoice
   - Parent pays deposit (30%) → booking confirmed
   - 7 days before party: Balance due reminder sent
   - Day of party: Staff tasks assigned (setup, decorations, cake)
   - After party: Final invoice with any extras → payment → party completed

5. **Inventory Auto-Deduction**:
   - Order includes 2 soft drinks (inventory-tracked)
   - Order paid → system creates SALE movement (qty: -2)
   - current_stock decrements by 2
   - If stock <= reorder_level, manager receives low stock alert

---

## ARABIC-FIRST UI

- All customer-facing screens: Arabic primary, RTL layout
- Staff screens: Bilingual (Arabic/English toggle)
- Buttons, labels, messages, receipts: Arabic
- Database: Store both name_ar and name_en for products, zones, packages
- Backend API: Can accept language preference, returns localized strings

---

## UI STYLE LOCK (Peekaboo Playful Design System)

**Design Philosophy**: "Playful Shell + Professional Data Surfaces"

### Visual Style
- **Fun playful UI**: Rounded, bubbly, friendly for customer-facing features
- **Professional surfaces**: Clean, serious for money/data (POS, reports, tables, receipts)
- Cards: `24px` radius, `2px` light gray borders, soft shadows
- Inputs: `16px` radius
- Badges: Pill shape (`999px` radius)
- Buttons: `20px` radius with bouncy hover (`scale(1.02)`)

### Color Tokens (Design System)
```
Primary Yellow: #FFD93B  (main actions, highlights)
Blue: #00BBF9           (secondary actions, bookings)
Red: #FF595E            (danger, errors, overdue)
Orange: #FF924C         (warnings, pending, day care)
Green: #8AC926          (success, active, POS)
Outline Brown: #4A2C2A  (small accents only)
```

### Module Color Assignments (One Accent Per Screen)
- **POS**: Green
- **Bookings**: Blue
- **Day Care**: Orange
- **Memberships**: Yellow
- **Reports**: Blue
- **Settings**: Gray

### Typography (Arabic-First)
- **Headings**: Bold (700), round style
- **Body**: Regular (400), readable
- **POS Numbers**: Bold (700) + larger size for clarity
- **Fonts**: Noto Sans Arabic / Cairo (Arabic), Inter (Latin)

### Money-Safe Design Rules
- **Tables**: White background, subtle borders, bold totals row
- **Receipts**: Monochrome, print-friendly, clean layout
- **Invoices**: Professional PDF format
- **Refund/Void**: Strong red confirmation modal required
- **Audit Logs**: Clean table with color-coded actions

### Component Standards
- **Buttons**: Always rounded + slightly bouncy hover
- **Cards**: White + 2px border + optional colored top strip (4px) for modules
- **Badges**: Pill-shaped status indicators (Active=Green, Overdue=Red, Pending=Orange, Confirmed=Blue)
- **Icons**: Rounded/filled style (not sharp line icons)
- **Forms**: 1-2 column max, big tap targets (44px min), clear labels above inputs
- **Empty States**: Playful illustrations + encouraging text + primary CTA button

### Touch & Responsive
- **Minimum tap target**: 44px × 44px
- **POS buttons**: Larger (60px height) for easy tapping
- **RTL support**: Full right-to-left layout, reversed flexbox, mirrored icons

### Anti-Patterns (Avoid)
- ❌ Sharp corners (use 16px+ radius)
- ❌ Thin line icons (use filled/rounded)
- ❌ Rainbow layouts (one accent per screen)
- ❌ Harsh shadows (use soft only)
- ❌ Thin fonts (use 400 or 700)
- ❌ Playful styles on money tables (keep professional)

**Complete Style Guide**: See `/app/UI_STYLE_GUIDE.md` for full design system specification with CSS tokens, component specs, and implementation checklist.

---

**END OF PRODUCT SPEC**
