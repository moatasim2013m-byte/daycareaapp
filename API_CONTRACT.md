# API CONTRACT - REST Endpoints

**Base URL**: `https://[domain]/api`

**Authentication**: JWT Bearer token in `Authorization` header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Standard Response Format**:
```javascript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  }
}
```

---

## AUTHENTICATION & USERS

### POST /auth/register
**Purpose**: Register new parent account
**Auth**: None
**Body**:
```javascript
{
  "email": "parent@example.com",
  "password": "SecurePass123!",
  "name": "Ahmed Ali",
  "phone": "+966501234567",
  "preferred_language": "ar"
}
```
**Response**: `{user_id, email, role: "PARENT", token}`

### POST /auth/login
**Purpose**: Login (all roles)
**Auth**: None
**Body**: `{email, password}`
**Response**: `{user_id, email, role, branch_id, token, expires_at}`

### POST /auth/logout
**Purpose**: Invalidate token
**Auth**: Required
**Response**: `{success: true}`

### GET /users/me
**Purpose**: Get current user profile
**Auth**: Required
**Response**: `{user_id, email, role, name, phone, ...}`

### PATCH /users/me
**Purpose**: Update own profile
**Auth**: Required
**Body**: `{name?, phone?, preferred_language?}`

---

## BRANCHES & ZONES (Admin/Manager)

### GET /branches
**Purpose**: List all branches (ADMIN) or assigned branch (Manager)
**Auth**: ADMIN | MANAGER
**Query**: `?status=active`
**Response**: `{branches: [{branch_id, name, name_ar, address, status, ...}]}`

### POST /branches
**Purpose**: Create branch
**Auth**: ADMIN
**Body**: `{name, name_ar, address, phone, email, operating_hours, settings}`

### GET /branches/:branch_id/zones
**Purpose**: List zones for branch
**Auth**: Any authenticated (filtered by role)
**Response**: `{zones: [{zone_id, zone_name, zone_name_ar, zone_type, capacity_per_slot, ...}]}`

### POST /branches/:branch_id/zones
**Purpose**: Create zone
**Auth**: ADMIN | MANAGER
**Body**: `{zone_name, zone_name_ar, zone_type, capacity_per_slot, session_length_minutes, grace_period_minutes, overdue_rate_per_15min, operating_hours}`

---

## CHILDREN & WAIVERS (Parent)

### GET /children
**Purpose**: List own children
**Auth**: PARENT
**Response**: `{children: [{child_id, name, name_ar, date_of_birth, age, allergies, medical_notes, ...}]}`

### POST /children
**Purpose**: Add child profile
**Auth**: PARENT
**Body**: `{name, name_ar, date_of_birth, gender, photo_url?, allergies, medical_notes, emergency_contacts}`

### PATCH /children/:child_id
**Purpose**: Update child info
**Auth**: PARENT (own child only)

### GET /waivers/templates
**Purpose**: Get active waiver templates for branch
**Auth**: PARENT
**Query**: `?branch_id=uuid`
**Response**: `{templates: [{template_id, name_ar, content_ar, content_en, validity_days}]}`

### POST /waivers/sign
**Purpose**: Sign waiver
**Auth**: PARENT
**Body**: `{template_id, child_ids: ["uuid"], signature_data: {device, ip_address, consent: true}}`
**Response**: `{waiver_id, signed_at, expires_at, status: "SIGNED"}`

### GET /waivers/my
**Purpose**: List own waivers
**Auth**: PARENT
**Query**: `?status=VERIFIED&child_id=uuid`

### GET /waivers/:waiver_id/verify
**Purpose**: Verify waiver validity (used by reception at check-in)
**Auth**: RECEPTION | CASHIER
**Response**: `{valid: true, waiver_id, expires_at, child_ids, status}`

---

## PRODUCTS (Public read, Admin write)

### GET /products
**Purpose**: List products
**Auth**: Optional (public for PARENT, filtered by branch for staff)
**Query**: `?branch_id=uuid&category=ADMISSION&active=true`
**Response**: `{products: [{product_id, sku, name_ar, name_en, category, product_type, zone_id, price, ...}]}`

