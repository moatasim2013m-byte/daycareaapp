# HOURLY BOOKING LOGIC - PLAYGROUND & SAND AREAS

## 1) SLOT MODEL

### Slot Generation
- **Time Slice**: 15-minute intervals (configurable: 15/30/60 min)
- **Operating Hours**: Define per area (e.g., 9:00 AM - 9:00 PM)
- **Slot Creation**: Generate slots dynamically for next 30 days on daily cron job
- **Slot Structure**:
  - slot_id (unique)
  - area_type (playground / sand)
  - start_time (ISO 8601)
  - end_time (ISO 8601)
  - capacity_total (e.g., 30 for playground, 20 for sand)
  - capacity_booked (current bookings)
  - capacity_available (total - booked)
  - status (active / blocked / maintenance)
  - price_override (optional, for special pricing)

### Booking Slot Lock
- **On Cart Add**:
  - Create tentative booking record with status = 'cart'
  - Decrement capacity_available
  - Set expiry_time = current_time + 10 minutes
  - Return cart_token (UUID)

- **On Checkout Initiate**:
  - Validate cart_token not expired
  - Change status from 'cart' to 'payment_pending'
  - Extend expiry_time = current_time + 5 minutes
  - Create payment_intent with payment gateway
  - Return payment_intent_id

- **On Payment Success**:
  - Change booking status to 'confirmed'
  - Remove expiry_time
  - Generate ticket_id (unique, 8-char alphanumeric)
  - Generate QR code data
  - Send confirmation (email/WhatsApp/SMS)

- **On Payment Failure**:
  - Change booking status to 'failed'
  - Increment capacity_available (release slot)
  - Log failure reason
  - Notify user with retry option

### Idempotency (Avoid Double Booking)
- **Cart Level**:
  - Use session_id + area + date + time as composite key
  - Check if active booking exists before creating new cart
  - Lock with database transaction (SELECT FOR UPDATE)

- **Payment Level**:
  - Use payment_intent_id as idempotency key
  - If webhook receives duplicate payment success, check booking status first
  - If already confirmed, log duplicate and ignore

- **Database Constraints**:
  - Unique index on (customer_id, area_type, start_time, status='confirmed')
  - Check constraint: capacity_booked <= capacity_total

### Cart Expiry Cleanup
- **Background Job** (runs every 2 minutes):
  - Find all bookings with status='cart' or 'payment_pending' and expiry_time < now
  - Change status to 'expired'
  - Increment capacity_available
  - Log expiry event

---

## 2) PRICING RULES

### Base Price Structure
- **Playground Hourly**: 
  - 1 hour = ₹300 (base)
  - 2 hours = ₹550 (8% discount)
  - 3 hours = ₹750 (17% discount)
  
- **Sand Hourly**:
  - 1 hour = ₹250 (base)
  - 2 hours = ₹450 (10% discount)
  - 3 hours = ₹600 (20% discount)

### Dynamic Pricing Modifiers (applied in order)

#### Day Type Multiplier
- **Weekday** (Mon-Thu): 1.0x (base price)
- **Weekend** (Fri-Sun): 1.3x
- **Public Holiday**: 1.5x (overrides weekend)

#### Time Slot Multiplier
- **Morning** (9 AM - 12 PM): 0.9x
- **Afternoon** (12 PM - 4 PM): 1.0x
- **Peak** (4 PM - 7 PM): 1.2x
- **Evening** (7 PM - 9 PM): 1.1x

#### Multi-Child Discount
- **1 child**: No discount
- **2 children**: 10% off total
- **3 children**: 15% off total
- **4+ children**: 20% off total (max)

#### Membership Tier Discount (stacks with multi-child)
- **Silver Member**: 5% off
- **Gold Member**: 10% off
- **Platinum Member**: 15% off

### Pricing Calculation Algorithm
```
Step 1: Get base_price by area and duration
Step 2: Apply day_type_multiplier
Step 3: Apply time_slot_multiplier
Step 4: Calculate subtotal = base_price × day_multiplier × time_multiplier
Step 5: Apply multi_child_discount on subtotal
Step 6: Apply membership_discount on discounted amount
Step 7: Apply coupon_discount (if valid) - percentage or fixed amount
Step 8: Calculate tax (GST 18%) on final amount
Step 9: Round to nearest ₹10
```

