# SUBSCRIPTION SYSTEM LOGIC - INDOOR PLAYGROUND
## Arabic-First UI | Full Implementation Specification

---

## A) SUBSCRIPTION TYPES (ARABIC NAMES + RULES)

### 1) شهري – دخول غير محدود (المنطقة الداخلية)
**Plan Name**: Monthly Unlimited - Indoor Playground  
**Applies To**: Single child (per subscription)  
**Included Areas**: Indoor Playground only  
**Limits**:
- Daily: Unlimited entries (but max 1 active session at a time)
- Weekly: Unlimited
- Monthly: Valid for 30 days from activation
- Session Duration: Max 3 hours per visit (can re-enter after check-out)

**Validity**:
- Start: Date of purchase (or scheduled start date)
- End: 30 days from start
- Grace Period: 3 days after expiry (can still check-in, renewal prompt shown)

**Allowed Days/Times**:
- All days (Sunday - Saturday)
- Operating hours: 9 AM - 9 PM
- No time restrictions (unless plan specifies "morning only" variant)

**Price Model**: Fixed monthly fee  
**Cancellation/Refund Policy**:
- Before activation: 100% refund
- Within first 7 days + <3 uses: 70% refund
- After 7 days: No refund, but can transfer to another child (family member)
- Auto-renewal can be disabled anytime

---

### 2) شهري – دخول غير محدود (منطقة الرمل)
**Plan Name**: Monthly Unlimited - Sand Area  
**Applies To**: Single child  
**Included Areas**: Sand Area only  
**Limits**:
- Daily: Unlimited entries (max 1 active session)
- Session Duration: Max 2 hours per visit
- Special Rule: Child must wear socks (enforced at check-in, staff validation)

**Validity**: 30 days + 3 day grace  
**Allowed Days/Times**: All days, operating hours  
**Price Model**: Fixed monthly fee (lower than playground)  
**Cancellation/Refund Policy**: Same as plan #1

---

### 3) شهري – حضانة (نصف يوم)
**Plan Name**: Monthly Day Care - Half Day  
**Applies To**: Single child (age 2-5 years)  
**Included Areas**: Day Care section + Playground access during care hours  
**Limits**:
- Daily: 1 shift per day (morning OR evening, not both)
- Weekly: 6 days max (Sunday - Friday)
- Monthly: 24 sessions per 30 days
- Shift Duration: 4 hours
  - Morning: 8 AM - 12 PM
  - Evening: 2 PM - 6 PM

**Validity**: 30 days + 5 day grace (for day care plans)  
**Allowed Days/Times**:
- Sunday - Friday (Saturday excluded)
- Must check-in within first 30 min of shift start
- Late arrival (>30 min): Session still consumed

**Price Model**: Monthly fee (higher tier)  
**Includes**: Meals/snacks (tracked separately in inventory)  
**Cancellation/Refund Policy**:
- Before activation: 100% refund
- Within first 3 days: 80% refund
- After 3 days: No refund (pro-rated credit for remaining days if emergency)

---

### 4) شهري – حضانة (يوم كامل)
**Plan Name**: Monthly Day Care - Full Day  
**Applies To**: Single child (age 2-5 years)  
**Included Areas**: Day Care + Playground  
**Limits**:
- Daily: 1 full day (8 AM - 6 PM, 10 hours)
- Weekly: 6 days max (Sunday - Friday)
- Monthly: 24 sessions per 30 days

**Validity**: 30 days + 5 day grace  
**Allowed Days/Times**: Sunday - Friday, 8 AM - 6 PM  
**Price Model**: Premium monthly fee  
**Includes**: Meals (breakfast, lunch, snacks)  
**Cancellation/Refund Policy**: Same as half-day plan

---

### 5) باقة زيارات – المنطقة الداخلية (12 زيارة)
**Plan Name**: Visit Pack - Indoor Playground (12 Visits)  
**Applies To**: Single child  
**Included Areas**: Indoor Playground only  
**Limits**:
- Total: 12 visits (countdown per check-in)
- Daily: Unlimited use of visits (can use 2 visits in 1 day if check-out and re-enter)
- Session Duration: Max 3 hours per visit
- No daily/weekly limits (only total visit count)

**Validity**:
- Start: Date of purchase
- End: 90 days from purchase (expires even if visits remain)
- Grace Period: None (hard cut-off at 90 days)

**Allowed Days/Times**: All days, operating hours  
**Price Model**: Upfront payment for 12 visits (discounted vs single bookings)  
**Cancellation/Refund Policy**:
- Before first use: 90% refund (10% admin fee)
- After first use: Refund = (remaining_visits / 12) × purchase_price × 0.8 (20% penalty)
- Cannot transfer visits to another child (tied to registered child)

**Variants**:
- 8 visits / 60 days
- 20 visits / 120 days
- 30 visits / 180 days (best value)

---

### 6) باقة زيارات – منطقة الرمل (12 زيارة)
**Plan Name**: Visit Pack - Sand Area (12 Visits)  
**Applies To**: Single child  
**Included Areas**: Sand Area only  
**Limits**:
- Total: 12 visits
- Session Duration: Max 2 hours per visit
- Special Rule: Socks required

**Validity**: 90 days + no grace  
**Allowed Days/Times**: All days, operating hours  
**Price Model**: Upfront (lower price than playground pack)  
**Cancellation/Refund Policy**: Same as playground visit pack

---

### 7) باقة عائلية (شهري – دخول غير محدود لـ 3 أطفال)
**Plan Name**: Family Plan - Unlimited for 3 Children  
**Applies To**: Up to 3 children (must be registered, age verified)  
**Included Areas**: Indoor Playground + Sand Area (both areas, any child, any time)  
**Limits**:
- Per Child Daily: Unlimited entries (max 1 active session per child)
- Per Family Daily: Max 2 concurrent active sessions (e.g., 2 children can be inside simultaneously)
- Session Duration: Max 3 hours per visit
- Area Switching: Child can use both Indoor and Sand on same day (counts as 1 session if no check-out in between)

**Validity**: 30 days + 3 day grace  
**Allowed Days/Times**: All days, operating hours  
**Price Model**: Premium family fee (discount vs 3 individual plans)  

**Special Rules**:
- Must register all 3 children upfront (names, ages, photos)
- Can modify child list max 2 times per month (e.g., swap sibling)
- Each child gets unique QR code (linked to family subscription)
- Cannot share QR across children (device checks child photo at check-in if fraud suspected)

**Cancellation/Refund Policy**:
- Before activation: 100% refund
- Within first 7 days + <5 total family visits: 70% refund
- After 7 days: No refund

**Variants**:
- Family 2 (2 children)
- Family 4 (4 children)
- Family 5+ (custom pricing)

---

### Additional Plan Features (Optional)

#### Peak/Off-Peak Variants
- **شهري – ساعات خارج الذروة** (Monthly Off-Peak Hours):
  - Valid only: Sunday - Thursday, 9 AM - 4 PM
  - Discounted price (30% less)
  - All other rules same as unlimited plan

#### Add-Ons (للإضافات)
- **وجبات إضافية** (Extra Meals for Day Care): +20% monthly fee
- **تأمين شامل** (Comprehensive Insurance): +10% fee, covers injuries/damages
- **حصص خاصة** (Private Sessions): 2 sessions/month with instructor

---

## B) SUBSCRIPTION STATE MACHINE (ENGLISH)