### POST /products
**Purpose**: Create product
**Auth**: ADMIN | MANAGER
**Body**: `{branch_id, sku, name_ar, name_en, category, product_type, zone_id?, price, tax_rate, inventory_tracked}`

### PATCH /products/:product_id
**Purpose**: Update product
**Auth**: ADMIN | MANAGER

---

## ORDERS & PAYMENTS (POS + Online)

### POST /orders
**Purpose**: Create order (POS or online cart)
**Auth**: CASHIER (POS) | PARENT (online)
**Body**:
```javascript
{
  "branch_id": "uuid",
  "order_source": "POS" | "ONLINE",
  "customer_id": "uuid", // Nullable for walk-in
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "notes": "Extra spicy"
    }
  ],
  "discount_amount": 10.00 // Optional
}
```
**Response**: `{order_id, order_number, total_amount, status: "DRAFT"}`

### GET /orders/:order_id
**Purpose**: Get order details
**Auth**: CASHIER | MANAGER (any order) | PARENT (own order)

### POST /orders/:order_id/confirm
**Purpose**: Confirm order (moves to CONFIRMED, ready for payment)
**Auth**: CASHIER | PARENT
**Response**: `{order_id, status: "CONFIRMED", payment_required: true}`

### POST /orders/:order_id/pay
**Purpose**: Process payment
**Auth**: CASHIER | PARENT
**Body**:
```javascript
{
  "payment_method": "CASH" | "CARD" | "WALLET",
  "amount": 207.00,
  "payment_gateway_id": "pi_stripe_123" // If online
}
```
**Response**: `{payment_id, status: "COMPLETED", order: {status: "PAID"}, receipt_url}`

### POST /orders/:order_id/refund
**Purpose**: Issue refund
**Auth**: MANAGER (approval required)
**Body**: `{amount, reason, refund_method}`
**Response**: `{refund_id, status: "COMPLETED", amount}`

### GET /orders
**Purpose**: List orders (reports)
**Auth**: CASHIER | MANAGER | ADMIN
**Query**: `?branch_id=uuid&status=PAID&start_date=2026-02-01&end_date=2026-02-28`

---

## BOOKINGS (Parent + POS)

### GET /bookings/availability
**Purpose**: Check slot availability
**Auth**: PARENT | CASHIER
**Query**: `?branch_id=uuid&zone_id=uuid&date=2026-02-28`
**Response**:
```javascript
{
  "date": "2026-02-28",
  "zone": {...},
  "slots": [
    {
      "slot_id": "uuid",
      "start_time": "2026-02-28T15:00:00Z",
      "end_time": "2026-02-28T17:00:00Z",
      "capacity_available": 10,
      "capacity_total": 30,
      "available": true
    },
    ...
  ]
}
```

### POST /bookings
**Purpose**: Create booking (creates order internally if paid booking)
**Auth**: PARENT | CASHIER
**Body**:
```javascript
{
  "branch_id": "uuid",
  "booking_type": "HOURLY",
  "zone_id": "uuid",
  "customer_id": "uuid",
  "child_ids": ["child-uuid"],
  "booking_date": "2026-02-28",
  "start_time": "2026-02-28T15:00:00Z",
  "end_time": "2026-02-28T17:00:00Z",
  "slot_id": "slot-uuid" // If slot-based
}
```
**Response**: `{booking_id, booking_number, order_id, status: "CREATED", payment_required: true}`

**Flow**: 
1. Create booking → status=CREATED
2. Create order with admission product
3. Parent pays → order status=PAID, booking status=CONFIRMED
4. Generate QR code for check-in

### GET /bookings/:booking_id
**Purpose**: Get booking details
**Auth**: PARENT (own) | STAFF (any)

