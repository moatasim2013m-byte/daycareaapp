# DATA MODEL - MongoDB Collections & Indexes

---

## COLLECTION DESIGN PRINCIPLES

1. **Branch Scoping**: All operational collections include `branch_id` for multi-branch filtering
2. **Embedded vs Referenced**: 
   - Embed: Small, rarely-changing data (e.g., child details in booking)
   - Reference: Large, frequently-updated, or shared data (use FK pattern)
3. **Denormalization**: Snapshot pricing, names at transaction time (order_items, payments)
4. **Timestamps**: All collections have `created_at`, operational entities have `updated_at`
5. **Soft Deletes**: Use `active` or `status` flags instead of hard deletes for audit trail

---

## COLLECTIONS

### 1. branches
**Purpose**: Store branch locations and settings

```javascript
{
  "_id": ObjectId(),
  "branch_id": "uuid-string", // Business key, indexed
  "name": "Riyadh Main Branch",
  "name_ar": "الفرع الرئيسي بالرياض",
  "address": {
    "street": "King Fahd Road",
    "city": "Riyadh",
    "postal_code": "12345",
    "country": "SA"
  },
  "phone": "+966501234567",
  "email": "riyadh@playzone.sa",
  "operating_hours": {
    "sunday": {"open": "09:00", "close": "22:00"},
    "monday": {"open": "09:00", "close": "22:00"},
    // ... rest of week
    "saturday": {"closed": true}
  },
  "timezone": "Asia/Riyadh",
  "settings": {
    "default_grace_period_minutes": 10,
    "default_overdue_rate_per_15min": 30.00,
    "currency": "SAR",
    "tax_rate": 0.15,
    "language_default": "ar"
  },
  "status": "active", // active | inactive
  "created_at": ISODate("2026-01-15T10:00:00Z"),
  "updated_at": ISODate("2026-02-20T14:30:00Z")
}
```

**Indexes**:
- `{branch_id: 1}` (unique)
- `{status: 1}`

---

### 2. zones
**Purpose**: Define areas within branch (playground, sand, daycare rooms, party rooms)

```javascript
{
  "_id": ObjectId(),
  "zone_id": "uuid-string",
  "branch_id": "uuid-string", // FK to branches
  "zone_name": "Indoor Playground - Main Hall",
  "zone_name_ar": "منطقة اللعب الداخلي - القاعة الرئيسية",
  "zone_type": "SOFTPLAY", // SOFTPLAY | SAND | DAYCARE | PARTY_ROOM | CAFE
  "capacity_per_slot": 30,
  "session_length_minutes": 60,
  "grace_period_minutes": 10,
  "overdue_rate_per_15min": 30.00,
  "operating_hours": { // Can override branch hours
    "sunday": {"open": "10:00", "close": "21:00"},
    // ...
  },
  "status": "active", // active | maintenance | closed
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{zone_id: 1}` (unique)
- `{branch_id: 1, zone_type: 1}`
- `{branch_id: 1, status: 1}`

---

### 3. users
**Purpose**: All user accounts (staff, parents)

```javascript
{
  "_id": ObjectId(),
  "user_id": "uuid-string",
  "email": "parent@example.com",
  "password_hash": "bcrypt-hash",
  "role": "PARENT", // ADMIN | MANAGER | CASHIER | RECEPTION | STAFF | PARENT
  "branch_id": "uuid-string", // Nullable for ADMIN, required for branch staff
  "name": "Ahmed Ali",
  "phone": "+966501234567",
  "preferred_language": "ar", // ar | en
  "status": "active", // active | inactive | suspended
  "last_login": ISODate(),
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{user_id: 1}` (unique)
- `{email: 1}` (unique)
- `{role: 1, branch_id: 1}`
- `{branch_id: 1, status: 1}`

---

### 4. customers
**Purpose**: Extended profile for PARENT role users (loyalty, balance, etc.)

```javascript
{
  "_id": ObjectId(),
  "customer_id": "uuid-string",
  "user_id": "uuid-string", // FK to users
  "loyalty_points": 150,
  "account_balance": 50.00, // Prepaid credit or negative if overdue debt
  "emergency_contact_phone": "+966509876543",
  "notes": "Preferred contact: WhatsApp",
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{customer_id: 1}` (unique)
- `{user_id: 1}` (unique)

---