### States
1. **draft**: Plan selected, not yet paid
2. **pending_payment**: Payment initiated, awaiting confirmation
3. **active**: Paid, can be used for check-ins
4. **paused**: Temporarily frozen by user (paused days don't count toward expiry)
5. **expired**: Validity period ended
6. **cancelled**: User or admin cancelled before expiry
7. **refunded**: Payment reversed, subscription voided

---

### State Transitions

#### 1) draft → pending_payment
**Trigger**: User clicks "ادفع الآن" (Pay Now) button  
**Validations**:
- Child profile completed (name, age, photo)
- Plan selected
- No active subscription for same child + same area (unless upgrade)
- Terms accepted

**Side Effects**:
- Create payment_intent with gateway
- Lock draft for 10 minutes
- Log: subscription_created

**Failure → Revert**: Stay in draft, show error

---

#### 2) pending_payment → active
**Trigger**: Payment webhook success  
**Validations**:
- payment_intent_id matches
- Amount matches plan price
- Subscription still in pending_payment state (idempotency)

**Side Effects**:
- Set start_date = now (or scheduled_start_date if future subscription)
- Set end_date = start_date + plan_duration
- Generate subscription_token (UUID)
- Generate QR code(s) for child/children
- Set status = active
- Create entitlement records (visit count if applicable)
- Send confirmation (WhatsApp + SMS + Email):
  - "تم تفعيل اشتراكك! رمز الاشتراك: SUB12345"
  - "صالح حتى: [end_date]"
  - Attach QR code image
- Log: subscription_activated
- Trigger auto-renewal setup (if opted in)

**Failure**: Log error, manual reconciliation required

---

#### 3) active → paused
**Trigger**: User clicks "إيقاف مؤقت" (Pause) OR admin action  
**Validations**:
- Subscription is active
- Not already paused
- Pause feature allowed for this plan (day care plans may restrict)
- Max 2 pauses per subscription lifetime
- Min pause duration: 7 days, Max: 30 days
- Must have at least 10 days remaining validity

**Side Effects**:
- Set paused_at = now
- Set pause_duration = user_selected_days
- Set resume_date = paused_at + pause_duration
- Extend end_date by pause_duration (validity frozen)
- Set status = paused
- Block check-ins (QR returns "الاشتراك متوقف مؤقتًا")
- Send notification: "تم إيقاف اشتراكك مؤقتًا حتى [resume_date]"
- Log: subscription_paused (reason: user_request / admin / other)

**Auto-Resume**: Cron job checks resume_date, changes back to active

---

#### 4) paused → active
**Trigger**: resume_date reached (auto) OR user clicks "استئناف" (Resume) early  
**Validations**:
- Subscription in paused state
- If manual resume: must be at least 7 days since pause

**Side Effects**:
- Calculate actual_pause_duration = now - paused_at
- Adjust end_date if resumed early (reclaim unused pause days)
- Set status = active
- Send notification: "تم استئناف اشتراكك!"
- Log: subscription_resumed

---

#### 5) active → expired
**Trigger**: end_date reached + grace_period passed (auto via cron job)  
**Validations**: None (automatic)  
**Side Effects**:
- Set status = expired
- Set expired_at = now
- Block check-ins (QR returns "انتهت صلاحية الاشتراك")
- Send notification: "انتهى اشتراكك. جدّد الآن واحصل على خصم 10%!" (renewal offer)
- Log: subscription_expired
- If auto-renewal enabled: trigger renewal payment
  - If payment succeeds: create new subscription (linked to old one)
  - If payment fails: send "فشل التجديد التلقائي، يرجى التحديث يدويًا"

---

#### 6) active/paused → cancelled
**Trigger**: User clicks "إلغاء الاشتراك" (Cancel) OR admin cancels  
**Validations**:
- Confirm cancellation reason (user must select from dropdown)
- If refund eligible: admin approval required

**Side Effects**:
- Set status = cancelled
- Set cancelled_at = now
- Set cancelled_by = user_id or admin_id
- Set cancellation_reason
- Calculate refund_amount (if applicable per policy)
- If refund > 0: initiate refund via payment gateway
- Block check-ins immediately
- Send notification: "تم إلغاء اشتراكك. سيتم رد المبلغ خلال 7-10 أيام." (if refund)
- Log: subscription_cancelled
- If mid-cycle: remaining days/visits forfeited (unless refund policy allows credit)

---

#### 7) cancelled → refunded
**Trigger**: Refund processed successfully (payment gateway webhook)  
**Validations**:
- Refund transaction_id matches
- Subscription in cancelled state

**Side Effects**:
- Set status = refunded
- Set refunded_at = now
- Set refund_amount (actual)
- Send notification: "تم رد المبلغ بنجاح: [amount] ريال"
- Log: subscription_refunded

---

#### 8) active → active (renewal)
**Trigger**: User clicks "تجديد" (Renew) before expiry OR auto-renewal  
**Validations**:
- Current subscription active or in grace period
- Payment method valid

**Process**:
- Create new subscription (copy of current plan)
- Set new start_date = old end_date + 1 day
- Process payment
- Link old_subscription_id (for history)
- If old subscription had unused visits: option to transfer or forfeit
- Continuity: If renewed within grace period, no gap in service

---

## C) CONSUMPTION & ENTITLEMENTS LOGIC (ENGLISH)

### 1) When Visit is Consumed

#### For Unlimited Monthly Plans
- **Visit Consumption Point**: At **check-in** (not check-out)
- **Reason**: Prevent "check-in without check-out" abuse
- **Daily Visit Tracking**: Increment daily_visit_count at check-in
- **Session Tracking**: Create session record with check_in_time
- **Note**: Unlimited plans don't decrement a counter, but track usage for analytics

#### For Visit Pack Plans
- **Visit Consumption Point**: At **check-in** (immediately)
- **Action**: Decrement remaining_visits by 1
- **Validation Before Check-In**:
  - remaining_visits > 0
  - Subscription not expired (end_date > now)
- **If remaining_visits = 0**: Block check-in, prompt to purchase new pack

#### For Day Care Plans
- **Attendance Consumption Point**: At **check-in** within shift start window
- **Action**: Decrement remaining_sessions (if count-based, e.g., 24 sessions/month)
- **Late Check-In**: If checked in >30 min late, session still consumed, but parent notified
- **Early Check-Out**: Session still consumed (no refund for partial day)

---

### 2) Check-In Without Check-Out Handling

#### Scenario: User checks in but never checks out

**Detection**:
- End-of-day cron job (10 PM) finds all sessions with check_in_time but no check_out_time

**Action**:
- Set check_out_time = scheduled_session_end OR operating_hours_end (whichever earlier)
- Set session status = 'auto_closed'
- Consumption already happened at check-in, so no change to visit count
- Log discrepancy for manual review (potential fraud or device malfunction)

**Day Care Special Case**:
- If Day Care check-in but no check-out by shift end + 1 hour:
  - Auto check-out
  - Send alert to parent + admin (child safety issue)
  - Log: "Parent did not pick up child on time"

---

### 3) Daily Limit Algorithm

#### For Unlimited Plans
**Per Child**:
- Max 1 **concurrent** active session (cannot check in while already checked in)
- Max 5 **separate** check-ins per day (prevent excessive in-out abuse)
- Each session max 3 hours (enforced at check-in: scheduled_end = check_in + 3 hours)

**Implementation**:
```
At check-in:
1. Count sessions for (child_id, area, today) where check_out_time IS NOT NULL → if >= 5: reject
2. Find session for (child_id, area) where check_in_time IS NOT NULL AND check_out_time IS NULL → if exists: reject "already checked in"
3. If both pass: allow check-in
```

#### For Visit Pack Plans
**No daily limit on visit usage** (user can burn multiple visits per day if they want), BUT:
- Still enforce max 1 concurrent session (same as unlimited)
- Each check-in consumes 1 visit

#### For Family Plans
**Per Child**: Same as individual (max 1 concurrent, max 5 per day)  
**Per Family**: Max 2 concurrent sessions across all children
```
At check-in for child_X:
1. Check child_X individual limits (pass)
2. Count active sessions for family (all children) → if >= 2: reject "العائلة وصلت للحد الأقصى للجلسات المتزامنة"
3. If passes: allow check-in
```

#### For Day Care Plans
**Per Child**: Max 1 shift per day (morning OR evening, not both)
```
At check-in:
1. Check if child already checked in for a shift today → if yes: reject "تم تسجيل الحضور لهذا اليوم"
2. Check shift type matches plan (half-day: one shift, full-day: allows morning→evening continuation)
3. If full-day plan: allow check-in for morning, auto-extend to evening (no separate check-in needed)
```

---

### 4) Prevent Double Consumption

**Problem**: User scans QR twice accidentally or maliciously within seconds

**Solution - Database Transaction Lock**:
```
BEGIN TRANSACTION
1. SELECT * FROM sessions WHERE child_id = X AND area = Y AND check_in_time IS NOT NULL AND check_out_time IS NULL FOR UPDATE
2. If row exists → ROLLBACK, return "already checked in"
3. Else → INSERT new session, decrement visit count (if applicable), COMMIT
END TRANSACTION
```

**Idempotency Key**: Use (subscription_id + child_id + area + date + device_id + timestamp_rounded_to_minute)
- If duplicate scan within same minute from same device: ignore, return success (idempotent)

---

### 5) Capacity vs Subscription Interaction

**Model**: **Subscriptions DO NOT reserve slots** (different from hourly bookings)

**Check-In Logic**:
1. **Validate Subscription**: Active, has visits/entitlement, within limits
2. **Check Real-Time Capacity**: Query current active sessions for area
   - If capacity full (e.g., 30 children in playground):
     - Reject check-in: "المنطقة ممتلئة حاليًا، يرجى الانتظار"
     - Offer: Join virtual queue (get SMS when space available)
   - If capacity available:
     - Allow check-in, increment active_count

**Priority System** (optional):
- Platinum members: Check-in even if at 100% capacity (reserved 5% buffer)
- Gold members: Priority queue
- Regular: Standard queue

**No Pre-Booking**: Subscriptions are walk-in only (first-come, first-served)
- Exception: Day Care has guaranteed slot (capacity allocated per enrolled child)

---

### 6) Using Subscription for Multiple Areas in One Day

#### Scenario: Child has Family Plan (includes Indoor + Sand), wants to use both

**Rule**: Each area requires separate check-in/check-out

**Example Flow**:
- 10:00 AM: Check in to Indoor Playground (session A starts)
- 11:30 AM: Check out from Indoor Playground (session A ends)
- 11:35 AM: Check in to Sand Area (session B starts)
- 1:00 PM: Check out from Sand Area (session B ends)

**Visit Counting**:
- Unlimited plan: Counts as 2 visits for analytics (no consumption limit)
- Visit pack (if multi-area): Check plan config:
  - Option A: Each area check-in consumes 1 visit (2 visits consumed today)
  - Option B: First check-in per day consumes 1 visit (1 visit consumed, area switch free)
  - **Recommended**: Option A (simpler, fairer)

**Cannot Be In Two Areas Simultaneously**:
- If checked into Indoor, attempting to check into Sand → reject "يجب تسجيل الخروج من المنطقة الداخلية أولاً"

---

### 7) Day Care Attendance Counting

#### Half-Day Plan (Morning or Evening)
- **Check-In Window**: 30 minutes from shift start
  - Morning shift (8 AM): Can check in 8:00 - 8:30 AM
  - Evening shift (2 PM): Can check in 2:00 - 2:30 PM
- **Late Check-In**: After window but before shift end → Allowed, but session still consumed + parent notified
- **No Check-In**: After shift end → Session forfeited (counts as absent, no consumption if count-based)

**Consumption**: 1 session consumed per check-in (from monthly quota, e.g., 24 sessions)

#### Full-Day Plan (8 AM - 6 PM)
- **Single Check-In**: At morning (8:00 - 8:30 AM)
- **No Separate Evening Check-In**: Session continues until parent picks up (by 6 PM)
- **Lunch/Break**: Child remains in facility, no check-out
- **Consumption**: 1 full day consumed

**Attendance Report**: Auto-generated daily, sent to parent via WhatsApp at shift end
- "حضر [child_name] اليوم من [check_in_time] إلى [check_out_time]"
- Include activities, meals, nap times (if tracked)

---

## D) DEVICE QR ACTIVATION RULES (ENGLISH + ARABIC MESSAGES)

### 1) QR Token Strategy

**Approach**: **Rotating Short-Lived Token** (most secure)

#### Token Generation (at subscription activation)
```
QR Code Data Structure (JSON → Base64 → QR Image):
{
  "subscription_id": "uuid",
  "child_id": "uuid",
  "child_name": "أحمد محمد",
  "plan_type": "unlimited_playground",
  "token": "abc123xyz789",  // Rotating token (changes every 5 minutes)
  "valid_until": "2026-01-15T14:05:00Z",  // Token expiry (5 min window)
  "checksum": "sha256_hash",
  "issued_at": "2026-01-15T14:00:00Z"
}
```

**Token Rotation**:
- Backend generates new token every 5 minutes
- App fetches fresh QR every 5 minutes (when opened)
- Old tokens valid for 10 minutes (overlap window to prevent rejection during transition)

**Checksum**:
- SHA256(subscription_id + child_id + token + secret_key) → first 16 chars
- Prevents QR screenshot tampering

#### Alternative (Simpler): **Static QR with Backend Validation**
- QR contains only: subscription_id + child_id + checksum
- No token rotation
- Backend checks subscription status real-time at scan
- Less secure (screenshot reuse possible), but easier to implement
- **Mitigation**: Device fingerprinting + rate limiting

**Recommended**: Rotating token for fraud prevention

---

### 2) Check-In Validations

#### Device Scans QR → Backend Validates

**Step-by-Step Validation**:

1. **Decode & Verify Checksum**:
   - Decode Base64 → Parse JSON
   - Recalculate checksum → compare with QR checksum
   - If mismatch → **REJECT**: "رمز QR غير صالح"

2. **Token Expiry Check**:
   - If valid_until < now → **REJECT**: "انتهت صلاحية الرمز، يرجى تحديث التطبيق"

3. **Subscription Status**:
   - Query subscription by subscription_id
   - If status != 'active' → **REJECT** with specific message:
     - 'paused' → "الاشتراك متوقف مؤقتًا، يرجى استئنافه من التطبيق"
     - 'expired' → "انتهت صلاحية الاشتراك، جدّد الآن!"
     - 'cancelled' → "الاشتراك ملغى، يرجى مراجعة الاستقبال"

4. **Date Validity**:
   - If now < subscription.start_date → **REJECT**: "الاشتراك لم يبدأ بعد، تاريخ البدء: [start_date]"
   - If now > subscription.end_date + grace_period → **REJECT**: "انتهت صلاحية الاشتراك"

5. **Area Eligibility**:
   - Check if plan allows access to scanned area (device knows its area: playground / sand / daycare)
   - If not included → **REJECT**: "هذا الاشتراك غير صالح لمنطقة [area_name]"

6. **Child Eligibility** (for family plans):
   - Verify child_id is linked to subscription
   - If not found → **REJECT**: "الطفل غير مسجل في هذا الاشتراك"

7. **Visit/Entitlement Check**:
   - For visit packs: Check remaining_visits > 0
     - If 0 → **REJECT**: "لا يوجد زيارات متبقية، اشتر باقة جديدة"
   - For unlimited: Check daily limit not exceeded (max 5 check-ins today)
     - If exceeded → **REJECT**: "تم استخدام الحد الأقصى اليومي"

8. **Already Checked In Check**:
   - Query sessions: child_id + area + check_in_time NOT NULL + check_out_time NULL
   - If exists → **REJECT**: "تم تسجيل الدخول مسبقاً في [area_name]"

9. **Time Window Check** (for Day Care):
   - If shift check-in window passed (>30 min late):
     - Allow but warn: "تأخرت عن موعد الحضور، يرجى الالتزام بالمواعيد"
     - Log late_arrival
   - If outside operating hours:
     - **REJECT**: "غير مسموح الدخول في هذا الوقت، ساعات العمل: [hours]"

10. **Capacity Check**:
    - Query real-time active sessions for area
    - If count >= capacity_limit:
      - Check if child has priority (platinum member):
        - If yes: Allow (reserved buffer)
        - If no: **REJECT**: "المنطقة ممتلئة حاليًا، يرجى الانتظار"
          - Offer: "انضم لقائمة الانتظار"

11. **Fraud Detection** (rate limiting):
    - Check if same subscription_id scanned from different device_id in last 10 minutes
      - If yes: Flag suspicious, send alert to admin
      - Allow first scan, block second: "تم رصد نشاط مشبوه، يرجى مراجعة الاستقبال"

**If ALL Validations Pass**:
- **Insert session record**:
  - session_id (UUID)
  - subscription_id
  - child_id
  - area
  - check_in_time = now
  - device_id (kiosk/gate ID)
  - scheduled_end = check_in_time + plan_max_duration (e.g., +3 hours)
- **Decrement visit count** (if visit pack)
- **Increment daily check-in counter**
- **Increment active capacity counter for area**
- **Log audit entry**: check_in_success
- **Return SUCCESS** → Device shows: "✅ مرحباً [child_name]! استمتع بوقتك 😊"
- **Send notification to parent** (optional): "تم تسجيل دخول [child_name] الساعة [time]"

---

### 3) Check-Out Validations

#### Device Scans QR at Exit → Backend Validates

**Validation Steps**:

1. **Decode & Verify Checksum** (same as check-in)

2. **Find Active Session**:
   - Query: child_id + area + check_in_time NOT NULL + check_out_time NULL
   - If not found → **REJECT**: "لا يوجد تسجيل دخول نشط"

3. **Set Check-Out Time**:
   - check_out_time = now
   - actual_duration = check_out_time - check_in_time

4. **Overstay Check** (if applicable, mainly for hourly bookings linked to subscription):
   - For unlimited subscriptions: No overstay billing (session duration controlled by max_session_duration, soft limit)
   - For visit packs: No overstay billing
   - **Exception**: If subscription + hourly booking hybrid:
     - If actual_duration > scheduled_duration + grace (10 min):
       - Calculate overstay_charge
       - Create invoice, notify parent

5. **Update Capacity**:
   - Decrement active capacity counter for area

6. **Log Audit Entry**: check_out_success

7. **Return SUCCESS** → Device shows: "تم تسجيل الخروج بنجاح! نراك قريباً 👋"

8. **Send Notification to Parent**:
   - "تم تسجيل خروج [child_name] الساعة [time]"
   - "مدة الزيارة: [duration]"
   - If visit pack: "الزيارات المتبقية: [remaining_visits]"

---

### 4) Offline Device Behavior

#### Scenario: Check-in device loses internet connection

**Offline Mode (Limited)**:

1. **Device Cached Data** (synced every 30 min when online):
   - List of active subscriptions for today (subscription_id, child_id, plan_type, status)
   - Daily check-in records (to prevent double check-in)

2. **Offline Check-In**:
   - Scan QR → Validate against cached data (basic checks only):
     - Subscription exists in cache
     - Not already checked in today (per cache)
   - If passes:
     - Store check-in locally: (subscription_id, child_id, area, timestamp, device_id, status='offline')
     - Show: "✅ تم التسجيل (وضع عدم الاتصال)"
     - Warning: "سيتم التأكيد عند عودة الاتصال"

3. **When Network Restored**:
   - Device auto-syncs offline check-ins to server (batch upload)
   - Server validates each offline check-in (full validation):
     - If valid: Confirm, update database
     - If invalid (e.g., subscription was cancelled during offline period):
       - Mark session as 'invalid_offline'
       - Send alert to admin + parent: "تسجيل دخول غير صالح تم رصده، يرجى مراجعة الاستقبال"

4. **Conflict Resolution**:
   - If same child checked in via different device (one offline, one online) at similar times:
     - Server timestamp wins
     - Mark duplicate as 'conflict'
     - Admin reviews manually

**Recommendation**: Keep offline mode limited to 1-hour max offline window, then device locks and requires manual intervention

---

### ARABIC ERROR MESSAGES (UI-Ready)

| Scenario | Arabic Message |
|----------|----------------|
| Success Check-In | ✅ مرحباً [child_name]! استمتع بوقتك 😊 |
| Success Check-Out | ✅ تم تسجيل الخروج بنجاح! نراك قريباً 👋 |
| Invalid QR | ❌ رمز QR غير صالح، يرجى التأكد من الرمز |
| Token Expired | ⚠️ انتهت صلاحية الرمز، يرجى تحديث التطبيق |
| Subscription Inactive | ❌ الاشتراك غير فعال حالياً |
| Subscription Expired | ⏰ انتهت صلاحية الاشتراك، جدّد الآن واحصل على خصم 10%! |
| Subscription Paused | ⏸️ الاشتراك متوقف مؤقتًا حتى [resume_date] |
| No Visits Remaining | 🎫 لا يوجد زيارات متبقية! اشتر باقة جديدة الآن |
| Daily Limit Exceeded | 🚫 تم استخدام الحد الأقصى اليومي (5 زيارات) |
| Already Checked In | ⚠️ تم تسجيل الدخول مسبقاً في [area_name] |
| Not Allowed in This Area | ❌ هذا الاشتراك غير صالح لـ [area_name] |
| Outside Operating Hours | 🕐 غير مسموح الدخول في هذا الوقت، ساعات العمل: [hours] |
| Capacity Full | 🏟️ المنطقة ممتلئة حاليًا، يرجى الانتظار أو الانضمام لقائمة الانتظار |
| Late Arrival Warning | ⚠️ تأخرت عن موعد الحضور، يرجى الالتزام بالمواعيد المحددة |
| Contact Reception | 📞 يرجى مراجعة الاستقبال لمزيد من المساعدة |
| Suspicious Activity | 🚨 تم رصد نشاط مشبوه، يرجى مراجعة الاستقبال فوراً |
| Offline Mode | 📡 تم التسجيل (وضع عدم الاتصال)، سيتم التأكيد عند عودة الاتصال |
| Child Not Registered | ❌ الطفل غير مسجل في هذا الاشتراك، يرجى تحديث بيانات العائلة |

---

## E) SCREENS/SECTIONS + BUTTON LOGIC (ARABIC UI)

### 1) شاشة الاشتراكات (Subscriptions Screen)

**Purpose**: View all subscriptions (active, paused, expired)

**Tabs**:
- الاشتراكات النشطة (Active)
- المتوقفة مؤقتاً (Paused)
- المنتهية (Expired)

**For Each Subscription Card**:
- **Display**:
  - اسم الباقة (Plan name)
  - اسم الطفل (Child name)
  - صالح حتى (Valid until: [end_date])
  - الزيارات المتبقية (Remaining visits - if visit pack)
  - حالة الاشتراك (Status badge: نشط / متوقف / منتهي)
- **Buttons**:
  - عرض التفاصيل (View Details) → API: GET /api/subscriptions/{id}
  - عرض رمز QR (Show QR Code) → Navigate to QR screen
  - تجديد (Renew - if expired/near expiry) → Navigate to purchase screen with same plan pre-selected

**Empty State** (no subscriptions):
- "ليس لديك اشتراكات حالياً"
- اشتر الآن (Buy Now) button → Navigate to purchase screen

**API Calls**:
- On Load: GET /api/subscriptions?user_id={current_user}&status=active,paused,expired
- Response: List of subscription objects

---

### 2) تفاصيل الاشتراك (Subscription Details Screen)

**Display Sections**:

**معلومات الباقة (Plan Info)**:
- اسم الباقة
- نوع الباقة (شهري / زيارات / حضانة)
- المناطق المشمولة (Areas included)
- السعر المدفوع (Paid amount)

**معلومات الصلاحية (Validity Info)**:
- تاريخ البدء (Start date)
- تاريخ الانتهاء (End date)
- الأيام المتبقية (Days remaining)
- حالة الاشتراك (Status)

**الاستخدام (Usage Stats)**:
- الزيارات المستخدمة (Visits used - if visit pack)
- الزيارات المتبقية (Visits remaining)
- آخر زيارة (Last visit date/time)
- عدد الزيارات هذا الأسبوع (Visits this week)

**الأطفال المرتبطون (Linked Children)** (if family plan):
- List of child names + photos
- تعديل (Edit) button → Navigate to manage children screen

**Buttons**:
- عرض رمز QR (Show QR Code) → Navigate to QR screen
- إيقاف مؤقت (Pause) → Show pause modal
- تجديد (Renew) → Navigate to purchase screen
- ترقية الباقة (Upgrade) → Navigate to upgrade flow
- إلغاء الاشتراك (Cancel) → Show cancellation modal
- سجل الزيارات (Visit History) → Navigate to history screen

**API Calls**:
- On Load: GET /api/subscriptions/{id}/details
- Show QR: GET /api/subscriptions/{id}/qr → Returns fresh QR image URL

---

### 3) شراء اشتراك (Purchase Subscription Screen)

**Step 1: اختيار الباقة (Choose Plan)**

**Categories (Tabs)**:
- المنطقة الداخلية (Indoor Playground)
- منطقة الرمل (Sand Area)
- الحضانة (Day Care)
- العائلية (Family Plans)

**For Each Plan Card**:
- **Display**:
  - اسم الباقة (Arabic plan name)
  - السعر شهرياً (Price/month OR per pack)
  - الميزات (Features bullet list)
  - شارة "الأكثر شعبية" (Most Popular badge - if applicable)
  - وفّر X% (Save X% badge)
- **Button**: اختر هذه الباقة (Select This Plan)

**On Select**:
- API: POST /api/subscriptions/draft
- Body: {plan_id, user_id}
- Response: {draft_subscription_id}
- Navigate to Step 2

---

**Step 2: اختيار الطفل (Select Child)**

**Display**:
- قائمة الأطفال المسجلين (List of registered children)
- Each child card: Name, Age, Photo
- Radio button to select

**Buttons**:
- إضافة طفل جديد (Add New Child) → Show modal to add child (name, age, photo upload)
- التالي (Next)

**On Next**:
- API: PATCH /api/subscriptions/draft/{id}
- Body: {child_id}
- Navigate to Step 3

---

**Step 3: تأكيد وشراء (Confirm & Pay)**

**Display**:
- ملخص الطلب (Order Summary):
  - اسم الباقة
  - اسم الطفل
  - تاريخ البدء (Start date - today or scheduled)
  - تاريخ الانتهاء (End date)
  - المبلغ الإجمالي (Total amount)
  - الضريبة (Tax breakdown)

**Fields**:
- تاريخ البدء (Start Date picker - default: today, max: +30 days future)
- رمز الخصم (Coupon code - optional) → زر: تطبيق (Apply button)
  - API: POST /api/coupons/validate
  - Body: {coupon_code, plan_id}
  - If valid: Update total, show discount badge

**Checkboxes**:
- ☑️ أوافق على الشروط والأحكام (Accept terms - required)
- ☐ تجديد تلقائي (Auto-renewal - optional)

**Button**: ادفع الآن (Pay Now)

**On Pay Now**:
- Validate terms accepted
- API: POST /api/subscriptions/{draft_id}/checkout
- Response: {payment_url, payment_intent_id}
- Redirect to payment gateway
- After payment success → Redirect back with success
- API webhook updates subscription to 'active'
- Show success screen: "✅ تم تفعيل اشتراكك بنجاح!"
- Button: عرض رمز QR (View QR Code)

---

### 4) إدارة الأطفال المرتبطين (Manage Linked Children Screen)

**Purpose**: Edit children linked to family plan

**Display**:
- List of currently linked children (name, age, photo)
- Max children indicator: "2 من 3" (2 of 3 filled)

**For Each Child Row**:
- **Buttons**:
  - تعديل (Edit) → Show edit modal (change name, age, photo)
  - إزالة (Remove) → Confirm modal → API: DELETE /api/subscriptions/{id}/children/{child_id}

**Buttons**:
- إضافة طفل (Add Child - if slots available) → Show add child modal
- حفظ التغييرات (Save Changes)

**Constraints**:
- Max 2 changes per month (display counter: "التعديلات المتبقية: 1/2")
- Cannot remove all children (min 1)

**API Calls**:
- On Load: GET /api/subscriptions/{id}/children
- Add Child: POST /api/subscriptions/{id}/children → Body: {child_id}
- Remove Child: DELETE /api/subscriptions/{id}/children/{child_id}

**Success Message**: "✅ تم تحديث الأطفال المرتبطين بنجاح"

---

### 5) تجميد/إيقاف مؤقت (Pause Subscription Screen)

**Display**:
- شرح الميزة (Feature explanation):
  - "يمكنك إيقاف اشتراكك مؤقتاً لمدة 7-30 يوماً"
  - "سيتم تمديد صلاحية الاشتراك بعدد أيام الإيقاف"
- الإيقافات المتبقية (Pauses remaining: 2/2 - max 2 per subscription)

**Fields**:
- عدد الأيام (Number of days - slider or input: 7-30)
- سبب الإيقاف (Reason - dropdown):
  - سفر (Travel)
  - مرض (Illness)
  - أخرى (Other)

**Button**: تأكيد الإيقاف (Confirm Pause)

**On Confirm**:
- API: POST /api/subscriptions/{id}/pause
- Body: {pause_days, reason}
- Response: {new_end_date, resume_date}
- Show success: "✅ تم إيقاف الاشتراك مؤقتاً حتى [resume_date]"
- Send notification (WhatsApp/SMS)

**Error Handling**:
- If max pauses reached: "❌ لقد استخدمت الحد الأقصى للإيقافات المؤقتة"
- If <10 days remaining: "❌ لا يمكن إيقاف الاشتراك، صلاحيته قاربت على الانتهاء"

---

### 6) تجديد الاشتراك (Renew Subscription Screen)

**Display**:
- معلومات الاشتراك الحالي (Current subscription info)
- تاريخ الانتهاء (Current end date)
- باقة التجديد (Renewal plan - same as current, pre-selected)
- عرض خاص (Special offer badge: "خصم 10% على التجديد المبكر!")

**Options**:
- ☐ تجديد بنفس الباقة (Renew with same plan - checked by default)
- ☐ الترقية إلى باقة أفضل (Upgrade to better plan - show upgrade options)

**Fields**:
- تاريخ البدء (Start date - auto: day after current expiry OR today if expired)
- رمز الخصم (Coupon code)

**Display**:
- المبلغ الإجمالي (Total amount with renewal discount)

**Button**: تجديد الآن (Renew Now)

**On Renew**:
- API: POST /api/subscriptions/{id}/renew
- Body: {start_date, coupon_code, auto_renew}
- Process payment (same flow as purchase)
- Success: "✅ تم تجديد اشتراكك بنجاح! صالح حتى [new_end_date]"

---

### 7) ترقية/تغيير باقة (Upgrade/Change Plan Screen)

**Display**:
- الباقة الحالية (Current plan card)
- الباقات المتاحة للترقية (Available upgrade plans - only higher tier)
- Comparison table (side-by-side):
  - الميزات (Features)
  - السعر (Price difference)
  - الفرق المستحق (Pro-rated amount due)

**For Each Upgrade Option**:
- **Button**: ترقية إلى هذه الباقة (Upgrade to This Plan)

**On Select**:
- Show confirmation modal:
  - "سيتم تطبيق الترقية فوراً"
  - "المبلغ المستحق: [amount] ريال" (pro-rated difference)
  - "الزيارات المتبقية: سيتم تحويلها" (if visit pack)
- **Buttons**:
  - تأكيد الترقية (Confirm Upgrade)
  - إلغاء (Cancel)

**On Confirm**:
- API: POST /api/subscriptions/{id}/upgrade
- Body: {new_plan_id, proration: 'immediate'}
- Process payment for difference
- Update subscription plan_id + recalculate entitlements
- Success: "✅ تم ترقية اشتراكك بنجاح!"

**Downgrade Option** (if allowed):
- Show warning: "⚠️ سيتم تطبيق التغيير في بداية الشهر القادم"
- No immediate refund, change takes effect at next renewal

---

## F) UPGRADE / DOWNGRADE / PRORATION (ENGLISH)

### Upgrade (Immediate Application)

#### Scenario: User upgrades from 12-visit pack to unlimited monthly

**Timing**: Immediate (apply right away)

**Proration Calculation**:
```
Step 1: Calculate remaining value of current plan
- Current plan price: 600 SAR (12 visits)
- Visits used: 4
- Visits remaining: 8
- Days since purchase: 20
- Total validity: 90 days
- Remaining value = (8/12) × 600 × (70/90) = 311 SAR

Step 2: Calculate new plan price (for remaining period)
- New plan price: 800 SAR/month
- Days remaining in billing cycle: 70 days
- Pro-rated new plan cost = 800 × (70/30) = 1,867 SAR (if calculated daily)
OR use simplified: Full month price = 800 SAR

Step 3: Amount due = New plan cost - Remaining value
- Due = 800 - 311 = 489 SAR
```

**Process**:
1. User pays 489 SAR (upgrade fee)
2. Old subscription status → 'upgraded' (archived)
3. New subscription created:
   - start_date = now
   - end_date = old_end_date (inherit remaining period) OR now + 30 days (fresh month)
   - Recommended: Fresh month (simpler)
4. Transfer unused visits as credit/bonus (optional):
   - 8 remaining visits → convert to 2 bonus days on unlimited plan

**API**:
- POST /api/subscriptions/{id}/upgrade
- Body: {new_plan_id, proration_method: 'immediate'}
- Response: {amount_due, new_subscription_id}

---

### Downgrade (Next-Cycle Application)

#### Scenario: User downgrades from unlimited monthly to 12-visit pack

**Timing**: Next billing cycle (not immediate)

**Reason**: Prevent abuse (use unlimited for 29 days, then downgrade)

**Process**:
1. Mark subscription.pending_downgrade = true
2. Set subscription.next_plan_id = 12-visit pack
3. Current subscription continues until end_date
4. On end_date:
   - Current subscription → 'expired'
   - Auto-create new subscription with next_plan_id
   - Charge user for new plan (or skip if prepaid)
5. Notify user: "سيتم تطبيق التغيير إلى باقة الـ12 زيارة في [date]"

**No Refund**: User keeps current plan until natural expiry

**Cancellation of Downgrade**: User can cancel pending downgrade anytime before end_date

**API**:
- POST /api/subscriptions/{id}/downgrade
- Body: {new_plan_id, apply_at: 'next_cycle'}

---

### Plan Change (Same Tier, Different Area)

#### Scenario: User switches from "Unlimited Playground" to "Unlimited Sand"

**Options**:

**Option A: Immediate Swap (No Proration)**
- Cancel current, activate new (same price)
- Forfeit remaining days of current
- New plan starts fresh (30 days from now)
- Use case: User preference changed

**Option B: Immediate Swap (With Proration)**
- Calculate days remaining: 15 days
- New plan starts now, ends at old_end_date (preserve 15 days)
- No extra charge (same tier)

**Recommended**: Option B (fairer)

---

### Upgrade with Visit Transfer

#### Scenario: User has 12-visit pack with 8 visits left, upgrades to unlimited

**Transfer Logic**:
- Option A: Forfeit remaining visits (no compensation)
- Option B: Convert to monetary credit (8 visits × per-visit value = X SAR)
  - Apply credit to upgrade cost
- Option C: Give bonus days on unlimited plan (8 visits → 3 bonus days)

**Recommended**: Option B or C (customer-friendly)

**Implementation**:
- When upgrading, ask user: "لديك 8 زيارات متبقية، هل تريد تحويلها إلى رصيد؟"
  - نعم، حوّلها إلى رصيد (Yes, convert to credit)
  - لا، التخلي عنها (No, forfeit)

---

### Admin Override (Manual Adjustment)

**Use Cases**:
- Compensation for service issue
- VIP customer special request
- System error correction

**Process**:
- Admin accesses subscription in admin panel
- Button: "تعديل يدوي" (Manual Adjustment)
- Fields:
  - New plan
  - New end_date
  - Adjust visit count (+/- visits)
  - Adjustment reason (mandatory)
  - Waive payment (checkbox)
- Submit → Creates audit log entry
- Notify customer: "تم تعديل اشتراكك من قبل الإدارة: [reason]"

**API**:
- POST /api/admin/subscriptions/{id}/adjust
- Body: {new_plan_id, new_end_date, visit_adjustment, reason, admin_id}
- Requires admin role

---

## G) FRAUD PREVENTION + AUDIT LOGS (ENGLISH)

### Screenshot QR Reuse Prevention

#### Problem: User takes screenshot of QR, shares with another person

**Prevention Strategies**:

**1) Rotating Token (Primary)**
- QR token changes every 5 minutes
- Screenshot becomes invalid after 5-10 minutes
- Most effective

