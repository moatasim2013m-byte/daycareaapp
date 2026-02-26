# ACCEPTANCE TESTS - End-to-End Scenarios

---

## TEST ENVIRONMENT SETUP

### Prerequisites
1. Running backend (FastAPI) on `http://localhost:8001`
2. Running frontend (React) on `http://localhost:3000`
3. MongoDB instance running with test database
4. Seed data loaded (see SEED_DATA section below)

### Seed Data Required
- 1 Branch: "Riyadh Main"
- 2 Zones: "Indoor Playground" (SOFTPLAY, capacity 30), "Sand Area" (SAND, capacity 20)
- 1 Admin user: admin@playzone.sa / Admin123!
- 1 Cashier user: cashier@playzone.sa / Cashier123!
- 1 Parent user: parent@playzone.sa / Parent123!
- 3 Products: "1 Hour Playground" (100 SAR), "1 Hour Sand" (80 SAR), "Cola 330ml" (5 SAR)
- 1 Waiver Template: "General Liability Waiver" (valid 365 days)
- 10 Available wristbands: RFID codes RFID001 - RFID010

---

## SCENARIO 1: End-to-End Booking Flow (Happy Path)

**Actors**: Parent (online), Reception (device), System

### Step 1: Parent Registration & Child Setup
**Action**: Parent creates account
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sara.ali@example.com",
    "password": "Sara123!",
    "name": "Sara Ali",
    "phone": "+966501112233",
    "preferred_language": "ar"
  }'
```

**Expected**:
- Status: 201 Created
- Response includes: `user_id`, `token`, `role: "PARENT"`

**Action**: Parent logs in (get token)
```bash
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sara.ali@example.com", "password": "Sara123!"}' \
  | jq -r '.data.token')
```

**Action**: Parent adds child
```bash
curl -X POST http://localhost:8001/api/children \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Layla Ali",
    "name_ar": "ليلى علي",
    "date_of_birth": "2020-05-15",
    "gender": "female",
    "allergies": ["peanuts"],
    "medical_notes": "None",
    "emergency_contacts": [
      {"name": "Sara Ali", "relationship": "mother", "phone": "+966501112233", "authorized_pickup": true},
      {"name": "Ahmed Ali", "relationship": "father", "phone": "+966509998877", "authorized_pickup": true}
    ]
  }'
```

**Expected**:
- Status: 201 Created
- Response includes: `child_id`, `age: 5` (computed)

---

### Step 2: Parent Signs Waiver
**Action**: Get waiver template
```bash
curl -X GET "http://localhost:8001/api/waivers/templates?branch_id=BRANCH_UUID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: List of templates with Arabic/English content

**Action**: Sign waiver
```bash
CHILD_ID="..." # From previous step
curl -X POST http://localhost:8001/api/waivers/sign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "TEMPLATE_UUID",
    "child_ids": ["'$CHILD_ID'"],
    "signature_data": {
      "device": "iPhone 14",
      "ip_address": "192.168.1.100",
      "consent": true
    }
  }'
```

**Expected**:
- Status: 201 Created
- Response: `{waiver_id, status: "SIGNED", expires_at: "2027-02-26T..."}`

---

### Step 3: Parent Books Hourly Session Online
**Action**: Check availability
```bash
curl -X GET "http://localhost:8001/api/bookings/availability?branch_id=BRANCH_UUID&zone_id=PLAYGROUND_ZONE_UUID&date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: List of slots with `available: true` for future times

**Action**: Create booking
```bash
curl -X POST http://localhost:8001/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "BRANCH_UUID",
    "booking_type": "HOURLY",
    "zone_id": "PLAYGROUND_ZONE_UUID",
    "customer_id": "CUSTOMER_UUID",
    "child_ids": ["'$CHILD_ID'"],
    "booking_date": "2026-02-28",
    "start_time": "2026-02-28T15:00:00Z",
    "end_time": "2026-02-28T17:00:00Z",
    "slot_id": "SLOT_UUID"
  }'