### PATCH /bookings/:booking_id/cancel
**Purpose**: Cancel booking
**Auth**: PARENT (own, before check-in) | MANAGER (any)
**Body**: `{cancellation_reason}`
**Response**: `{booking_id, status: "CANCELLED", refund_amount?}`

### GET /bookings
**Purpose**: List bookings
**Auth**: PARENT (own) | STAFF (branch-filtered)
**Query**: `?customer_id=uuid&status=CONFIRMED&booking_date=2026-02-28`

---

## SESSIONS & CHECK-IN/OUT (Reception)

### POST /sessions/check-in
**Purpose**: Check in customer (scan wristband or manual)
**Auth**: RECEPTION | CASHIER
**Body**:
```javascript
{
  "booking_id": "uuid", // OR
  "rfid_code": "RFID123456", // Scanned wristband
  "child_id": "uuid",
  "zone_id": "uuid",
  "waiver_verified": true, // Staff confirms
  "checked_in_by": "reception-user-uuid"
}
```
**Process**:
1. Validate booking exists & status=CONFIRMED
2. Verify waiver signed & not expired for child
3. Check zone capacity not exceeded
4. Create session with status=CHECKED_IN
5. Link wristband to session (wristband status=ACTIVE)
6. Start timer (scheduled_end_time = check_in_time + session_length)

**Response**: 
```javascript
{
  "session_id": "uuid",
  "status": "CHECKED_IN",
  "check_in_time": "2026-02-28T15:05:00Z",
  "scheduled_end_time": "2026-02-28T17:05:00Z",
  "wristband_id": "uuid",
  "child": {name, allergies_alert: true}
}
```

### POST /sessions/check-out
**Purpose**: Check out customer
**Auth**: RECEPTION | CASHIER
**Body**:
```javascript
{
  "session_id": "uuid", // OR
  "rfid_code": "RFID123456", // Scanned wristband
  "checked_out_by": "reception-user-uuid"
}
```
**Process**:
1. Lookup session by wristband or session_id
2. Validate session status=ACTIVE
3. Calculate duration, check for overdue
4. If overdue: calculate fee, create fee order
5. Update session status=ENDED or OVERDUE
6. Wristband status=AVAILABLE (returned)

**Response**:
```javascript
{
  "session_id": "uuid",
  "status": "ENDED" | "OVERDUE",
  "check_in_time": "...",
  "check_out_time": "2026-02-28T17:25:00Z",
  "duration_minutes": 140,
  "overdue_minutes": 10,
  "overdue_fee": 30.00,
  "payment_required": true, // If overdue fee
  "order_id": "overdue-fee-order-uuid"
}
```

### PATCH /sessions/:session_id/extend
**Purpose**: Extend session time (before check-out)
**Auth**: RECEPTION | CASHIER
**Body**: `{extension_minutes: 60}`
**Response**: `{session_id, scheduled_end_time: "new-time", extended_minutes: 60}`

### GET /sessions/active
**Purpose**: List active sessions (live dashboard)
**Auth**: RECEPTION | MANAGER
**Query**: `?branch_id=uuid&zone_id=uuid`
**Response**: 
```javascript
{
  "sessions": [
    {
      "session_id": "uuid",
      "child": {name, photo_url},
      "zone": {zone_name_ar},
      "check_in_time": "...",
      "scheduled_end_time": "...",
      "remaining_minutes": 45,
      "status": "ACTIVE",
      "wristband_id": "uuid"
    },
    ...
  ]
}
```

---

## WRISTBANDS (Reception)

### GET /wristbands/available
**Purpose**: List available wristbands for assignment
**Auth**: RECEPTION
**Query**: `?branch_id=uuid`
**Response**: `{wristbands: [{wristband_id, rfid_code, status: "AVAILABLE"}]}`

### POST /wristbands/assign
**Purpose**: Assign wristband to session (done during check-in, usually auto)
**Auth**: RECEPTION
**Body**: `{wristband_id, session_id}`

### POST /wristbands/return
**Purpose**: Mark wristband returned (done during check-out, usually auto)
**Auth**: RECEPTION
**Body**: `{wristband_id}`