**2) Device Fingerprinting**
- Record device_id at check-in (kiosk/gate hardware ID)
- If same subscription_id attempts check-in from 2 different devices within short window (e.g., <10 min):
  - Flag as suspicious
  - Block second attempt: "🚨 تم رصد نشاط مشبوه"
  - Alert admin dashboard

**3) Check-In Location Validation**
- Each device has fixed location_id (playground_gate_1, sand_entrance, etc.)
- If subscription checks in at playground_gate_1 at 2:00 PM, then at sand_entrance at 2:02 PM:
  - Physically impossible (unless areas adjacent)
  - Flag if distance/timing impossible

**4) Photo Verification (Optional, High Security)**
- At check-in, device camera captures child photo
- Backend compares with registered child photo (facial recognition API)
- If mismatch: Alert staff, manual verification required
- Privacy consideration: Requires parent consent

**5) One-Time Check-In Code (Alternative)**
- Instead of static QR, app generates 6-digit numeric code (valid 2 minutes)
- User enters code at kiosk keypad
- Code consumed after use (cannot reuse screenshot)

**Recommended Combo**: Rotating token (1) + Device fingerprinting (2)

---

### Rate Limiting

**Per Subscription**:
- Max 10 QR scan attempts per hour (prevents brute force)
- Max 2 failed check-in attempts per 5 minutes
- If exceeded: Temporary lock (15 min cooldown)
- Notify user: "تم تجاوز عدد المحاولات، يرجى الانتظار 15 دقيقة"