```

**Expected**:
- Status: 201 Created
- Response: `{booking_id, booking_number, order_id, status: "CREATED", payment_required: true}`

**Action**: Pay for booking
```bash
BOOKING_ID="..." # From previous response
ORDER_ID="..." # From previous response

curl -X POST "http://localhost:8001/api/orders/$ORDER_ID/pay" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "CARD",
    "amount": 115.00,
    "payment_gateway_id": "pi_test_12345"
  }'
```

**Expected**:
- Status: 200 OK
- Response: `{payment_id, status: "COMPLETED", order: {status: "PAID"}, receipt_url}`
- Booking status auto-updates to "CONFIRMED"

**Action**: Get QR code for check-in (frontend displays this)
```bash
curl -X GET "http://localhost:8001/api/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Response includes `qr_code_data` (Base64 image or data string)

---

### Step 4: Reception Check-In (Day of Booking)
**Actor**: Reception staff at kiosk

**Action**: Reception logs in
```bash
RECEPTION_TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "reception@playzone.sa", "password": "Reception123!"}' \
  | jq -r '.data.token')
```

**Action**: Scan wristband OR manual check-in
```bash
# Option A: Scan wristband (device sends RFID)
curl -X POST http://localhost:8001/api/sessions/check-in \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rfid_code": "RFID001",
    "booking_id": "'$BOOKING_ID'",
    "child_id": "'$CHILD_ID'",
    "zone_id": "PLAYGROUND_ZONE_UUID",
    "waiver_verified": true,
    "checked_in_by": "RECEPTION_USER_UUID"
  }'
```

**Expected**:
- Status: 200 OK
- Response:
  ```json
  {
    "session_id": "SESSION_UUID",
    "status": "CHECKED_IN",
    "check_in_time": "2026-02-28T15:05:00Z",
    "scheduled_end_time": "2026-02-28T17:05:00Z",
    "wristband_id": "WRISTBAND_UUID",
    "child": {
      "name": "Layla Ali",
      "allergies_alert": true,
      "allergies": ["peanuts"]
    }
  }
  ```
- Session created with status=CHECKED_IN
- Wristband status changed to ACTIVE
- Booking status changed to CHECKED_IN
- Timer started

**Action**: View active sessions dashboard
```bash
curl -X GET "http://localhost:8001/api/sessions/active?zone_id=PLAYGROUND_ZONE_UUID" \
  -H "Authorization: Bearer $RECEPTION_TOKEN"
```

**Expected**: List includes Layla's session with remaining_minutes = 120

---

### Step 5: Child Plays (Session Active)
**System Behavior**:
- Session status remains ACTIVE
- Backend can track time elapsed (check_in_time to now)
- Frontend dashboard shows live countdown timer

**Validation**:
```bash
# Check session still active after 1 hour
curl -X GET "http://localhost:8001/api/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $RECEPTION_TOKEN"
```

**Expected**: `status: "ACTIVE"`, remaining time ~60 minutes

---

### Step 6: Late Check-Out (Overdue Scenario)
**Scenario**: Parent arrives 20 minutes late (at 17:25 instead of 17:00, grace period is 10 min)

**Action**: Reception scans wristband for check-out
```bash
curl -X POST http://localhost:8001/api/sessions/check-out \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rfid_code": "RFID001",
    "checked_out_by": "RECEPTION_USER_UUID"
  }'
```

**Expected**:
- Status: 200 OK
- Response:
  ```json
  {
    "session_id": "SESSION_UUID",
    "status": "OVERDUE",
    "check_in_time": "2026-02-28T15:05:00Z",
    "check_out_time": "2026-02-28T17:25:00Z",
    "duration_minutes": 140,
    "overdue_minutes": 10,
    "overdue_fee": 30.00,
    "payment_required": true,
    "order_id": "OVERDUE_FEE_ORDER_UUID"
  }
  ```