### Coupon Rules
- **Validation**:
  - Check coupon_code exists and active
  - Check valid_from and valid_until dates
  - Check usage_limit not exceeded
  - Check per_user_limit not exceeded
  - Check minimum_order_value met
  - Check applicable_areas (playground/sand/both)
  
- **Discount Types**:
  - Percentage: max_discount_amount cap applies
  - Fixed Amount: direct deduction
  - First-time user only: check if customer.first_booking = true

- **Application**:
  - Apply after all other discounts
  - Cannot combine multiple coupons
  - Log coupon usage with booking_id

### Price Override
- **Admin/Manager can set slot-level price_override**:
  - Overrides all multipliers
  - Discounts still apply on override price
  - Audit log entry required

---

## 3) CAPACITY MANAGEMENT

### Capacity Configuration
- **Per Area**:
  - playground: capacity = 30 children
  - sand: capacity = 20 children
  
- **Per Time Slice** (15-min):
  - capacity applies to any overlapping slots
  - Example: 3 PM-4 PM slot and 3:30 PM-4:30 PM slot share 3:30-4:00 capacity

### Overlapping Slot Capacity Check
- **When booking 2 PM - 4 PM**:
  - Find all slots that overlap (2:00-2:15, 2:15-2:30, ..., 3:45-4:00)
  - Check capacity_available ≥ num_children for EVERY slice
  - If any slice fails, reject entire booking
  - If all pass, decrement capacity_available for all affected slices

### Walk-in Handling
- **Reception creates walk-in booking**:
  - Check real-time capacity for current time slot + requested duration
  - If available:
    - Create booking with status='confirmed' (skip cart/payment flow)
    - Mark payment_method='cash' or 'card_pos'
    - Generate ticket immediately
  - If not available:
    - Show next available slot
    - Option to join waitlist

### Waitlist
- **Customer can join waitlist if slot full**:
  - Create waitlist entry with desired_time, area, num_children
  - When booking cancelled or no-show:
    - Check waitlist in FIFO order
    - Send notification to first eligible customer (30-min window to book)
    - If no response, move to next in queue

### Capacity Reservation for Members
- **Optional: Reserve 10% capacity for gold/platinum members**:
  - Split capacity: 27 public + 3 reserved (for playground)
  - Members can book from either pool
  - Reserved slots release 24 hours before start_time if unused

### Capacity Alerts
- **Auto-alerts when**:
  - Capacity reaches 80%: notify manager
  - Capacity reaches 100%: open waitlist
  - Multiple bookings cancelled same slot: investigate fraud

---

## 4) CHECK-IN / CHECK-OUT FLOW

### QR Code Data Structure
```
ticket_id: ABC12345 (8-char alphanumeric, unique)
booking_id: internal UUID
customer_id: UUID
area: playground | sand
num_children: 2
child_names: ["Aarav", "Ananya"] (optional)
child_ages: [5, 7] (optional)
scheduled_start: 2026-01-15T14:00:00Z
scheduled_end: 2026-01-15T16:00:00Z
checksum: SHA256(ticket_id + booking_id + secret_key) [first 16 chars]
```
- **Encode as**: JSON → Base64 → QR image
- **Security**: Checksum prevents tampering

### Check-In Rules

#### Pre-Check-In Validation
- **Scan QR at reception/kiosk device**
- **Validate**:
  - Checksum matches (anti-fraud)
  - ticket_id exists and status='confirmed'
  - Not already checked-in (check_in_time = null)
  - Not a past booking (scheduled_end > now)
  - Not already checked-out

#### Early Check-In Window
- **Allowed**: up to 15 minutes before scheduled_start
- **Before window**: Show "Too early, please wait" + countdown
- **Within window**: Proceed with check-in

#### Check-In Process
- **Set check_in_time = now**
- **Set booking_status = 'active'**
- **Calculate session_end_time**:
  - If checked in early: scheduled_end (no bonus time)
  - If checked in on time: scheduled_end
  - If checked in late (grace period): scheduled_end (time is lost)
- **Store device_id (which kiosk/device performed check-in)**
- **Print wristband** (optional):
  - Wristband contains ticket_id + expiry_time
  - Color-coded by area (playground=blue, sand=yellow)
- **Send check-in confirmation** (SMS/WhatsApp)