**Per Device**:
- Max 100 check-ins per hour (prevents kiosk abuse)
- If exceeded: Alert admin (possible device malfunction or attack)

**Per User Account**:
- Max 5 active subscriptions per account (prevents reselling)
- Max 3 subscription purchases per day (fraud prevention)

---

### Device Binding (Optional)

**Concept**: Bind subscription to specific parent device (phone)

**Process**:
1. On first QR generation, record parent's device_fingerprint (OS, model, browser)
2. Subsequent QR requests must come from same device
3. If new device detected:
   - Send verification code to registered phone
   - Require code entry to approve new device
   - Log device change

**Use Case**: High-value subscriptions (annual, family plans)

---

### Audit Logs

**Log Every Action**:

**Subscription Events**:
- subscription_created (user_id, plan_id, timestamp)
- subscription_activated (subscription_id, payment_id, timestamp)
- subscription_paused (subscription_id, reason, paused_by, timestamp)
- subscription_resumed (subscription_id, timestamp)
- subscription_upgraded (old_plan_id, new_plan_id, amount_paid, timestamp)
- subscription_cancelled (reason, cancelled_by, timestamp)
- subscription_refunded (amount, reason, timestamp)

**Check-In/Out Events**:
- check_in_success (subscription_id, child_id, area, device_id, timestamp, visit_count_after)
- check_in_failed (subscription_id, reason, device_id, timestamp)
- check_out_success (subscription_id, child_id, duration, timestamp)
- check_out_auto_closed (subscription_id, timestamp)