### 5. children
**Purpose**: Child profiles linked to parent customers

```javascript
{
  "_id": ObjectId(),
  "child_id": "uuid-string",
  "customer_id": "uuid-string", // FK to customers (parent)
  "name": "Sara Ahmed",
  "name_ar": "سارة أحمد",
  "date_of_birth": ISODate("2020-05-15"),
  "age": 5, // Computed field
  "gender": "female", // male | female | other
  "photo_url": "https://cdn.example.com/photos/child123.jpg",
  "allergies": ["peanuts", "dairy"],
  "medical_notes": "Asthma - inhaler required",
  "emergency_contacts": [
    {
      "name": "Fatima Ali",
      "relationship": "mother",
      "phone": "+966501234567",
      "authorized_pickup": true
    },
    {
      "name": "Omar Ali",
      "relationship": "father",
      "phone": "+966509876543",
      "authorized_pickup": true
    }
  ],
  "active": true,
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{child_id: 1}` (unique)
- `{customer_id: 1}` (all children for a parent)

---

### 6. waiver_templates
**Purpose**: Waiver document templates per branch

```javascript
{
  "_id": ObjectId(),
  "template_id": "uuid-string",
  "branch_id": "uuid-string",
  "name": "General Liability Waiver",
  "name_ar": "إقرار المسؤولية العامة",
  "content_ar": "أقر أنا الموقع أدناه...",
  "content_en": "I, the undersigned, acknowledge...",
  "validity_days": 365,
  "required_for_zones": ["SOFTPLAY", "SAND", "DAYCARE"], // Empty = all zones
  "version": 2,
  "active": true,
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{template_id: 1}` (unique)
- `{branch_id: 1, active: 1}`

---

### 7. waivers
**Purpose**: Signed waivers by customers

```javascript
{
  "_id": ObjectId(),
  "waiver_id": "uuid-string",
  "template_id": "uuid-string", // FK
  "customer_id": "uuid-string", // Guardian who signed
  "child_ids": ["child-uuid-1", "child-uuid-2"],
  "signed_at": ISODate("2026-02-01T10:30:00Z"),
  "expires_at": ISODate("2027-02-01T10:30:00Z"),
  "signature_data": {
    "device": "iPhone 14",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "consent": true
  },
  "status": "VERIFIED", // DRAFT | SIGNED | VERIFIED | EXPIRED
  "verified_by": "staff-user-uuid", // User who verified at check-in
  "verified_at": ISODate("2026-02-05T14:00:00Z"),
  "created_at": ISODate()
}
```

**Indexes**:
- `{waiver_id: 1}` (unique)
- `{customer_id: 1, status: 1}`
- `{child_ids: 1}` (for child waiver lookup)
- `{expires_at: 1}` (for expiry checks)

---

### 8. products
**Purpose**: All sellable items (admissions, memberships, food, retail)

```javascript
{
  "_id": ObjectId(),
  "product_id": "uuid-string",
  "branch_id": "uuid-string",
  "sku": "SOFT-1HR",
  "name_ar": "ساعة واحدة - منطقة اللعب",
  "name_en": "1 Hour - Playground",
  "description_ar": "تشمل الدخول لمدة ساعة واحدة",
  "description_en": "Includes 1 hour admission",
  "category": "ADMISSION", // ADMISSION | ADDON | FOOD | BEVERAGE | RETAIL | MEMBERSHIP | PARTY_PACKAGE
  "product_type": "HOURLY_PASS", // HOURLY_PASS | VISIT_PACK | MONTHLY_SUBSCRIPTION | DAYCARE | CONSUMABLE | etc.
  "zone_id": "uuid-string", // FK, for admission products
  "price": 100.00,
  "tax_rate": 0.15,
  "inventory_tracked": false, // True for food/retail
  "inventory_item_id": null, // FK if tracked
  "active": true,
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{product_id: 1}` (unique)
- `{branch_id: 1, category: 1, active: 1}`
- `{sku: 1, branch_id: 1}` (unique composite)

---

### 9. orders
**Purpose**: Unified order for all transactions (POS + online)