### GET /wristbands/:rfid_code
**Purpose**: Lookup wristband by RFID scan
**Auth**: RECEPTION (device scan)
**Response**: `{wristband_id, status, current_session_id, session: {...}}`

---

## MEMBERSHIPS (Parent + Admin)

### GET /membership-plans
**Purpose**: List available plans
**Auth**: PARENT | STAFF
**Query**: `?branch_id=uuid&active=true`
**Response**: `{plans: [{plan_id, name_ar, name_en, plan_type, duration_days, total_visits, price, benefits}]}`

### POST /memberships/purchase
**Purpose**: Buy membership (creates order internally)
**Auth**: PARENT
**Body**: `{plan_id, customer_id, child_id?, auto_renew: true}`
**Response**: `{membership_id, order_id, payment_required: true}`

**Flow**: 
1. Create membership with status=DRAFT
2. Create order for membership
3. Parent pays → membership status=ACTIVE
4. If visit-pack: create entitlement record

### GET /memberships/my
**Purpose**: List own memberships
**Auth**: PARENT
**Response**: `{memberships: [{membership_id, plan: {...}, status, start_date, end_date, visits_remaining}]}`

### PATCH /memberships/:membership_id/freeze
**Purpose**: Pause membership
**Auth**: PARENT (own)
**Body**: `{freeze_days: 14}`
**Response**: `{status: "FROZEN", freeze_end_date, new_end_date}`

### PATCH /memberships/:membership_id/resume
**Purpose**: Resume frozen membership
**Auth**: PARENT
**Response**: `{status: "ACTIVE"}`

### POST /memberships/:membership_id/consume
**Purpose**: Consume visit (called internally during session check-in)
**Auth**: SYSTEM (internal, not exposed to client)
**Logic**: Decrement entitlement.visits_used, validate visits_remaining > 0

---

## PARTY BOOKINGS (Parent + Manager)

### GET /party-packages
**Purpose**: List party packages
**Auth**: PARENT | STAFF
**Query**: `?branch_id=uuid&active=true`

### POST /party-bookings
**Purpose**: Request party booking
**Auth**: PARENT
**Body**:
```javascript
{
  "branch_id": "uuid",
  "package_id": "uuid",
  "party_date": "2026-03-15",
  "start_time": "2026-03-15T16:00:00Z",
  "end_time": "2026-03-15T18:00:00Z",
  "num_children": 12,
  "num_adults": 10,
  "special_requests": "Dinosaur theme"
}
```
**Response**: `{party_booking_id, status: "REQUESTED", deposit_amount, deposit_order_id}`

### PATCH /party-bookings/:id/confirm
**Purpose**: Confirm party booking (after deposit paid)
**Auth**: MANAGER
**Response**: `{status: "CONFIRMED", assigned_zone_id}`

### POST /party-bookings/:id/tasks
**Purpose**: Create tasks for party
**Auth**: MANAGER
**Body**: `{tasks: [{task_name, task_name_ar, assigned_to, due_time}]}`

### GET /party-bookings/:id/tasks
**Purpose**: List tasks for party
**Auth**: STAFF (assigned) | MANAGER

### PATCH /tasks/:task_id/complete
**Purpose**: Mark task done
**Auth**: STAFF (assigned)
**Body**: `{notes: "Decorations setup complete"}`

---

## INVENTORY (Manager + Cashier)

### GET /inventory/items
**Purpose**: List inventory items
**Auth**: MANAGER | CASHIER
**Query**: `?branch_id=uuid&category=BEVERAGE&low_stock=true`
**Response**: `{items: [{item_id, sku, name_ar, name_en, current_stock, reorder_level, unit_cost}]}`

### POST /inventory/movements
**Purpose**: Record inventory movement (purchase, adjustment, waste)
**Auth**: MANAGER
**Body**: `{item_id, movement_type: "PURCHASE", quantity: 100, unit_cost: 1.50, notes}`
**Response**: `{movement_id, new_stock: 220}`