**Fraud Detection Events**:
- suspicious_activity_detected (subscription_id, reason, device_id, timestamp)
- rate_limit_exceeded (subscription_id, device_id, timestamp)
- invalid_qr_attempt (subscription_id, checksum_mismatch, timestamp)

**Admin Actions**:
- admin_manual_adjustment (subscription_id, admin_id, change_description, before_state, after_state, reason, timestamp)
- admin_force_checkout (session_id, admin_id, reason, timestamp)
- admin_override_capacity (area, admin_id, reason, timestamp)

**Log Storage**:
- Database table: audit_logs
- Fields: id, entity_type, entity_id, action, actor_id, actor_type (user/admin/system), metadata (JSON), timestamp, ip_address
- Indexed on: entity_id, action, timestamp
- Retention: 2 years (compliance)

**Audit Report (Admin Dashboard)**:
- Filter by: subscription_id, user_id, action_type, date_range
- Export to CSV/PDF
- Use case: Dispute resolution, fraud investigation

---

### Manual Override Policy

**When Allowed**:
- Device malfunction (QR scanner broken)
- System error (backend down, false rejection)
- Customer emergency (lost phone, urgent entry)
- VIP/special guest exception

**Process**:
1. Staff verifies customer identity (phone number, booking confirmation, ID)
2. Staff device (tablet/phone app) opens "Manual Check-In" screen
3. Enter subscription_id or search by phone
4. Select reason from dropdown (mandatory)
5. Confirm → Backend logs as manual_override
6. Print temporary paper ticket (if wristband printer down)