```javascript
{
  "_id": ObjectId(),
  "order_id": "uuid-string",
  "branch_id": "uuid-string",
  "order_number": "ORD-20260226-0001",
  "order_source": "POS", // POS | ONLINE | KIOSK
  "customer_id": "uuid-string", // Nullable for anonymous walk-ins
  "created_by": "staff-user-uuid",
  "status": "PAID", // DRAFT | CONFIRMED | PAID | PARTIALLY_REFUNDED | REFUNDED | CANCELLED
  "items": [
    {
      "order_item_id": "uuid",
      "product_id": "uuid",
      "product_name_ar": "ساعة واحدة",
      "product_name_en": "1 Hour",
      "quantity": 2,
      "unit_price": 100.00,
      "discount_amount": 10.00,
      "tax_amount": 13.50,
      "total_amount": 203.50
    }
  ],
  "subtotal": 200.00,
  "discount_amount": 20.00,
  "tax_amount": 27.00,
  "total_amount": 207.00,
  "notes": "Walk-in customer, 2 children",
  "created_at": ISODate(),
  "confirmed_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{order_id: 1}` (unique)
- `{order_number: 1}` (unique)
- `{branch_id: 1, status: 1, created_at: -1}` (reporting)
- `{customer_id: 1, created_at: -1}` (customer history)

---

### 10. payments
**Purpose**: Payment records for orders

```javascript
{
  "_id": ObjectId(),
  "payment_id": "uuid-string",
  "order_id": "uuid-string", // FK
  "payment_method": "CARD", // CASH | CARD | WALLET | BANK_TRANSFER | ACCOUNT_CREDIT
  "amount": 207.00,
  "payment_gateway_id": "pi_stripe_12345", // From Stripe/gateway
  "status": "COMPLETED", // PENDING | COMPLETED | FAILED | REFUNDED
  "processed_at": ISODate(),
  "processed_by": "cashier-user-uuid",
  "notes": "Card ending in 1234",
  "created_at": ISODate()
}
```

**Indexes**:
- `{payment_id: 1}` (unique)
- `{order_id: 1}`
- `{payment_gateway_id: 1}` (for webhook lookups)

---

### 11. refunds
**Purpose**: Refund transactions

```javascript
{
  "_id": ObjectId(),
  "refund_id": "uuid-string",
  "payment_id": "uuid-string", // FK
  "order_id": "uuid-string", // FK
  "amount": 100.00,
  "reason": "Customer cancellation",
  "refund_method": "ORIGINAL_METHOD", // ORIGINAL_METHOD | ACCOUNT_CREDIT | CASH
  "approved_by": "manager-user-uuid",
  "processed_at": ISODate(),
  "status": "COMPLETED", // PENDING | COMPLETED | FAILED
  "notes": "Cancelled 2 days before booking",
  "created_at": ISODate()
}
```

**Indexes**:
- `{refund_id: 1}` (unique)
- `{order_id: 1}`
- `{payment_id: 1}`

---

### 12. bookings
**Purpose**: Reservation for zone access (hourly, daycare, party)

```javascript
{
  "_id": ObjectId(),
  "booking_id": "uuid-string",
  "branch_id": "uuid-string",
  "booking_number": "BK-20260226-001",
  "booking_type": "HOURLY", // HOURLY | DAYCARE | PARTY
  "customer_id": "uuid-string",
  "child_ids": ["child-uuid-1"], // Can be multiple for family bookings
  "zone_id": "uuid-string",
  "order_id": "uuid-string", // FK to order (payment link)
  "booking_date": ISODate("2026-02-28"),
  "start_time": ISODate("2026-02-28T15:00:00Z"),
  "end_time": ISODate("2026-02-28T17:00:00Z"),
  "slot_id": "slot-uuid", // FK if using slot-based system
  "status": "CONFIRMED", // CREATED | CONFIRMED | CHECKED_IN | NO_SHOW | CANCELLED
  "cancellation_reason": null,
  "cancelled_at": null,
  "notes": "Birthday party for 2 children",
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{booking_id: 1}` (unique)
- `{booking_number: 1}` (unique)
- `{branch_id: 1, zone_id: 1, booking_date: 1}` (capacity checks)
- `{customer_id: 1, status: 1, booking_date: -1}` (customer history)
- `{child_ids: 1, start_time: 1}` (prevent double booking same child)

---

### 13. sessions
**Purpose**: Active play sessions with timer and check-in/out tracking