#### Late Check-In (Grace Period)
- **Grace period**: 30 minutes after scheduled_start
- **Within grace**: Allow check-in but no time extension
- **After grace**: Mark as no-show, suggest rebooking

### Check-Out Rules

#### Normal Check-Out
- **Scan QR/wristband at exit device**
- **Validate**:
  - ticket_id exists and status='active'
  - check_in_time is not null
  - check_out_time is null (not already checked out)
  
- **Set check_out_time = now**
- **Set booking_status = 'completed'**
- **Calculate actual_duration = check_out_time - check_in_time**
- **Check for overstay**: 
  - If actual_duration > booked_duration: calculate overstay_charge
  - If within booked time: no extra charge
- **Send exit notification** with receipt

#### Overstay Computation
- **Overstay starts after**: session_end_time + 10 min buffer
- **Overstay rate**: 1.5x base hourly rate, rounded to next 15 min
- **Example**:
  - Booked: 2 PM - 4 PM (2 hours)
  - Checked out: 4:25 PM
  - Buffer until: 4:10 PM (no charge)
  - Overstay: 4:10 PM - 4:25 PM = 15 min → charge for 15 min at 1.5x
  
- **Payment**:
  - If auto-pay enabled: charge saved payment method
  - Else: hold at exit, pay at reception
  - Block future bookings if overstay unpaid

#### Overstay Alerts
- **15 min before scheduled_end**: Send reminder to parent's phone
- **At scheduled_end + 5 min**: Send warning + overstay rate info
- **At scheduled_end + 15 min**: Send charge notification
- **Staff dashboard**: Real-time overstay alert list

### Auto-Close Sessions
- **End-of-Day Cron Job** (runs at 10 PM):
  - Find all bookings with status='active' and check_in_time not null and check_out_time = null
  - Set check_out_time = scheduled_end (assume on-time exit)
  - Set status = 'auto_closed'
  - No overstay charge applied
  - Log discrepancy for manual review

### Forced Check-Out (Staff Override)
- **Manager can force check-out**:
  - Enter ticket_id manually
  - Select reason (emergency, system error, etc.)
  - Set check_out_time = now or manual override time
  - Calculate charges (overstay if applicable)
  - Audit log entry with staff_id + reason

---

## 5) EDGE CASES & HANDLING

### Late Arrival (within grace period)
- **Scenario**: Customer books 2 PM, arrives 2:20 PM
- **Handling**:
  - Allow check-in until 2:30 PM (30-min grace)
  - Session still ends at scheduled_end (4 PM)
  - Customer loses 20 minutes (no refund)
  - Log late_arrival_minutes

### No-Show
- **Scenario**: Customer doesn't arrive within grace period
- **Detection**: scheduled_start + grace_period elapsed, still not checked in
- **Handling**:
  - Set status = 'no_show' (auto-triggered by cron job)
  - Release capacity for slot
  - Notify customer: "You missed your booking"
  - No refund (or apply no-show policy: e.g., 50% credit for next booking)
  - Log incident
  - After 3 no-shows: flag account, require prepaid bookings

### Partial Use (Early Exit)
- **Scenario**: Booked 2 hours, used only 1 hour
- **Handling**:
  - No refund for unused time (standard policy)
  - If customer requests: offer credit note (50% of unused time) for next booking
  - Manager approval required for credit
  - Log early_exit reason

### Child Swap (Not Allowed by Default)
- **Scenario**: Parent wants to bring different child than registered
- **Strict Policy**:
  - If child names mandatory: reject swap, security issue
  - If child names optional: allow, update child_names at check-in
  
- **Alternate Policy** (if business allows):
  - Allow swap with ID verification at reception
  - Update booking record with new child details
  - Audit log entry

### Extend Time (Mid-Session)
- **Scenario**: Parent wants to extend from 2 hours to 3 hours
- **Handling**:
  - Check capacity available for extended time slots
  - If available:
    - Calculate additional_charge (incremental pricing)
    - Process payment (app or at reception)
    - Update booking: new scheduled_end, new booked_duration
    - Send updated QR code (or update wristband expiry)
  - If not available:
    - Show next available slot
    - Offer to rebook