**Auto-Deduction**: When order with inventory-tracked products is paid, backend automatically creates SALE movement

### GET /inventory/movements
**Purpose**: View movement history
**Auth**: MANAGER
**Query**: `?item_id=uuid&start_date=2026-02-01&end_date=2026-02-28`

---

## REPORTS (Manager + Admin)

### GET /reports/daily-close
**Purpose**: Daily sales summary
**Auth**: MANAGER | ADMIN
**Query**: `?branch_id=uuid&date=2026-02-26`
**Response**:
```javascript
{
  "date": "2026-02-26",
  "branch": {...},
  "summary": {
    "total_sales": 15000.00,
    "total_orders": 45,
    "total_refunds": 500.00,
    "cash_sales": 3000.00,
    "card_sales": 12000.00,
    "average_order_value": 333.33
  },
  "sales_by_category": {
    "ADMISSION": 10000.00,
    "FOOD": 3000.00,
    "BEVERAGE": 2000.00
  },
  "active_sessions": 12,
  "overdue_fees_collected": 450.00
}
```

### GET /reports/zone-utilization
**Purpose**: Zone capacity utilization
**Auth**: MANAGER | ADMIN
**Query**: `?branch_id=uuid&start_date=2026-02-01&end_date=2026-02-28`
**Response**:
```javascript
{
  "zones": [
    {
      "zone_name_ar": "منطقة اللعب الداخلي",
      "zone_type": "SOFTPLAY",
      "capacity": 30,
      "average_occupancy": 22.5,
      "utilization_rate": 0.75,
      "peak_time": "16:00-18:00",
      "total_sessions": 450
    },
    ...
  ]
}
```

### GET /reports/overdue-fees
**Purpose**: Overdue fees summary
**Auth**: MANAGER | ADMIN
**Query**: `?branch_id=uuid&status=unpaid&start_date=2026-02-01`
**Response**: `{total_overdue: 1200.00, unpaid_sessions: 12, details: [...]}`

### GET /reports/membership-renewals
**Purpose**: Membership renewal rates
**Auth**: MANAGER | ADMIN
**Query**: `?branch_id=uuid&month=2026-02`
**Response**: `{expiring: 20, renewed: 15, renewal_rate: 0.75, revenue: 12000.00}`

---

## AUDIT LOGS (Admin + Manager)

### GET /audit-logs
**Purpose**: View audit trail
**Auth**: ADMIN | MANAGER (branch-scoped)
**Query**: `?entity_type=ORDER&entity_id=uuid&actor_id=uuid&start_date=2026-02-01`
**Response**: `{logs: [{log_id, action, actor_id, before_state, after_state, timestamp, notes}]}`

---

## DEVICE ACTIVATOR INTEGRATION (Reception Device)

**Note**: These endpoints integrate with existing wristband/device activator system

### POST /devices/scan
**Purpose**: Handle RFID scan event from device
**Auth**: Device API key or JWT
**Body**:
```javascript
{
  "device_id": "KIOSK-001",
  "rfid_code": "RFID123456789",
  "scan_type": "CHECK_IN" | "CHECK_OUT",
  "timestamp": "2026-02-28T15:05:00Z"
}
```
**Process**:
1. Lookup wristband by rfid_code
2. Find associated session (if check-out) or booking (if check-in)
3. Call /sessions/check-in or /sessions/check-out internally
4. Return status to device

**Response**:
```javascript
{
  "success": true,
  "action": "CHECK_IN",
  "child_name": "Sara Ahmed",
  "zone_name_ar": "منطقة اللعب",
  "scheduled_end_time": "2026-02-28T17:05:00Z",
  "message_ar": "مرحباً سارة! استمتعي بوقتك",
  "alerts": ["تنبيه: حساسية من الفول السوداني"]
}
```

### GET /devices/status
**Purpose**: Device health check
**Auth**: Device API key
**Response**: `{device_id, status: "online", last_sync: "...", pending_updates: 0}`

---

**END OF API CONTRACT**