- Overdue calculation:
  - Scheduled end: 17:05
  - Grace period: 10 min → 17:15
  - Actual check-out: 17:25
  - Overdue: 10 min → rounds to 15 min interval → 30 SAR fee
- New order created for overdue fee
- Wristband status changed to AVAILABLE

**Action**: Parent pays overdue fee
```bash
curl -X POST "http://localhost:8001/api/orders/$OVERDUE_ORDER_ID/pay" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "CASH",
    "amount": 30.00
  }'
```

**Expected**: Payment completed, session status → CLOSED

---

### Step 7: Validation & Audit
**Action**: Check audit log
```bash
curl -X GET "http://localhost:8001/api/audit-logs?entity_type=SESSION&entity_id=$SESSION_ID" \
  -H "Authorization: Bearer $RECEPTION_TOKEN"
```

**Expected**: Logs show:
- SESSION CREATED
- STATUS_CHANGED: CREATED → CHECKED_IN
- STATUS_CHANGED: CHECKED_IN → OVERDUE
- STATUS_CHANGED: OVERDUE → CLOSED

---

## SCENARIO 2: POS Walk-In Flow (No Prior Booking)

**Actors**: Cashier, Walk-in Customer

### Step 1: Walk-In Customer Arrives
**Action**: Cashier creates order at POS
```bash
CASHIER_TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "cashier@playzone.sa", "password": "Cashier123!"}' \
  | jq -r '.data.token')

curl -X POST http://localhost:8001/api/orders \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "BRANCH_UUID",
    "order_source": "POS",
    "customer_id": null,
    "items": [
      {"product_id": "PLAYGROUND_1HR_PRODUCT_UUID", "quantity": 1}
    ]
  }'
```

**Expected**: Order created with total 115 SAR (100 + 15% tax)

### Step 2: Check Waiver (New Walk-In)
**Action**: Cashier asks if customer has signed waiver
- If NO: Cashier provides tablet for on-site signing (same flow as Scenario 1, Step 2)
- If YES: Verify waiver exists and not expired

```bash
# Verify waiver
curl -X GET "http://localhost:8001/api/waivers/WAIVER_ID/verify" \
  -H "Authorization: Bearer $CASHIER_TOKEN"
```

**Expected**: `{valid: true}` or error if expired

### Step 3: Payment (Cash/Card POS)
```bash
curl -X POST "http://localhost:8001/api/orders/$ORDER_ID/pay" \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "CASH",
    "amount": 115.00
  }'
```

**Expected**: Payment completed, receipt printed

### Step 4: Immediate Check-In
**Action**: Assign wristband and check in
```bash
curl -X POST http://localhost:8001/api/sessions/check-in \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rfid_code": "RFID002",
    "order_id": "'$ORDER_ID'",
    "child_id": "'$CHILD_ID'",
    "zone_id": "PLAYGROUND_ZONE_UUID",
    "waiver_verified": true,
    "checked_in_by": "CASHIER_USER_UUID"
  }'
```

**Note**: Since no prior booking, system creates booking internally (status=CONFIRMED) then immediately checks in

**Expected**: Session started, wristband active

---

## SCENARIO 3: Membership Purchase & Usage

**Actors**: Parent (online)

### Step 1: Purchase Monthly Unlimited Membership
```bash
curl -X POST http://localhost:8001/api/memberships/purchase \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "MONTHLY_UNLIMITED_PLAN_UUID",
    "customer_id": "CUSTOMER_UUID",
    "child_id": "'$CHILD_ID'",
    "auto_renew": true
  }'
```

**Expected**: Membership created, order for 800 SAR

**Action**: Pay for membership
```bash
curl -X POST "http://localhost:8001/api/orders/$MEMBERSHIP_ORDER_ID/pay" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method": "CARD", "amount": 920.00}'
```

**Expected**: Membership status → ACTIVE, entitlement created (unlimited visits)