### Network/Device Offline (Fallback)
- **Scenario**: QR scanner device loses internet
- **Offline Mode**:
  - Device caches booking list for current day (synced hourly)
  - Check-in: validate against cached data, store locally with timestamp
  - When network returns: sync offline check-ins to server
  - Conflict resolution: server timestamp wins, flag duplicates

- **Manual Fallback**:
  - Reception verifies ticket_id in printed list or phone
  - Manually enters check-in in system
  - Adds note: "manual entry due to device issue"

### Device Malfunction (Can't Scan QR)
- **Scenario**: QR code damaged or scanner broken
- **Handling**:
  - Parent shows booking confirmation (email/app)
  - Staff searches by phone number or ticket_id
  - Manual check-in with staff device (tablet/phone)
  - Log: device_id = 'manual_entry_staff_X'

### Staff Manual Override (Emergency)
- **Scenarios Requiring Override**:
  - Customer forgot phone, no QR code
  - System error preventing check-in
  - Capacity exception for VIP customer
  - Incorrect booking needs correction
  
- **Override Process**:
  - Manager/supervisor only (role-based)
  - Enter override_reason (mandatory text field)
  - Attach ticket_id or create exception_ticket
  - Audit log with timestamp, staff_id, reason, action_taken
  - Daily report of all overrides for review

### Payment Failure After Check-In (Overstay)
- **Scenario**: Overstay charge fails (card declined)
- **Handling**:
  - Create outstanding_payment record
  - Block customer from future bookings until cleared
  - Send payment link via SMS/WhatsApp/email
  - After 3 days: send reminder
  - After 7 days: escalate to collections (phone call)
  - After 14 days: blacklist account

### Concurrent Check-In Attempts
- **Scenario**: Parent tries to check in same ticket from 2 devices
- **Prevention**:
  - Database lock on ticket_id during check-in transaction
  - First request wins, second gets "already checked in" error
  - Log duplicate attempt with device_id + timestamp (fraud detection)

### System Clock Mismatch
- **Scenario**: Device clock incorrect, causes validation errors
- **Prevention**:
  - All devices sync with NTP server
  - Backend uses UTC for all timestamps
  - Display times convert to local timezone for users
  - Validation allows ±5 min tolerance for clock drift

### Capacity Over-Booking (Race Condition)
- **Scenario**: 2 users book last slot simultaneously
- **Prevention**:
  - Database transaction with SELECT FOR UPDATE on capacity row
  - Pessimistic locking during checkout
  - One succeeds, other gets "slot full" error
  - Auto-offer next available slot

### Refund Request (Special Cases)
- **Scenario**: Customer requests refund for valid reason (illness, emergency)
- **Policy-Based Handling**:
  - >24 hours before: 100% refund or credit
  - 12-24 hours before: 50% refund
  - <12 hours: No refund (can reschedule once)
  - Manager discretion for emergencies
  
- **Process**:
  - Customer submits refund request with reason
  - Manager approves/rejects in admin panel
  - If approved: process refund via payment gateway (7-10 days)
  - Release capacity slot
  - Log refund transaction

---

## IMPLEMENTATION CHECKLIST

### Database Indexes Required
- (area_type, start_time, status) for slot queries
- (ticket_id) unique for fast check-in lookup
- (customer_id, status, scheduled_start) for user bookings
- (status, expiry_time) for cart cleanup job
- (check_in_time, check_out_time) for active sessions

### Background Jobs
- Cart expiry cleanup (every 2 min)
- No-show detection (every 15 min)
- Auto-close sessions (daily 10 PM)
- Overstay reminders (real-time or every 5 min)
- Slot generation (daily 1 AM)
- Waitlist notifications (on booking cancel)

### Real-Time Requirements
- Check-in/out must respond <2 seconds
- Capacity check must be real-time (no stale cache)
- Payment webhook processing <5 seconds

### Audit Logging
- All check-in/out events with device_id
- All manual overrides with staff_id + reason
- All capacity changes
- All pricing calculations with breakdown
- All refund/cancellation requests

### Testing Scenarios
- Load test: 100 concurrent bookings for same slot
- Test cart expiry during payment
- Test overstay billing with failed payment
- Test offline mode sync after network restore
- Test grace period edge cases (29 min, 31 min late)
- Test multi-child discount + membership stack
- Test coupon edge cases (expired, usage limit)

---

END OF DOCUMENT