```javascript
{
  "_id": ObjectId(),
  "session_id": "uuid-string",
  "booking_id": "uuid-string", // FK
  "zone_id": "uuid-string",
  "child_id": "uuid-string",
  "wristband_id": "uuid-string", // FK, nullable if manual check-in
  "status": "ACTIVE", // CREATED | CHECKED_IN | ACTIVE | ENDED | OVERDUE | CLOSED
  "check_in_time": ISODate("2026-02-28T15:05:00Z"),
  "scheduled_end_time": ISODate("2026-02-28T17:00:00Z"),
  "actual_end_time": null,
  "check_out_time": null,
  "duration_minutes": null, // Computed at check-out
  "extended_minutes": 0,
  "overdue_minutes": 0,
  "overdue_fee": 0.00,
  "checked_in_by": "reception-user-uuid",
  "checked_out_by": null,
  "notes": "Child excited, no issues",
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{session_id: 1}` (unique)
- `{booking_id: 1}`
- `{wristband_id: 1, status: 1}` (for scan lookup)
- `{zone_id: 1, status: 1, check_in_time: -1}` (active sessions per zone)
- `{child_id: 1, status: 1}` (prevent double check-in)
- `{status: 1, scheduled_end_time: 1}` (for overdue detection cron)

---

### 14. wristbands
**Purpose**: Physical RFID wristband inventory and assignment

```javascript
{
  "_id": ObjectId(),
  "wristband_id": "uuid-string",
  "rfid_code": "RFID123456789", // Unique physical ID
  "branch_id": "uuid-string",
  "status": "ACTIVE", // AVAILABLE | ASSIGNED | ACTIVE | DAMAGED | LOST
  "current_session_id": "session-uuid", // FK, nullable
  "assigned_at": ISODate("2026-02-28T15:05:00Z"),
  "returned_at": null,
  "notes": "Blue wristband, size M",
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{wristband_id: 1}` (unique)
- `{rfid_code: 1}` (unique, for scan lookup)
- `{branch_id: 1, status: 1}` (available wristbands)
- `{current_session_id: 1}` (session link)

---

### 15. membership_plans
**Purpose**: Membership/visit pack plan templates

```javascript
{
  "_id": ObjectId(),
  "plan_id": "uuid-string",
  "branch_id": "uuid-string",
  "name_ar": "اشتراك شهري غير محدود",
  "name_en": "Monthly Unlimited Pass",
  "plan_type": "UNLIMITED_MONTHLY", // UNLIMITED_MONTHLY | VISIT_PACK | QUARTERLY | ANNUAL
  "duration_days": 30,
  "total_visits": null, // Null for unlimited, int for visit packs
  "allowed_zones": ["SOFTPLAY", "SAND"], // Empty = all zones
  "price": 800.00,
  "benefits": {
    "discount_percentage": 10,
    "priority_booking": true,
    "late_fee_waived": 1, // First late pickup free
    "loyalty_bonus_multiplier": 1.5
  },
  "active": true,
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{plan_id: 1}` (unique)
- `{branch_id: 1, active: 1}`

---

### 16. memberships
**Purpose**: Customer's active membership instances

```javascript
{
  "_id": ObjectId(),
  "membership_id": "uuid-string",
  "customer_id": "uuid-string",
  "child_id": "uuid-string", // If per-child plan
  "plan_id": "uuid-string", // FK
  "order_id": "uuid-string", // FK to purchase order
  "membership_number": "MEM-2026-001",
  "status": "ACTIVE", // ACTIVE | FROZEN | EXPIRED | CANCELLED
  "start_date": ISODate("2026-02-01"),
  "end_date": ISODate("2026-03-01"),
  "freeze_start_date": null,
  "freeze_end_date": null,
  "frozen_days_used": 0, // Max 2 freeze periods
  "auto_renew": true,
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{membership_id: 1}` (unique)
- `{membership_number: 1}` (unique)
- `{customer_id: 1, status: 1}`
- `{child_id: 1, status: 1}`
- `{end_date: 1, status: 1}` (expiry checks)

---

### 17. entitlements
**Purpose**: Track visit usage for visit-pack memberships

```javascript
{
  "_id": ObjectId(),
  "entitlement_id": "uuid-string",
  "membership_id": "uuid-string", // FK
  "total_visits": 12,
  "visits_used": 5,
  "visits_remaining": 7, // Computed
  "last_used_at": ISODate("2026-02-20T14:00:00Z"),
  "expires_at": ISODate("2026-03-01"),
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{entitlement_id: 1}` (unique)
- `{membership_id: 1}` (unique, one entitlement per membership)