**Audit Trail**:
- All overrides logged with:
  - staff_id (who performed)
  - reason (why)
  - subscription_id (what)
  - timestamp (when)
  - device_id (where)
- Daily report sent to manager: "Manual overrides today: 5"
- Flag if same staff has >10 overrides/day (investigation needed)

---

## H) MINIMUM DATABASE ENTITIES (ENGLISH)

### 1) SubscriptionPlan

**Purpose**: Define plan templates (monthly unlimited, visit packs, etc.)

**Fields**:
- id (UUID, PK)
- plan_name_en (e.g., "Monthly Unlimited Playground")
- plan_name_ar (e.g., "شهري – دخول غير محدود (المنطقة الداخلية)")
- plan_type (enum: 'unlimited_monthly', 'visit_pack', 'daycare_halfday', 'daycare_fullday', 'family')
- applicable_areas (array: ['playground', 'sand', 'daycare'])
- duration_days (e.g., 30 for monthly, 90 for visit pack)
- visit_limit (int, null for unlimited)
- daily_limit (int, e.g., 5)
- max_session_duration_hours (e.g., 3)
- price (decimal, base price)
- currency (e.g., 'SAR')
- tax_rate (decimal, e.g., 0.18 for 18% GST)
- family_member_count (int, e.g., 3 for family plan, null for individual)
- allowed_days (array: ['sun','mon','tue','wed','thu','fri','sat'] or null for all)
- allowed_time_slots (array: ['morning','afternoon','peak'] or null for all)
- auto_renewal_enabled (boolean, default true)
- active (boolean, soft delete)
- created_at, updated_at