### Step 2: Book Using Membership (No Payment)
```bash
curl -X POST http://localhost:8001/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "BRANCH_UUID",
    "booking_type": "HOURLY",
    "zone_id": "PLAYGROUND_ZONE_UUID",
    "customer_id": "CUSTOMER_UUID",
    "child_ids": ["'$CHILD_ID'"],
    "booking_date": "2026-03-01",
    "start_time": "2026-03-01T10:00:00Z",
    "end_time": "2026-03-01T12:00:00Z",
    "membership_id": "MEMBERSHIP_UUID"
  }'
```

**Expected**: 
- Booking created with status=CONFIRMED (no payment needed)
- `payment_required: false`

### Step 3: Check-In with Membership
**Action**: Same as Scenario 1 Step 4 (check-in process)

**Expected**: 
- Session starts
- If visit-pack: `entitlement.visits_used` increments by 1

---

## SCENARIO 4: Party Booking with Deposit

**Actors**: Parent, Manager

### Step 1: Parent Requests Party
```bash
curl -X POST http://localhost:8001/api/party-bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "BRANCH_UUID",
    "package_id": "CLASSIC_PARTY_PACKAGE_UUID",
    "party_date": "2026-03-15",
    "start_time": "2026-03-15T16:00:00Z",
    "end_time": "2026-03-15T18:00:00Z",
    "num_children": 12,
    "num_adults": 10,
    "special_requests": "Dinosaur theme decorations"
  }'
```

**Expected**:
- Party booking created with status=REQUESTED
- Deposit order created (450 SAR = 30% of 1500 SAR)

### Step 2: Parent Pays Deposit
```bash
curl -X POST "http://localhost:8001/api/orders/$DEPOSIT_ORDER_ID/pay" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method": "CARD", "amount": 517.50}'
```

**Expected**: Deposit paid, party booking status → DEPOSIT_PAID

### Step 3: Manager Confirms Party
```bash
MANAGER_TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@playzone.sa", "password": "Manager123!"}' \
  | jq -r '.data.token')

curl -X PATCH "http://localhost:8001/api/party-bookings/$PARTY_BOOKING_ID/confirm" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assigned_zone_id": "PARTY_ROOM_1_UUID"}'
```

**Expected**: Status → CONFIRMED, zone assigned

### Step 4: Manager Creates Tasks
```bash
curl -X POST "http://localhost:8001/api/party-bookings/$PARTY_BOOKING_ID/tasks" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"task_name": "Setup dinosaur decorations", "task_name_ar": "تجهيز ديكور الديناصورات", "assigned_to": "STAFF_USER_UUID", "due_time": "2026-03-15T15:30:00Z"},
      {"task_name": "Prepare cake and snacks", "task_name_ar": "تجهيز الكيك والوجبات", "assigned_to": "STAFF_USER_UUID_2", "due_time": "2026-03-15T15:45:00Z"}
    ]
  }'
```

**Expected**: Tasks created, assigned staff notified

### Step 5: Day of Party - Balance Due
**Action**: Parent pays remaining balance
```bash
curl -X POST "http://localhost:8001/api/orders/$BALANCE_ORDER_ID/pay" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method": "CARD", "amount": 1207.50}'
```

**Expected**: Balance paid, party booking status → COMPLETED after party

---

## SCENARIO 5: Inventory Auto-Deduction

**Actors**: Cashier, System

### Step 1: Order with Inventory-Tracked Product
```bash
curl -X POST http://localhost:8001/api/orders \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "BRANCH_UUID",
    "order_source": "POS",
    "items": [
      {"product_id": "COLA_PRODUCT_UUID", "quantity": 5}
    ]
  }'
```

**Action**: Pay for order
```bash
curl -X POST "http://localhost:8001/api/orders/$ORDER_ID/pay" \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method": "CASH", "amount": 28.75}'
```

**Expected**:
- Payment completed
- Backend automatically creates inventory movement:
  - `movement_type: "SALE"`
  - `quantity: -5`
  - `reference_id: ORDER_ID`
- Cola inventory `current_stock` decrements by 5