---

### 18. loyalty_transactions
**Purpose**: Loyalty points earning and redemption log

```javascript
{
  "_id": ObjectId(),
  "transaction_id": "uuid-string",
  "customer_id": "uuid-string",
  "transaction_type": "EARNED", // EARNED | REDEEMED | EXPIRED | ADJUSTED
  "points": 50, // Positive for earned, negative for redeemed
  "order_id": "uuid-string", // FK, nullable
  "session_id": null,
  "notes": "Earned 10% of order amount",
  "created_at": ISODate()
}
```

**Indexes**:
- `{transaction_id: 1}` (unique)
- `{customer_id: 1, created_at: -1}` (customer points history)

---

### 19. party_packages
**Purpose**: Pre-defined party packages

```javascript
{
  "_id": ObjectId(),
  "package_id": "uuid-string",
  "branch_id": "uuid-string",
  "name_ar": "حفلة عيد ميلاد كلاسيك",
  "name_en": "Classic Birthday Party",
  "description_ar": "تشمل ديكورات، كيك، وجبات خفيفة",
  "description_en": "Includes decorations, cake, snacks",
  "duration_minutes": 120,
  "max_children": 15,
  "included_items": {
    "decorations": true,
    "cake": "1 medium cake",
    "food": "Pizza + juice boxes for 15",
    "activities": "2 hours supervised play",
    "staff": "2 party hosts"
  },
  "price": 1500.00,
  "deposit_amount": 450.00, // 30%
  "deposit_required": true,
  "available_zones": ["PARTY_ROOM_1", "PARTY_ROOM_2"],
  "active": true,
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{package_id: 1}` (unique)
- `{branch_id: 1, active: 1}`

---

### 20. party_bookings
**Purpose**: Customer party reservations

```javascript
{
  "_id": ObjectId(),
  "party_booking_id": "uuid-string",
  "branch_id": "uuid-string",
  "customer_id": "uuid-string",
  "package_id": "uuid-string",
  "party_date": ISODate("2026-03-15"),
  "start_time": ISODate("2026-03-15T16:00:00Z"),
  "end_time": ISODate("2026-03-15T18:00:00Z"),
  "zone_id": "party-room-1-uuid",
  "num_children": 12,
  "num_adults": 10,
  "order_id": "uuid-string", // FK to payment
  "deposit_paid": 450.00,
  "balance_due": 1050.00,
  "status": "DEPOSIT_PAID", // REQUESTED | CONFIRMED | DEPOSIT_PAID | COMPLETED | CANCELLED
  "special_requests": "Themed decorations: Dinosaurs",
  "created_at": ISODate(),
  "confirmed_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{party_booking_id: 1}` (unique)
- `{branch_id: 1, party_date: 1, zone_id: 1}` (scheduling conflicts)
- `{customer_id: 1, party_date: -1}`

---

### 21. party_tasks
**Purpose**: Staff task checklist for party execution

```javascript
{
  "_id": ObjectId(),
  "task_id": "uuid-string",
  "party_booking_id": "uuid-string", // FK
  "task_name": "Setup balloons and banners",
  "task_name_ar": "تجهيز البالونات واللافتات",
  "assigned_to": "staff-user-uuid",
  "due_time": ISODate("2026-03-15T15:30:00Z"), // 30 min before party
  "completed": false,
  "completed_at": null,
  "completed_by": null,
  "notes": "Use blue and green balloons",
  "created_at": ISODate()
}
```

**Indexes**:
- `{task_id: 1}` (unique)
- `{party_booking_id: 1}`
- `{assigned_to: 1, completed: 1, due_time: 1}` (staff todo list)

---

### 22. inventory_items
**Purpose**: Stock items (food, beverages, supplies)