**Indexes**: (plan_type, active), (applicable_areas)

---

### 2) Subscription

**Purpose**: User's purchased subscription instance

**Fields**:
- id (UUID, PK)
- user_id (FK → users.id)
- plan_id (FK → subscription_plans.id)
- subscription_number (string, unique, e.g., "SUB12345")
- status (enum: 'draft','pending_payment','active','paused','expired','cancelled','refunded')
- payment_intent_id (string, from payment gateway)
- payment_status (enum: 'pending','paid','failed','refunded')
- amount_paid (decimal)
- coupon_code (string, nullable)
- discount_amount (decimal, default 0)
- tax_amount (decimal)
- total_amount (decimal)
- start_date (datetime)
- end_date (datetime)
- paused_at (datetime, nullable)
- pause_duration_days (int, nullable)
- resume_date (datetime, nullable)
- pauses_used (int, default 0, max 2)
- cancelled_at (datetime, nullable)
- cancellation_reason (text, nullable)
- cancelled_by (FK → users.id or admins.id, nullable)
- refund_amount (decimal, nullable)
- refunded_at (datetime, nullable)
- auto_renew (boolean, default false)
- renewed_from_subscription_id (FK → subscriptions.id, nullable, self-reference)
- pending_downgrade_plan_id (FK → subscription_plans.id, nullable)
- created_at, updated_at

**Indexes**: (user_id, status), (subscription_number), (start_date, end_date), (status, end_date)

---

### 3) SubscriptionEntitlement

**Purpose**: Track visit counts for visit packs

**Fields**:
- id (UUID, PK)
- subscription_id (FK → subscriptions.id)
- total_visits (int, e.g., 12)
- visits_used (int, default 0)
- visits_remaining (computed: total - used)
- last_visit_date (datetime, nullable)
- created_at, updated_at

**Indexes**: (subscription_id)

**Note**: For unlimited plans, this table is optional (or set total_visits = null)

---

### 4) SubscriptionMember / ChildLink

**Purpose**: Link children to subscriptions (especially family plans)

**Fields**:
- id (UUID, PK)
- subscription_id (FK → subscriptions.id)
- child_id (FK → children.id)
- added_at (datetime)
- removed_at (datetime, nullable, soft delete)
- is_primary (boolean, default false, one primary child per subscription)

**Indexes**: (subscription_id, child_id, removed_at)

**Constraints**: 
- Unique (subscription_id, child_id) where removed_at IS NULL
- Check: family plan member count <= plan.family_member_count

---

### 5) Child

**Purpose**: Child profiles (can be linked to multiple subscriptions)

**Fields**:
- id (UUID, PK)
- parent_user_id (FK → users.id)
- name (string)
- name_ar (string, optional)
- date_of_birth (date)
- age (computed)
- gender (enum: 'male','female','other')
- photo_url (string, nullable)
- special_needs (text, nullable, e.g., "allergies: peanuts")
- created_at, updated_at