**Validation**:
```bash
curl -X GET "http://localhost:8001/api/inventory/items/COLA_ITEM_ID" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected**: `current_stock` decreased by 5

**Action**: Check if low stock alert triggered
```bash
curl -X GET "http://localhost:8001/api/inventory/items?branch_id=BRANCH_UUID&low_stock=true" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected**: If `current_stock <= reorder_level`, Cola appears in list

---

## SCENARIO 6: Manager Override (Capacity Exceeded)

**Actors**: Manager

### Scenario: Zone at full capacity, VIP customer walk-in

**Action**: Attempt booking when zone full
```bash
curl -X POST http://localhost:8001/api/bookings \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "BRANCH_UUID",
    "zone_id": "PLAYGROUND_ZONE_UUID",
    "booking_date": "2026-02-28",
    "start_time": "2026-02-28T15:00:00Z",
    ...
  }'
```

**Expected**: Error 400 - "Zone capacity exceeded"

**Action**: Manager override
```bash
curl -X POST http://localhost:8001/api/bookings \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    ...
    "manager_override": true,
    "override_reason": "VIP customer - accommodating in safe area"
  }'
```

**Expected**:
- Booking created despite capacity
- Audit log entry created with override details

**Validation**:
```bash
curl -X GET "http://localhost:8001/api/audit-logs?entity_type=BOOKING&action=OVERRIDE_APPLIED" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected**: Log shows manager override with reason

---

## SCENARIO 7: Waiver Expiry & Check-In Block

**Actors**: Reception

### Step 1: Waiver Expires
**System**: Cron job runs daily, marks expired waivers

**Action**: Simulate waiver expiry (manual DB update for test)
```bash
# Update waiver expires_at to yesterday
```

### Step 2: Attempt Check-In with Expired Waiver
```bash
curl -X POST http://localhost:8001/api/sessions/check-in \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rfid_code": "RFID003",
    "booking_id": "BOOKING_WITH_EXPIRED_WAIVER_UUID",
    "child_id": "'$CHILD_ID'",
    "zone_id": "PLAYGROUND_ZONE_UUID",
    "waiver_verified": true,
    "checked_in_by": "RECEPTION_USER_UUID"
  }'
```

**Expected**:
- Status: 400 Bad Request
- Error: `{code: "WAIVER_EXPIRED", message: "Waiver expired. Please sign a new waiver."}`
- Check-in blocked

---

## REPORTING VALIDATION

### Daily Close Report
```bash
curl -X GET "http://localhost:8001/api/reports/daily-close?branch_id=BRANCH_UUID&date=2026-02-28" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected**: 
- `total_sales` matches sum of all PAID orders for date
- `sales_by_category` breakdown correct
- `overdue_fees_collected` matches sum of overdue fee orders paid

### Zone Utilization Report
```bash
curl -X GET "http://localhost:8001/api/reports/zone-utilization?branch_id=BRANCH_UUID&start_date=2026-02-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected**:
- `average_occupancy` = avg(active sessions per hour) / capacity
- `utilization_rate` = average_occupancy / capacity
- `peak_time` shows most booked time slots

---

## PERFORMANCE TESTS

### Concurrent Bookings (Capacity Lock Test)
**Test**: 10 users try to book last slot simultaneously

**Expected**: Only 1 succeeds, others get "Capacity full" error

**Implementation**: Use load testing tool (e.g., `wrk`, `hey`, or custom script)

### Wristband Scan Response Time
**Test**: Measure response time for check-in scan

**Expected**: < 500ms for wristband lookup + session creation

---

## FAILURE SCENARIOS

### Payment Gateway Timeout
**Test**: Simulate payment gateway timeout
- Booking created, payment pending
- Gateway times out after 5 minutes
- System auto-expires booking, releases capacity

### Device Offline (Wristband Scanner)
**Test**: Device loses connection mid-scan
- Device queues check-in event locally
- When connection restored, sync check-in
- System validates and creates session retroactively

---

**END OF ACCEPTANCE TESTS**