```javascript
{
  "_id": ObjectId(),
  "item_id": "uuid-string",
  "branch_id": "uuid-string",
  "sku": "DRINK-COLA-330",
  "name_ar": "كولا 330 مل",
  "name_en": "Cola 330ml",
  "category": "BEVERAGE", // FOOD | BEVERAGE | RETAIL | SUPPLIES | CLEANING | OTHER
  "unit_of_measure": "piece",
  "current_stock": 120,
  "reorder_level": 50,
  "reorder_quantity": 200,
  "unit_cost": 1.50,
  "product_id": "product-uuid", // FK if sold directly
  "active": true,
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

**Indexes**:
- `{item_id: 1}` (unique)
- `{branch_id: 1, sku: 1}` (unique composite)
- `{branch_id: 1, current_stock: 1, reorder_level: 1}` (low stock alerts)

---

### 23. inventory_movements
**Purpose**: All inventory transactions (purchases, sales, adjustments)

```javascript
{
  "_id": ObjectId(),
  "movement_id": "uuid-string",
  "item_id": "uuid-string", // FK
  "branch_id": "uuid-string",
  "movement_type": "SALE", // PURCHASE | SALE | ADJUSTMENT | TRANSFER | WASTE | RETURN
  "quantity": -10, // Negative for out, positive for in
  "unit_cost": 1.50,
  "total_cost": -15.00,
  "reference_id": "order-uuid", // FK to order (if SALE)
  "notes": "Sold with order ORD-20260226-001",
  "created_by": "cashier-user-uuid",
  "created_at": ISODate()
}
```

**Indexes**:
- `{movement_id: 1}` (unique)
- `{item_id: 1, created_at: -1}` (item history)
- `{branch_id: 1, movement_type: 1, created_at: -1}` (reporting)

---

### 24. audit_logs
**Purpose**: Comprehensive audit trail for all actions

```javascript
{
  "_id": ObjectId(),
  "log_id": "uuid-string",
  "entity_type": "SESSION", // ORDER | PAYMENT | BOOKING | SESSION | MEMBERSHIP | WAIVER | etc.
  "entity_id": "session-uuid",
  "action": "STATUS_CHANGED", // CREATED | UPDATED | DELETED | STATUS_CHANGED | OVERRIDE_APPLIED | etc.
  "actor_id": "reception-user-uuid",
  "actor_role": "RECEPTION",
  "before_state": {
    "status": "CHECKED_IN",
    "scheduled_end_time": "2026-02-28T17:00:00Z"
  },
  "after_state": {
    "status": "ACTIVE",
    "scheduled_end_time": "2026-02-28T18:00:00Z", // Extended
    "extended_minutes": 60
  },
  "ip_address": "192.168.1.50",
  "device_info": "Reception iPad",
  "notes": "Extended session by 1 hour upon customer request",
  "timestamp": ISODate("2026-02-28T16:50:00Z")
}
```

**Indexes**:
- `{log_id: 1}` (unique)
- `{entity_type: 1, entity_id: 1, timestamp: -1}` (entity history)
- `{actor_id: 1, timestamp: -1}` (user activity)
- `{timestamp: -1}` (recent logs)

---

## CRITICAL INDEXES SUMMARY

### For Capacity Checks (Performance Critical)
```javascript
bookings: {branch_id: 1, zone_id: 1, booking_date: 1, status: 1}
sessions: {zone_id: 1, status: 1, check_in_time: -1}
```

### For Wristband Scans (Sub-second Lookup)
```javascript
wristbands: {rfid_code: 1} (unique)
sessions: {wristband_id: 1, status: 1}
```

### For Reporting Queries
```javascript
orders: {branch_id: 1, status: 1, created_at: -1}
inventory_movements: {branch_id: 1, created_at: -1}
sessions: {zone_id: 1, check_in_time: -1}
```

### For Expiry Detection Crons
```javascript
waivers: {expires_at: 1, status: 1}
memberships: {end_date: 1, status: 1}
sessions: {status: 1, scheduled_end_time: 1}
```

### For Multi-Branch Filtering
```javascript
// All branch-scoped collections
{branch_id: 1, ...other_fields}
```

---

## DENORMALIZATION STRATEGY

### Snapshot at Transaction Time
When creating `order_items`, copy:
- `product_name_ar`, `product_name_en` (from products)
- `unit_price` (current price at time of order)

**Reason**: Product names/prices may change; order history should reflect what was actually sold.

### Embedded Documents
- `emergency_contacts` in `children` (small, read with child profile)
- `items` array in `orders` (avoid extra join, order items always fetched with order)
- `signature_data` in `waivers` (single-use metadata)

### Referenced Documents
- `customer_id`, `zone_id`, `product_id` (frequently updated, shared across many docs)
- Use FK pattern with indexes for joins

---

**END OF DATA MODEL**