**Indexes**: (parent_user_id), (name)

---

### 6) CheckInSession

**Purpose**: Track each check-in/out event

**Fields**:
- id (UUID, PK)
- subscription_id (FK → subscriptions.id)
- child_id (FK → children.id)
- area (enum: 'playground','sand','daycare')
- session_date (date)
- check_in_time (datetime)
- check_out_time (datetime, nullable)
- scheduled_end_time (datetime, check_in + max_duration)
- actual_duration_minutes (computed)
- device_id (string, kiosk identifier)
- check_in_device_location (string, e.g., "playground_gate_1")
- check_out_device_id (string, nullable)
- status (enum: 'active','completed','auto_closed','invalid_offline')
- overstay_minutes (int, default 0)
- overstay_charge (decimal, default 0)
- notes (text, nullable)
- created_at, updated_at

**Indexes**: (subscription_id, session_date), (child_id, check_in_time), (area, check_in_time), (status, check_in_time)

**Constraints**:
- Unique (child_id, area, check_out_time IS NULL) → Prevent duplicate active sessions

---

### 7) Device

**Purpose**: Register check-in/out devices (kiosks, gates, tablets)

**Fields**:
- id (UUID, PK)
- device_id (string, unique, e.g., "KIOSK_001")
- device_name (string, e.g., "Playground Main Gate")
- device_type (enum: 'kiosk','tablet','gate','wristband_station')
- area (enum: 'playground','sand','daycare','reception')
- location (string, physical location description)
- status (enum: 'online','offline','maintenance')
- last_seen (datetime, updated on each API call)
- firmware_version (string, nullable)
- ip_address (string, nullable)
- created_at, updated_at

**Indexes**: (device_id), (area, status)

---

### 8) AuditLog

**Purpose**: Track all subscription and check-in events

**Fields**:
- id (UUID, PK)
- entity_type (enum: 'subscription','session','payment','admin_action')
- entity_id (UUID, reference to subscription/session/payment)
- action (enum: 'created','activated','paused','resumed','cancelled','refunded','check_in','check_out','fraud_detected','manual_override', etc.)
- actor_id (UUID, user/admin/device who performed action)
- actor_type (enum: 'user','admin','system','device')
- metadata (JSON, additional context, e.g., {reason: "travel", old_value: X, new_value: Y})
- ip_address (string, nullable)
- user_agent (string, nullable)
- timestamp (datetime, default now)

**Indexes**: (entity_id, action, timestamp), (actor_id, timestamp), (timestamp DESC for recent logs)

---

### 9) PaymentOrder (Reference Only)

**Purpose**: Track payment transactions (may be separate payments module)

**Fields**:
- id (UUID, PK)
- subscription_id (FK → subscriptions.id, nullable)
- order_type (enum: 'subscription_purchase','subscription_renewal','upgrade','overstay')
- amount (decimal)
- currency (string)
- payment_method (enum: 'card','wallet','cash','bank_transfer')
- payment_gateway_id (string, e.g., Stripe payment_intent_id)
- status (enum: 'pending','completed','failed','refunded')
- paid_at (datetime, nullable)
- refunded_at (datetime, nullable)
- created_at, updated_at

**Indexes**: (subscription_id), (payment_gateway_id), (status, created_at)

---

### 10) DailyUsageStats (Optional, for Analytics)

**Purpose**: Pre-aggregated daily stats for performance

**Fields**:
- id (UUID, PK)
- date (date)
- area (enum: 'playground','sand','daycare')
- total_check_ins (int)
- total_check_outs (int)
- peak_capacity (int, max concurrent sessions)
- average_session_duration_minutes (int)
- total_subscriptions_active (int)
- total_subscriptions_expired (int)
- created_at

**Indexes**: (date, area)

**Populated By**: Daily cron job (midnight) aggregates from CheckInSession + Subscription tables

---

## IMPLEMENTATION CHECKLIST

### Backend APIs to Implement (Summary)
- GET /api/subscription-plans (list all active plans)
- POST /api/subscriptions/draft (create draft)
- PATCH /api/subscriptions/{id} (update draft: child, start date)
- POST /api/subscriptions/{id}/checkout (initiate payment)
- POST /api/subscriptions/{id}/activate (webhook, activate after payment)
- GET /api/subscriptions?user_id={id}&status={status} (list user subscriptions)
- GET /api/subscriptions/{id}/details (full subscription details)
- GET /api/subscriptions/{id}/qr (generate fresh QR code)
- POST /api/subscriptions/{id}/pause (pause subscription)
- POST /api/subscriptions/{id}/resume (resume subscription)
- POST /api/subscriptions/{id}/cancel (cancel with reason)
- POST /api/subscriptions/{id}/renew (create renewal)
- POST /api/subscriptions/{id}/upgrade (immediate upgrade)
- POST /api/subscriptions/{id}/downgrade (schedule downgrade)
- POST /api/subscriptions/{id}/children (add child to family plan)
- DELETE /api/subscriptions/{id}/children/{child_id} (remove child)
- POST /api/check-in (device scans QR, validate & check in)
- POST /api/check-out (device scans QR, check out)
- POST /api/admin/subscriptions/{id}/adjust (manual adjustment)
- GET /api/audit-logs?entity_id={id} (fetch audit logs)

### Cron Jobs to Implement
- **Subscription Expiry** (daily 12 AM):
  - Find subscriptions where end_date < now AND status = 'active'
  - Set status = 'expired'
  - Trigger auto-renewal if enabled
  
- **Auto-Resume Paused** (every hour):
  - Find subscriptions where resume_date <= now AND status = 'paused'
  - Set status = 'active'
  
- **Auto-Close Sessions** (daily 10 PM):
  - Find sessions where check_in_time NOT NULL AND check_out_time NULL AND check_in_time < today
  - Set check_out_time = scheduled_end OR operating_hours_end
  - Set status = 'auto_closed'
  
- **Daily Usage Stats** (daily 12:30 AM):
  - Aggregate check-in counts, session durations
  - Insert into daily_usage_stats

### Real-Time Validations
- QR token expiry check (<2 sec response)
- Capacity check (real-time active session count)
- Concurrent session prevention (database lock)

### Notifications to Implement
- Subscription activated (WhatsApp + SMS)
- Check-in success (optional push notification)
- Check-out success + receipt (WhatsApp)
- Subscription expiring soon (3 days before, 1 day before)
- Subscription expired + renewal offer
- Pause/resume confirmation
- Overstay warning (15 min before end)
- Overstay charge notification
- Fraud alert (admin dashboard + SMS to admin)

### Security Measures
- QR checksum validation
- Rotating token (5-min expiry)
- Device fingerprinting
- Rate limiting (10 scans/hour per subscription)
- Audit logging (all actions)
- Manual override audit trail

### Testing Scenarios
- Purchase subscription → activate → check in → check out (happy path)
- Purchase → payment fails → retry
- Check in with expired subscription (reject)
- Check in with no visits remaining (reject)
- Check in while already checked in (reject)
- Check in when capacity full (reject + waitlist)
- Pause subscription → verify check-in blocked → resume → verify check-in works
- Upgrade plan mid-cycle → verify proration + new entitlements
- QR screenshot reuse (rotating token rejection)
- Offline device check-in → network restore → sync
- Family plan: 2 children check in simultaneously (allowed)
- Family plan: 3 children try to check in (3rd rejected: max 2 concurrent)
- Admin manual override → verify audit log
- Auto-close session at end of day → verify check_out_time populated

---

END OF DOCUMENT
