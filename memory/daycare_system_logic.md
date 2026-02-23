# DAY CARE SYSTEM LOGIC - INDOOR PLAYGROUND
## Arabic-First UI | Full Implementation Specification

---

## A) DAY CARE OFFERINGS (Arabic Names + English Rules)

### 1) حضانة – نصف يوم (صباحي)
**Package Name**: Day Care - Half Day (Morning)  
**Arabic Short Name**: نصف يوم صباحي

**Included Hours/Shifts**:
- Morning Shift: 7:00 AM - 1:00 PM (6 hours)
- Single shift only

**Included Areas & Limits**:
- Day Care area (primary): Full access during shift
- Indoor Playground: 30 minutes free play time (scheduled mid-morning, 10:00-10:30 AM)
- Sand Area: Not included (can purchase add-on)

**Included Services**:
- Supervision and care
- Snack (mid-morning, 9:30 AM)
- Educational activities (1 hour: arts, crafts, storytelling)
- Nap area available (if child needs rest)

**Eligibility Rules**:
- Age Range: 2-5 years (configurable per plan)
- Required Documents:
  - Birth certificate or ID proof
  - Vaccination records (placeholder, admin defines required vaccines)
  - Medical history form (allergies, chronic conditions, medications)
  - Emergency contact (min 2 contacts)
- Health Requirements:
  - No fever/contagious illness at check-in (staff visual check)
  - Allergy information mandatory (if applicable)

**Capacity Rules**:
- Max Kids per Shift: 20 children (morning shift)
- Staff Ratio: 1 staff : 6 children (configurable)
- Min Staff: 2 (always, for safety)

**Pricing Model**: 
- Single Day: Fixed rate (e.g., 150 SAR/day)
- Monthly Subscription: 24 days/month (weekdays only, Sun-Fri)

**Cancellation/Refund Policy**:
- **Single Day**:
  - >24 hours before shift: 100% refund or credit
  - 12-24 hours: 50% refund
  - <12 hours: No refund (forfeit)
- **Monthly Subscription**:
  - Before first day: 90% refund (10% admin fee)
  - After first week: No refund (can pause, see section E)

---

### 2) حضانة – نصف يوم (مسائي)
**Package Name**: Day Care - Half Day (Evening)  
**Arabic Short Name**: نصف يوم مسائي

**Included Hours/Shifts**:
- Evening Shift: 1:00 PM - 7:00 PM (6 hours)
- Single shift only

**Included Areas & Limits**:
- Day Care area: Full access
- Indoor Playground: 30 minutes free play (scheduled, 4:00-4:30 PM)
- Sand Area: Not included (can purchase add-on)

**Included Services**:
- Supervision and care
- Lunch (1:00-1:30 PM, light meal)
- Snack (4:00 PM)
- Educational activities (1 hour: arts, science, games)
- Outdoor time (if weather permits, 30 min)

**Eligibility Rules**: Same as morning shift

**Capacity Rules**:
- Max Kids per Shift: 15 children (evening shift, typically lower demand)
- Staff Ratio: 1:6
- Min Staff: 2

**Pricing Model**: Same as morning (single day + monthly subscription options)

**Cancellation/Refund Policy**: Same as morning shift

---

### 3) حضانة – يوم كامل
**Package Name**: Day Care - Full Day  
**Arabic Short Name**: يوم كامل

**Included Hours/Shifts**:
- Full Day: 7:00 AM - 7:00 PM (12 hours)
- Continuous care (no need to check out between shifts)

**Included Areas & Limits**:
- Day Care area: Full access all day
- Indoor Playground: 1 hour total (can be split: 30 min morning + 30 min afternoon)
- Sand Area: Not included (add-on available)

**Included Services**:
- Full day supervision
- Breakfast (7:30-8:00 AM, light)
- Snack (10:00 AM)
- Lunch (12:30-1:00 PM)
- Snack (3:30 PM)
- Dinner/pre-dinner snack (6:00 PM, light)
- Educational activities: 2 sessions (morning + afternoon, 1 hour each)
- Nap time (mandatory rest period 1:30-3:00 PM, individual mats)
- Outdoor/playground time (scheduled)

**Eligibility Rules**: Same as half-day, plus:
- Recommended for children comfortable with full-day separation
- Parent must provide emergency contact available 24/7

**Capacity Rules**:
- Max Kids per Day: 20 children (full day)
- Staff Ratio: 1:6 (2 shifts of staff: morning team 7-2, evening team 1-7, overlap 1-2 PM)
- Min Staff: 2 per shift

**Pricing Model**:
- Single Day: Premium rate (e.g., 280 SAR/day, ~15% discount vs 2 half-days)
- Monthly Subscription: 22 days/month (allows 2 days off)

**Cancellation/Refund Policy**: Same as half-day

---

### 4) حضانة – شامل الكل (All-Inclusive)
**Package Name**: Day Care - All-Inclusive  
**Arabic Short Name**: الباقة الشاملة

**Included Hours/Shifts**:
- Full Day: 7:00 AM - 7:00 PM (12 hours)
- Flexible check-in/out within operating hours

**Included Areas & Limits**:
- Day Care area: Full access
- Indoor Playground: Unlimited access during day care hours (supervised group transitions)
- Sand Area: 2 hours per day (scheduled slots: 11:00 AM-12:00 PM or 4:00-5:00 PM)
- Can switch between areas throughout day (with staff escort)

**Included Services**:
- All full-day services (meals, snacks, nap, activities)
- **Additional Premium Services**:
  - Swimming pool access (if available, 30 min, with lifeguard)
  - Special workshops: Art, music, dance (1 session/day, rotating schedule)
  - Personalized activity plan (staff tracks each child's preferences)
  - Photo/video updates sent to parent (3x per day via WhatsApp)
  - Extended late pickup grace period (15 min vs standard 10 min)

**Eligibility Rules**: Same as full day

**Capacity Rules**:
- Max Kids per Day: 15 children (premium package, lower capacity for better attention)
- Staff Ratio: 1:5 (better ratio)
- Min Staff: 3 (one dedicated to transitions between areas)

**Pricing Model**:
- Single Day: Premium++ rate (e.g., 400 SAR/day)
- Monthly Subscription: 20 days/month (premium flexibility)

**Cancellation/Refund Policy**:
- Single Day: >48 hours: 100% refund, 24-48 hours: 70%, <24 hours: 30%
- Monthly: First 3 days: 80% refund, after: no refund (can pause)

---

### 5) إضافة: ساعتين منطقة الرمل (Add-On)
**Package Name**: Add-On - 2 Hours Sand Area  
**Arabic Short Name**: إضافة الرمل

**Type**: Add-on (can be purchased with any half-day or full-day package)

**Included**:
- Sand Area access: 2 hours (scheduled slot, selected at booking)
- Available slots: 9:00-11:00 AM, 11:00 AM-1:00 PM, 3:00-5:00 PM, 5:00-7:00 PM
- Socks provided (mandatory for sand area)
- Sand play tools (buckets, shovels, molds)
- Supervision by sand area staff

**Requirements**:
- Must have active day care booking for same day
- Child must be checked into day care first
- Staff escorts child to/from sand area

**Capacity**:
- Max 10 day care children in sand area per slot (separate from regular sand bookings)

**Pricing**: Additional fee (e.g., +50 SAR per day)

**Booking**:
- Selected during day care booking OR
- Added after booking (if capacity available) via app/reception

---

### Additional Package Variants (Optional)

#### حضانة – نصف يوم مع الرمل (Half Day + Sand Bundle)
- Pre-bundled: Half day (morning or evening) + 2 hours sand
- Discounted vs buying separately
- Single package selection (simpler for parents)

#### حضانة – أسبوعية (5 أيام) (Weekly Package - 5 Days)
- Prepaid week (Sunday-Thursday)
- Choose shift type: all mornings, all evenings, or mixed
- 10% discount vs 5 single days
- Use case: Short-term visitors, trial period

---

## B) PARENT FLOW (Front-End Button Logic, Arabic UI)

### 1) اختيار الحضانة (Select Day Care Screen)

**Purpose**: Entry point to day care booking

**Display**:
- Hero section: "حضانة آمنة ومريحة لطفلك 💙"
- Benefits icons:
  - إشراف احترافي (Professional supervision)
  - أنشطة تعليمية (Educational activities)
  - وجبات صحية (Healthy meals)
  - بيئة آمنة (Safe environment)

**Buttons**:
- احجز يوم واحد (Book Single Day) → Navigate to package selection (single-day mode)
- اشترك شهرياً (Monthly Subscription) → Navigate to package selection (subscription mode)
- عرض حجوزاتي (View My Bookings) → Navigate to My Bookings screen

**API Calls**: None (navigation only)

---

### 2) اختيار الباقة (Select Package Screen)

**Purpose**: Choose day care package type

**Display Package Cards** (for each package):
- Package name (Arabic)
- Shift times (e.g., "7:00 ص - 1:00 م")
- Price (per day or per month)
- Included features (bullet list):
  - ✓ وجبات خفيفة (Snacks)
  - ✓ أنشطة تعليمية (Activities)
  - ✓ 30 دقيقة لعب (Playground time)
- شارة "الأكثر شعبية" (Most Popular badge - if applicable)

**Packages Displayed**:
1. نصف يوم (صباحي)
2. نصف يوم (مسائي)
3. يوم كامل
4. الباقة الشاملة

**For Each Package Card**:
- **Button**: اختر (Select)

**On Select**:
- If single-day mode:
  - API: GET /api/daycare/availability?package_id={id}&date={today}
  - Check capacity available for selected shift
  - If available: Navigate to date selection
  - If full: Show "⚠️ الفترة ممتلئة، اختر تاريخاً آخر أو انضم لقائمة الانتظار"
- If subscription mode:
  - Navigate directly to child selection (availability checked at checkout)

---

### 3) اختيار الأيام (Select Days Screen)

**Two Modes**: Single Day vs Monthly Subscription

#### Mode A: Single Day Booking

**Display**:
- Calendar widget (current month + next 30 days)
- Availability indicators:
  - Green dot: متاح (Available)
  - Yellow dot: مقاعد محدودة (Limited spots)
  - Red X: ممتلئ (Full)
  - Gray: غير متاح (Not available - weekends/holidays for weekday-only plans)

**Interaction**:
- Tap date → Select (highlight border)
- Display capacity info: "المقاعد المتبقية: 5 من 20"

**Button**: التالي (Next)

**Validations**:
- Date must be future (not past)
- Date must be available (capacity > 0)
- Cannot book >30 days in advance (configurable)

**API Calls**:
- On Load: GET /api/daycare/calendar?package_id={id}&month={YYYY-MM}
  - Response: {dates: [{date, capacity_available, status}]}
- On Next: Store selected_date, navigate to child info

---

#### Mode B: Monthly Subscription

**Display**:
- "اختر الأيام المفضلة للأسبوع" (Choose preferred weekday schedule)
- Checkboxes for weekdays:
  - ☐ الأحد (Sunday)
  - ☐ الاثنين (Monday)
  - ☐ الثلاثاء (Tuesday)
  - ☐ الأربعاء (Wednesday)
  - ☐ الخميس (Thursday)
  - ☐ الجمعة (Friday - if allowed)
  - السبت (Saturday) - grayed out (rest day)

**Note**: "يمكنك حضور 24 يوماً في الشهر. اختر الأيام المناسبة لك وسنقوم بتأكيد كل أسبوع."

**Date Picker**:
- "تاريخ بدء الاشتراك" (Subscription start date)
- Default: Next Sunday (or next available weekday)
- Max 14 days in future

**Button**: التالي (Next)

**Validations**:
- Must select at least 3 weekdays
- Start date must be future

**API Calls**:
- On Next: Store selected_weekdays + start_date, navigate to child info

---

### 4) بيانات الطفل (Child Information Screen)

**Purpose**: Enter/select child details

**Display**:

**Section 1: اختيار الطفل (Select Child)**
- If parent has registered children:
  - Radio buttons with child cards (name, age, photo)
  - ☐ استخدام طفل مسجل (Use existing child)
- إضافة طفل جديد (Add new child) - selected by default if no children

**Section 2: معلومات الطفل (Child Details)** - shown if "new child" selected

**Required Fields**:
- اسم الطفل (Child Name) - text input
- تاريخ الميلاد (Date of Birth) - date picker
- الجنس (Gender) - dropdown: ذكر (Male), أنثى (Female)
- صورة الطفل (Child Photo) - upload button (optional but recommended)

**Section 3: جهات الاتصال الطارئة (Emergency Contacts)** - collapsible, required

**Contact 1** (Primary):
- اسم جهة الاتصال (Contact Name) - text
- العلاقة (Relationship) - dropdown: أم (Mother), أب (Father), جدة (Grandmother), جد (Grandfather), أخرى (Other)
- رقم الهاتف (Phone Number) - with validation (+966...)
- ☑️ يمكنه استلام الطفل (Authorized to pick up child) - checkbox

**Contact 2** (Secondary):
- Same fields as Contact 1
- Labeled "جهة اتصال بديلة" (Backup contact)

**Validations**:
- Child name: Required, min 2 chars
- Age: Must be within package eligibility (2-5 years, calculated from DOB)
- If age out of range: Show "⚠️ عمر الطفل غير مناسب لهذه الباقة (العمر المطلوب: 2-5 سنوات)"
- Emergency contacts: Both required, phone numbers must be valid, at least one must be authorized for pickup

**Button**: التالي (Next)

**API Calls**:
- If using existing child: GET /api/children/{child_id}/profile
- If new child: Store data locally (will create on final submit)
- On Next: Navigate to health notes screen

---

### 5) الملاحظات الصحية والحساسية (Health Notes & Allergies Screen)

**Purpose**: Critical health information for staff safety

**Display**:

**Section 1: الحساسية (Allergies)**

**Question**: "هل يعاني الطفل من أي حساسية؟"
- ☐ لا توجد حساسية (No allergies) - checked by default
- ☐ نعم، لديه حساسية (Yes, has allergies)

**If "Yes" selected**:
- Show multi-select checkboxes:
  - ☐ حساسية الطعام (Food allergy) → Text field: "حدد الأطعمة" (Specify foods)
  - ☐ حساسية الأدوية (Medication allergy) → Text field
  - ☐ حساسية الغبار/حبوب اللقاح (Dust/pollen)
  - ☐ أخرى (Other) → Text field

**Section 2: الحالة الصحية (Medical Conditions)**

**Question**: "هل يعاني الطفل من أي حالة صحية مزمنة؟"
- ☐ لا (No)
- ☐ نعم (Yes) → Text area: "يرجى التوضيح" (Please explain)

**Examples displayed** (placeholder text): "مثال: الربو، السكري، الصرع، إلخ"

**Section 3: الأدوية (Medications)**

**Question**: "هل يتناول الطفل أي أدوية بانتظام؟"
- ☐ لا (No)
- ☐ نعم (Yes) → Show fields:
  - اسم الدواء (Medication name) - text
  - الجرعة والتوقيت (Dosage & timing) - text
  - يمكن للموظفين إعطاء الدواء (Staff can administer) - ☐ نعم ☐ لا
  - If "Yes": "⚠️ يجب إحضار وصفة طبية وتوقيع نموذج الموافقة" (Prescription & consent form required)

**Section 4: قيود غذائية (Dietary Restrictions)**

**Question**: "هل توجد قيود غذائية؟"
- ☐ لا (No)
- ☐ نباتي (Vegetarian)
- ☐ بدون مشتقات الحليب (Dairy-free)
- ☐ بدون الجلوتين (Gluten-free)
- ☐ أخرى (Other) → Text field

**Section 5: ملاحظات إضافية (Additional Notes)**
- Text area (optional)
- Placeholder: "مثال: الطفل يحب القيلولة، يخاف من الأصوات العالية، إلخ"

**Consent Checkbox** (required):
- ☑️ "أؤكد أن جميع المعلومات الصحية المذكورة أعلاه صحيحة وكاملة. أفهم أن إخفاء معلومات صحية مهمة قد يعرض طفلي للخطر."

**Buttons**:
- رجوع (Back) → Previous screen
- التالي (Next)

**Validations**:
- If any allergy selected, specification text required
- If medications "Yes", medication details required
- Consent checkbox must be checked

**API Calls**: None (store locally, submit at payment)

---

### 6) الدفع (Payment Screen)

**Purpose**: Review and confirm booking, process payment

**Display**:

**Section 1: ملخص الحجز (Booking Summary)**

**Display Info**:
- نوع الباقة (Package type): [package_name_ar]
- الفترة (Shift): [shift_time]
- اسم الطفل (Child name): [child_name]
- التاريخ (Date): [selected_date] OR
- أيام الأسبوع (Weekdays): [selected_weekdays] - if subscription
- تاريخ البدء (Start date): [start_date] - if subscription

**Section 2: الإضافات (Add-Ons)** - optional

**Display Available Add-Ons**:
- ☐ إضافة: ساعتين منطقة الرمل (+50 ريال)
  - If checked: Show time slot selector (9-11 AM, 11-1 PM, 3-5 PM, 5-7 PM)
- ☐ إضافة: وجبة إضافية (+20 ريال) - for half-day packages
- ☐ إضافة: تأمين شامل (+30 ريال/شهر) - for subscriptions

**Section 3: تفاصيل الدفع (Payment Details)**

**Display**:
- سعر الباقة (Package price): XXX ريال
- الإضافات (Add-ons): +XX ريال
- الضريبة (Tax 15%): XX ريال
- **الإجمالي (Total)**: XXX ريال

**Coupon Field**:
- رمز الخصم (Coupon code) - text input
- تطبيق (Apply) button
  - API: POST /api/coupons/validate
  - Body: {coupon_code, service_type: 'daycare', package_id}
  - If valid: Update total, show discount line: "الخصم: -XX ريال"
  - If invalid: "❌ رمز الخصم غير صالح"

**Section 4: طريقة الدفع (Payment Method)**

**Radio buttons**:
- ☐ بطاقة ائتمان/مدى (Credit/Debit Card)
- ☐ Apple Pay (if available)
- ☐ STC Pay / Mada Pay (local wallets)

**Checkboxes**:
- ☑️ أوافق على الشروط والأحكام (Accept terms - required)
- ☐ حفظ معلومات الدفع للمرة القادمة (Save payment info - optional)
- ☐ تجديد تلقائي (Auto-renewal - only for subscriptions, optional)

**Buttons**:
- رجوع (Back)
- ادفع الآن (Pay Now)

**On Pay Now**:

**Validations**:
- Terms checkbox must be checked
- Payment method selected
- If add-on selected, time slot selected

**API Call**:
- POST /api/daycare/bookings/checkout
- Body (single day):
  ```json
  {
    "package_id": "uuid",
    "child_id": "uuid_or_null",
    "child_data": {name, dob, gender, photo_url, emergency_contacts, health_notes},
    "booking_date": "2026-01-20",
    "shift": "morning",
    "add_ons": [{type: "sand", time_slot: "9-11"}],
    "coupon_code": "ABC123",
    "payment_method": "card",
    "auto_save_child": true
  }
  ```
- Body (subscription):
  ```json
  {
    "package_id": "uuid",
    "child_id": "uuid_or_null",
    "child_data": {...},
    "subscription_start_date": "2026-02-01",
    "weekdays": ["sun","mon","tue","wed","thu"],
    "shift": "morning",
    "add_ons": [],
    "coupon_code": "",
    "auto_renew": false
  }
  ```

**Response**:
- Success: {payment_url, booking_id OR subscription_id}
- Redirect to payment gateway
- After payment success: Webhook updates booking status to 'confirmed'
- Redirect back to success screen

**Success Screen**:
- "✅ تم تأكيد حجزك بنجاح!"
- Booking details displayed
- QR code image (for check-in)
- **Buttons**:
  - حفظ رمز QR (Save QR Code) → Download image
  - إضافة إلى التقويم (Add to Calendar) → iCal export
  - عرض حجوزاتي (View My Bookings)

**Notifications Sent**:
- WhatsApp: "تم تأكيد حجز الحضانة لـ[child_name] يوم [date] الفترة [shift]. رمز الحجز: DC12345"
- SMS: Same message + QR code link
- Email: Detailed confirmation with:
  - Booking details
  - QR code attachment
  - Health notes confirmation
  - Facility address & contact
  - What to bring (diapers, change of clothes, etc.)

---

### 7) حجوزاتي (الحضانة) (My Bookings - Day Care Screen)

**Purpose**: View and manage day care bookings

**Tabs**:
- القادمة (Upcoming) - default
- المكتملة (Completed)
- الملغاة (Cancelled)

**For Each Booking Card** (in Upcoming tab):

**Display**:
- Package name (Arabic)
- Child name + photo (small)
- Date (for single day) OR "اشتراك شهري" (Monthly subscription) badge
- Shift time (e.g., "7:00 ص - 1:00 م")
- Status badge:
  - مؤكد (Confirmed) - green
  - قيد الانتظار (Pending payment) - yellow
  - تم تسجيل الدخول (Checked In) - blue
  - مكتمل (Completed) - gray

**Buttons**:
- عرض التفاصيل (View Details) → Navigate to booking details screen
- عرض رمز QR (Show QR) → Show QR code modal (refresh every 5 min for rotating token)
- إلغاء الحجز (Cancel) - only if status='confirmed' and >24 hours before
- إعادة الحجز (Rebook) - for completed/cancelled bookings

**Booking Details Screen**:

**Sections**:
1. **معلومات الحجز (Booking Info)**:
   - Booking number (DC12345)
   - Package, shift, date
   - Amount paid
   - Payment method

2. **معلومات الطفل (Child Info)**:
   - Name, age, photo
   - Emergency contacts (expandable)
   - Health notes summary (expandable)

3. **الإضافات (Add-Ons)** (if any):
   - Sand area: 11:00 AM - 1:00 PM
   - Extra meal

4. **الحضور (Attendance)**:
   - Check-in time: [time] OR "لم يتم التسجيل بعد" (Not checked in yet)
   - Check-out time: [time] OR "لم يتم التسجيل بعد"
   - Duration: [X] hours [Y] minutes

5. **سجل النشاط (Activity Log)** (optional, if tracked):
   - Playground time: 10:00-10:30 AM ✓
   - Snack time: 9:30 AM ✓
   - Educational activity: 11:00 AM ✓

**Buttons**:
- تحميل الفاتورة (Download Invoice) - PDF
- إبلاغ عن مشكلة (Report Issue) - opens support chat
- تعديل الملاحظات الصحية (Edit Health Notes) - if >24 hours before booking

**API Calls**:
- On Load (My Bookings): GET /api/daycare/bookings?user_id={id}&status=upcoming,completed
- View Details: GET /api/daycare/bookings/{booking_id}
- Show QR: GET /api/daycare/bookings/{booking_id}/qr → Returns fresh QR image URL
- Cancel: POST /api/daycare/bookings/{booking_id}/cancel → Body: {reason}

**Cancel Confirmation Modal**:
- "هل أنت متأكد من إلغاء الحجز؟"
- Refund info displayed based on cancellation policy
- Dropdown: "سبب الإلغاء" (Cancellation reason) - required
  - مرض الطفل (Child illness)
  - تغيير الخطط (Change of plans)
  - ظروف طارئة (Emergency)
  - أخرى (Other)
- Buttons: تأكيد الإلغاء (Confirm Cancel), رجوع (Back)

**Success**: "✅ تم إلغاء الحجز. سيتم رد المبلغ خلال 7-10 أيام." (if refund applicable)

---

## C) RECEPTION FLOW (POS + Day Care, Arabic UI)

### 1) نقطة الاستقبال – حضانة اليوم (Reception Dashboard - Day Care Today)

**Purpose**: Staff view of today's day care bookings and walk-ins

**Display**:

**Header Metrics** (today's stats):
- الحجوزات المؤكدة (Confirmed bookings): 18
- تم تسجيل الدخول (Checked in): 12
- المقاعد المتبقية (Remaining capacity): 8/20 (morning), 10/15 (evening)
- في قائمة الانتظار (Waitlist): 2

**Tabs**:
- الفترة الصباحية (Morning Shift) - default if before 1 PM
- الفترة المسائية (Evening Shift)
- يوم كامل (Full Day)

**For Each Shift Tab**:

**Table/List View** (sortable):

**Columns**:
- # (رقم)
- اسم الطفل (Child Name) + photo
- ولي الأمر (Parent Name) + phone
- نوع الباقة (Package Type)
- الحالة (Status):
  - مؤكد (Confirmed)
  - تم تسجيل الدخول (Checked In) - with time badge
  - تم تسجيل الخروج (Checked Out)
  - تأخر الاستلام (Late Pickup) - red badge
- الإجراءات (Actions)

**Action Buttons** (per row):
- تسجيل الدخول (Check In) - if status = 'confirmed'
- تسجيل الخروج (Check Out) - if status = 'checked_in'
- عرض التفاصيل (View Details)
- إضافات (Add-Ons) - opens add-on purchase modal

**Top Actions**:
- ➕ حجز جديد (New Walk-In Booking) → Navigate to walk-in booking flow
- 🔍 بحث (Search) - by child name, parent phone, booking number
- 📊 تقرير اليوم (Today's Report) → Generate PDF/Excel

**Filters**:
- الحالة (Status): الكل (All), مؤكد, تم تسجيل الدخول, تم تسجيل الخروج
- Sort by: الاسم (Name), وقت تسجيل الدخول (Check-in time), ولي الأمر (Parent)

**API Calls**:
- On Load: GET /api/reception/daycare/today?shift=morning,evening,fullday
- Response: List of bookings with child, parent, package, status info

---

### 2) تسجيل دخول طفل (Check-In Child Screen/Modal)

**Purpose**: Staff checks in a child (QR scan or manual)

**Two Methods**:

#### Method A: QR Scan (Preferred)

**Display**:
- QR scanner interface (uses device camera or connected scanner)
- "امسح رمز QR الخاص بالحجز" (Scan booking QR code)
- Live camera preview

**On Scan**:
- Decode QR → Extract booking_id + checksum
- API: POST /api/daycare/check-in
- Body: {booking_id, device_id, timestamp, method: 'qr'}

**Validation Backend** (see Section D for full logic):
- Verify checksum
- Check booking exists & status='confirmed'
- Check shift time window (can check in 30 min early to 30 min late)
- Check not already checked in
- Check health screening (staff does visual check)

**If Success**:
- Update booking status='checked_in', check_in_time=now
- Return child info + health alerts
- Display success screen (see below)

**If Fail**:
- Show error message (Arabic, see Section D)
- Option to proceed with manual override (requires supervisor approval)

---

#### Method B: Manual Check-In (Backup)

**Display**:
- Search field: "ابحث بالاسم أو رقم الهاتف" (Search by name or phone)
- Autocomplete results as user types

**On Select Child**:
- Display booking details:
  - Child name, photo
  - Package, shift
  - Parent name, phone
  - ⚠️ Health alerts (if any): "حساسية الفول السوداني" (Peanut allergy)
- Checkbox: ☑️ "تم الفحص الصحي" (Health screening done) - required
  - Staff visually checks: No fever, no visible illness, alert/responsive
- Text field: "ملاحظات عند الدخول" (Check-in notes) - optional
  - Example: "الطفل نعسان قليلاً" (Child a bit sleepy)

**Button**: تأكيد تسجيل الدخول (Confirm Check-In)

**API Call**: Same as QR method, but method='manual'

---

**Check-In Success Screen** (both methods):

**Display**:
- ✅ "مرحباً [child_name]! تم تسجيل الدخول بنجاح"
- Check-in time: [HH:MM]
- Expected check-out: [HH:MM] (shift end time)

**⚠️ Health Alerts Box** (if applicable):
- Red border, large text
- "تنبيهات صحية مهمة:"
- List of allergies/medications (from health notes)
- "يرجى الانتباه لهذه الملاحظات طوال اليوم"

**Assigned Staff** (optional):
- Dropdown: "الموظف المسؤول" (Assigned staff member)
- Select from available staff list
- Stores staff_id with attendance record

**Buttons**:
- طباعة سوار المعصم (Print Wristband) - if wristband printer available
  - Wristband contains: Child name, booking number, shift end time, allergy icons (if any)
- إرسال إشعار لولي الأمر (Send Parent Notification) - auto-sent by default
- تم (Done) → Return to dashboard

**Parent Notification Sent**:
- WhatsApp: "تم تسجيل دخول [child_name] الساعة [time] ✅"
- If health alerts exist: "تذكير: تم إبلاغ الموظفين بالملاحظات الصحية الخاصة بطفلك"

**API Call**:
- POST /api/notifications/parent
- Body: {booking_id, type: 'check_in', timestamp}

---

### 3) تسجيل خروج طفل (Check-Out Child Screen/Modal)

**Purpose**: Staff checks out a child and hands to parent/authorized pickup

**Two Methods**: QR Scan OR Manual (same as check-in)

#### QR Scan Check-Out:

**Process**:
- Scan QR code
- API: POST /api/daycare/check-out
- Body: {booking_id, device_id, timestamp, method: 'qr'}

**Backend Validation**:
- Booking exists & status='checked_in'
- check_in_time not null
- check_out_time null (not already checked out)

**If Success**:
- Set check_out_time=now
- Calculate actual_duration
- Check for late pickup (see Section D)
- Return duration + late fees (if any)

---

#### Manual Check-Out:

**Display**:
- Search: "ابحث باسم الطفل" (Search by child name)
- Filter: Only show currently checked-in children
- Select child from results

**Display Confirmation Screen**:
- Child name, photo
- Check-in time: [HH:MM]
- Expected check-out: [HH:MM]
- Current time: [HH:MM]
- **Late pickup indicator** (if applicable):
  - ⏰ "تأخر الاستلام: 25 دقيقة"
  - "الرسوم الإضافية: 50 ريال"

**Section: Pickup Authorization**

**Required**: Verify who is picking up child

**Display**:
- "من يستلم الطفل؟" (Who is picking up the child?)
- Radio buttons:
  - ☐ ولي الأمر (Parent) - [parent_name] - [phone]
  - ☐ جهة اتصال طوارئ 1 (Emergency contact 1) - [name]
  - ☐ جهة اتصال طوارئ 2 (Emergency contact 2) - [name]
  - ☐ شخص آخر (Other person) - requires manager approval

**If "Other person"**:
- Show fields:
  - اسم الشخص (Person name) - text
  - رقم الهوية (ID number) - text
  - العلاقة بالطفل (Relationship) - text
  - رقم الهاتف (Phone) - text
- Checkbox: ☑️ "تم التحقق من الهوية" (ID verified) - required
- Checkbox: ☑️ "تم الحصول على موافقة ولي الأمر" (Parent approval obtained) - required
  - Staff must call parent to confirm authorization
  - Log phone call in notes

**Section: Child Condition Report**

**Checkboxes** (staff assessment):
- ☑️ الطفل بصحة جيدة (Child in good health)
- ☐ حدث أي حادث/إصابة (Any incident/injury) → If checked, show incident report fields:
  - نوع الحادث (Incident type): سقوط (Fall), خدش (Scratch), أخرى (Other)
  - الوصف (Description) - text area
  - الإسعافات المقدمة (First aid provided) - text
  - تم إبلاغ ولي الأمر (Parent notified) - ☑️
- ☐ الطفل متعب/نعسان (Child tired/sleepy) - normal note
- ☐ لم يأكل جيداً (Did not eat well) - note for parent

**Text Area**: "ملاحظات إضافية" (Additional notes) - optional

**Button**: تأكيد تسجيل الخروج (Confirm Check-Out)

**API Call**:
- POST /api/daycare/check-out
- Body:
  ```json
  {
    "booking_id": "uuid",
    "check_out_time": "2026-01-20T13:05:00Z",
    "picked_up_by": {
      "type": "parent" | "emergency_contact_1" | "emergency_contact_2" | "other",
      "name": "if other",
      "id_number": "if other",
      "phone": "if other",
      "parent_approval_obtained": true/false
    },
    "child_condition": {
      "health_status": "good",
      "incidents": [{type, description, first_aid}],
      "notes": "text"
    },
    "late_pickup_minutes": 25,
    "late_pickup_fee": 50.00,
    "staff_id": "uuid"
  }
  ```

---

**Check-Out Success Screen**:

**Display**:
- ✅ "تم تسجيل خروج [child_name] بنجاح"
- Check-out time: [HH:MM]
- Duration: [X] hours [Y] minutes

**If Late Pickup Fee**:
- ⚠️ "رسوم تأخير الاستلام: 50 ريال"
- "الحالة: تم إضافتها للفاتورة" (Status: Added to invoice)
- **Payment Options**:
  - دفع نقداً الآن (Pay cash now) - button opens cash payment flow
  - دفع بالبطاقة (Pay by card) - button opens POS terminal
  - إضافة للحساب (Add to account) - for monthly subscription customers
  - دفع لاحقاً (Pay later) - parent receives invoice via WhatsApp

**Buttons**:
- طباعة الإيصال (Print Receipt) - includes check-in/out times, duration, fees, child condition notes
- إرسال التقرير لولي الأمر (Send Report to Parent) - WhatsApp
- تم (Done)

**Parent Notification Sent**:
- WhatsApp message:
  - "تم تسجيل خروج [child_name] الساعة [time] ✅"
  - "المدة: [duration]"
  - "حالة الطفل: [condition summary]"
  - If incident: "⚠️ حدث حادث بسيط (خدش)، يرجى مراجعة التقرير المرفق"
  - If late fee: "رسوم تأخير الاستلام: 50 ريال"
  - Attach PDF receipt

---

### 4) تمديد/رسوم إضافية (Extension/Additional Fees Screen)

**Purpose**: Handle late pickups, extensions, additional services

**Trigger**: When parent calls/arrives and needs extra time

**Display**:
- Search for child (by name)
- Select child (must be checked in)

**Child Info Displayed**:
- Name, photo
- Current shift end time: [HH:MM]
- Current time: [HH:MM]
- Overstay: [X] minutes (if already past end time)

**Section: Extension Request**

**Options**:
- ☐ تمديد 30 دقيقة (+30 ريال) (Extend 30 min)
- ☐ تمديد 1 ساعة (+50 ريال) (Extend 1 hour)
- ☐ تمديد 2 ساعة (+90 ريال) (Extend 2 hours)
- ☐ تمديد مخصص (Custom extension) → Input field: عدد الدقائق (Minutes)

**Calculate New End Time**: 
- Display: "الوقت المتوقع الجديد: [new_end_time]"

**Payment Method**:
- Radio buttons:
  - دفع نقداً (Cash)
  - بطاقة ائتمان (Card)
  - إضافة للفاتورة الشهرية (Add to monthly invoice - if subscription customer)

**Button**: تأكيد التمديد (Confirm Extension)

**API Call**:
- POST /api/daycare/bookings/{booking_id}/extend
- Body: {extension_minutes, payment_method, paid_amount}

**Success**:
- Update booking.extended_end_time
- Create fee ledger entry
- Send parent notification: "تم تمديد وقت الحضانة حتى [new_end_time] ✅"

---

### 5) تحويل إلى نشاط إضافي (Transfer to Add-On Activity)

**Purpose**: Move checked-in child to playground/sand area mid-day

**Scenario**: Parent purchases add-on (sand time) after check-in, or child transitions to included playground time

**Display**:
- Search child (must be checked in to day care)
- Select child

**Available Add-Ons** (based on package):
- منطقة الرمل – ساعتين (Sand Area - 2 hours)
- المنطقة الداخلية – ساعة إضافية (Indoor Playground - Extra hour)

**For Each Add-On**:
- Price (if not included)
- Available time slots (dropdown)
- Capacity indicator: "المقاعد المتبقية: 3"

**Select add-on + time slot**

**If Not Included** (requires payment):
- Show payment section (same as extension)
- Collect payment before proceeding

**Button**: تأكيد النقل (Confirm Transfer)

**API Call**:
- POST /api/daycare/bookings/{booking_id}/add-activity
- Body: {activity_type: 'sand', time_slot: '11-13', paid: true/false, amount}

**Process**:
- Create add-on session record
- Staff escorts child to designated area
- Notify area staff: "طفل من الحضانة قادم: [child_name]، الفترة: 11:00-1:00"
- Set reminder to bring child back to day care at end of slot

**Success**: "✅ تم نقل [child_name] إلى منطقة الرمل. الموعد: 11:00-1:00 م"

---

## D) CHECK-IN / CHECK-OUT LOGIC (English + Arabic Messages)

### 1) Earliest Allowed Check-In

**Rule**: **30 minutes before shift start time**

**Examples**:
- Morning shift (7:00 AM): Earliest check-in = 6:30 AM
- Evening shift (1:00 PM): Earliest check-in = 12:30 PM
- Full day (7:00 AM): Earliest check-in = 6:30 AM

**Before Window**:
- QR scan or manual check-in → **REJECT**
- Message: "⏰ لا يمكن تسجيل الدخول قبل موعد الحجز. يمكنك التسجيل بدءاً من [earliest_time]"
- Offer: "هل ترغب في الانتظار في منطقة الاستقبال؟" (Would you like to wait in reception area?)

**Exception (Early Drop-Off Service)**:
- If facility offers paid early drop-off:
  - Before 6:30 AM for morning shift → Extra fee (e.g., +30 SAR/30 min)
  - Staff asks parent: "هل ترغب في خدمة التوصيل المبكر؟ (رسوم إضافية: 30 ريال)" (Would you like early drop-off service? Extra fee: 30 SAR)
  - If accepted: Process payment, allow check-in, mark as 'early_dropoff'

---

### 2) Late Arrival Handling

**Grace Period**: **30 minutes after shift start time**

**Window**: Shift start to shift start + 30 min

**Within Grace Period**:
- Check-in **ALLOWED**
- Mark as 'late_arrival' in attendance record
- Log late_minutes (e.g., 15 min late)
- Message to staff: "⚠️ [child_name] تأخر 15 دقيقة عن موعد الحضور"
- No penalty fee (within grace)
- Session **still ends at original shift end time** (child loses time)

**Example**:
- Morning shift: 7:00 AM - 1:00 PM
- Arrives: 7:20 AM (20 min late, within grace)
- Check-in allowed
- Session ends: 1:00 PM (loses 20 min)

**After Grace Period (>30 min late)**:

**Cutoff**: **1 hour after shift start**

**Between 30-60 min late**:
- Check-in **ALLOWED with warning**
- Message to staff: "⚠️ تأخر كبير: 45 دقيقة. هل يرغب ولي الأمر في المتابعة؟"
- Staff confirms with parent
- Option to cancel without penalty (since significant time lost)
- If proceed: Session ends at original time

**More than 1 hour late**:
- Check-in **BLOCKED** (cutoff)
- Message: "❌ انتهى وقت الحجز. لا يمكن تسجيل الدخول بعد مرور ساعة من بداية الفترة."
- Offer: "يرجى مراجعة الاستقبال لإعادة الحجز أو الحصول على استرداد"
- Booking marked as 'no_show'
- Refund policy applies (partial refund or credit for next booking)

---

### 3) Check-Out Rules

**Normal Check-Out Window**: **Shift end time ± 15 minutes**

**Expected Behavior**:
- Parent arrives at or before shift end time
- Staff checks out child (QR or manual)
- No extra fees

**Early Check-Out** (before shift end):
- Allowed anytime
- No refund for unused time (policy: pay for reserved slot, not actual usage)
- Mark as 'early_checkout' with checkout_time

**On-Time Check-Out** (shift end ± 10 min):
- Standard process
- No late fee

---

### 4) Late Pickup Fee Algorithm

**Grace Period**: **10 minutes after shift end time** (free)

**After Grace Period**: Late fees apply

**Fee Structure** (placeholder, configurable):

**Option A: Per-Interval Charging**
- First 15 min after grace: 30 SAR
- Next 15 min: 30 SAR
- After 30 min: 40 SAR per 15 min
- Rounding: Round up to next 15-min interval

**Example**:
- Shift end: 1:00 PM
- Grace until: 1:10 PM (free)
- Pickup at 1:32 PM → Late by 22 minutes after grace
- Intervals: 
  - 1:10-1:25 PM (15 min): 30 SAR
  - 1:25-1:32 PM (7 min, rounds to 15 min): 30 SAR
- **Total fee: 60 SAR**

---

**Option B: Hourly Rate (Simpler)**
- First hour after grace: 50 SAR (flat)
- Each additional hour: 50 SAR
- Rounding: Round up to next hour

**Example**:
- Pickup at 1:35 PM (35 min late after grace)
- Rounds to 1 hour → 50 SAR

---

**Cap Rules** (optional):

**Daily Cap**: Max late fee per day = 200 SAR
- Prevents excessive fees if parent extremely late

**Subscription Discount**: Monthly subscription customers get:
- 20% discount on late fees (incentive for loyalty)
- First 2 late pickups per month: Waived (grace)
- 3rd+ late pickup: Full fee applies

---

**Fee Application**:
1. Calculate late_minutes = check_out_time - (shift_end_time + grace_period)
2. If late_minutes <= 0: No fee
3. If late_minutes > 0:
   - Calculate intervals: CEIL(late_minutes / 15)
   - Calculate fee: intervals × fee_per_interval
   - Apply cap if fee > daily_cap
   - Apply subscription discount if applicable
4. Create fee ledger entry:
   - booking_id
   - fee_type: 'late_pickup'
   - amount
   - status: 'pending' | 'paid'
5. Prompt staff to collect payment OR add to account

---

**Arabic Messages**:

| Scenario | Arabic Message |
|----------|----------------|
| Late Pickup Warning (at check-out) | ⏰ تأخر استلام الطفل بمقدار [X] دقيقة. الرسوم الإضافية: [amount] ريال |
| Late Fee Added to Invoice | ✅ تم إضافة رسوم التأخير للفاتورة. يرجى الدفع عند الاستلام أو عبر التطبيق |
| Late Fee Paid | ✅ تم دفع رسوم التأخير بنجاح ([amount] ريال) |
| Late Fee Waived (subscription grace) | ℹ️ تم التجاوز عن رسوم التأخير (المرة الأولى هذا الشهر) |
| Late Fee Capped | ℹ️ الرسوم الإضافية محدودة بـ 200 ريال (الحد الأقصى اليومي) |

---

### 5) Early Drop-Off Rules (Before Shift)

**Standard Policy**: Check-in not allowed before 30 min prior to shift

**Optional Early Drop-Off Service** (if facility offers):

**Hours**: Starting 6:00 AM (1 hour before earliest morning shift)

**Fee Structure**:
- 6:00-6:30 AM (before 6:30 window): 30 SAR for 30 min
- 5:30-6:00 AM (extra early): 50 SAR for 30 min
- Each additional 30 min earlier: +20 SAR

**Process**:
1. Parent arrives early
2. Staff offers early drop-off option: "الفترة المحجوزة تبدأ الساعة 7:00. هل ترغب في خدمة التوصيل المبكر؟ (رسوم إضافية: 30 ريال)"
3. If accepted:
   - Process payment (cash/card at reception)
   - Check in child with note: 'early_dropoff'
   - Create fee ledger entry
4. If declined:
   - Parent waits in reception or returns later

**Alternative**: No early drop-off service available
- Strict cutoff at 30 min prior
- Parent must wait

---

### 6) No Check-Out Recorded by Closing

**Scenario**: Facility closing time (e.g., 7:00 PM), child still marked as checked-in

**Detection**: Cron job at closing time checks for unclosed sessions

**Process**:

**Auto-Check-Out**:
- Set check_out_time = shift_end_time + reasonable_buffer (e.g., shift_end + 30 min)
- Status = 'auto_closed'
- Flag for manual review

**Late Fee Calculation**:
- If auto_check_out_time > shift_end_time + grace:
  - Calculate late fee based on buffer time
  - Add to fee ledger with status='pending'

**Alert Admin**:
- Dashboard notification: "⚠️ طفل لم يتم تسجيل خروجه: [child_name], الحجز: [booking_id]"
- Possible reasons: Staff forgot to check out, system glitch, child still on premises (emergency)

**Alert Parent**:
- SMS/WhatsApp: "لم يتم تسجيل خروج [child_name] بشكل رسمي. يرجى التواصل مع المنشأة للتأكيد."
- If late fee: "رسوم تأخير محتملة: [amount] ريال. سيتم التأكيد غداً."

**Manual Resolution**:
- Admin reviews next day
- If child was picked up on time but staff forgot to check out:
  - Update check_out_time to actual time (from CCTV/staff memory)
  - Waive late fee
  - Audit log: 'manual_correction'
- If child actually picked up late:
  - Confirm late fee
  - Invoice parent

---

## E) MONTHLY DAY CARE SUBSCRIPTIONS vs SINGLE-DAY (English)

### Monthly Subscription Model

**Subscription Structure**:
- **Duration**: 30 days (calendar month OR 30 days from start date)
- **Allowed Days**: Configurable per plan
  - Typical: Sunday-Thursday (5 days/week) + some Fridays
  - Max days per month: 20-24 (accounts for weekends + holidays)
- **Shift Consistency**: Subscriber chooses shift type at purchase:
  - All morning shifts
  - All evening shifts
  - All full-day
  - Mixed (requires approval, e.g., morning Mon-Wed, evening Thu-Fri)

**How It Maps to Daily Bookings**:

**Option A: Pre-Scheduled Model**
- At subscription purchase, parent selects weekdays (e.g., Sun, Mon, Tue, Wed, Thu)
- System auto-creates bookings for all matching days in the month
  - Example: Jan 2026, Sundays = 5, Mondays = 5, ..., total = 20 bookings
- Each booking is a separate DayCareBooking record linked to subscription
- Parent can see all pre-scheduled days in calendar
- Cancellation: Parent can cancel individual days (up to X days/month) without penalty

**Option B: Entitlement Model (Flexible)**
- Subscription gives entitlement: "24 days available this month"
- Parent books days as needed (like visit pack)
- Each booking consumes 1 day from entitlement
- Flexibility: Parent can choose different shifts on different days (if plan allows)
- Downside: Requires parent to actively book, less predictable for facility capacity planning

**Recommended**: **Option A (Pre-Scheduled)** with flexible cancellation/rescheduling

---

### Pause/Freeze Rules for Day Care Subscriptions

**Eligibility**:
- Must have active subscription
- Min 7 days remaining in subscription
- Max 2 pauses per subscription lifetime

**Pause Duration**:
- Min: 7 consecutive days
- Max: 21 consecutive days (3 weeks)
- Cannot pause for just 1-2 days (use cancellation for individual days)

**Use Cases**:
- Family vacation
- Child illness (extended)
- Temporary relocation

**Process**:
1. Parent requests pause via app: Select start_date + duration
2. System validates (check limits, min days remaining)
3. If approved:
   - Cancel all pre-scheduled bookings during pause period
   - Set subscription status = 'paused'
   - Extend end_date by pause_duration days
   - Block new bookings during pause
4. Send confirmation: "تم إيقاف اشتراك الحضانة مؤقتاً من [start] إلى [end]. سيتم تمديد الاشتراك بمقدار [X] يوم."

**Auto-Resume**:
- On resume_date: Status = 'active', bookings enabled
- If pre-scheduled model: Auto-reschedule missed days to end of month (if capacity allows)

---

### Makeup Days Policy (Missed Days)

**Scenarios for Missed Days**:
1. **Child illness** (parent cancels same-day or no-show due to illness)
2. **Facility closure** (emergency, maintenance)
3. **Holidays** (if subscription includes holiday days)

**Policy Options**:

**Option A: No Makeup (Standard)**
- Subscription pays for reserved slot, not attendance
- If child misses day (any reason), no makeup day provided
- Parent forfeits that day
- Pro: Simple, predictable revenue
- Con: Less flexible for parents

**Option B: Limited Makeup Days**
- Allow **2 makeup days per month** (for illness only)
- Parent must:
  - Cancel >2 hours before shift start
  - Provide reason (dropdown: illness, emergency)
  - Submit doctor's note (for >3 consecutive days)
- Makeup day scheduled within same month (if capacity available)
- Pro: Customer-friendly
- Con: Capacity planning complexity

**Option C: Full Flexibility (Premium Plans)**
- All-inclusive plan: Unlimited makeup days (within 90 days)
- Parent can reschedule any day (with 24-hour notice)
- Pro: Maximum flexibility, premium pricing justifies it
- Con: High capacity uncertainty

**Recommended**: **Option B** (limited makeup for standard plans, unlimited for premium)

**Implementation**:
- Track missed_days_count in subscription record
- If parent cancels with valid reason (<2 hours before, illness):
  - Increment makeup_days_available (max 2)
- Parent can use makeup day via app: "استخدام يوم تعويضي" (Use Makeup Day)
- Select new date (from available dates)
- System creates new booking, decrements makeup_days_available

---

### Attendance Consumption for Subscriptions

**How Attendance Consumes Entitlement**:

**Pre-Scheduled Model**:
- Booking already exists (created at subscription purchase)
- Check-in does **not** consume anything (booking already allocated capacity)
- No-show or cancellation: Booking marked as 'cancelled' or 'no_show', capacity released
- Attendance tracked for reporting, but doesn't affect remaining days (already paid for)

**Entitlement Model**:
- Each check-in consumes 1 day from remaining_days
- Decrement at check-in (not at booking creation)
- If remaining_days = 0: Block further bookings until next month/renewal

**Recommended**: Pre-scheduled model (simpler accounting)

---

### Single-Day vs Subscription: Comparison

| Aspect | Single Day | Monthly Subscription |
|--------|------------|----------------------|
| **Purchase** | One-time booking | Upfront monthly payment |
| **Price** | Full per-day rate (e.g., 150 SAR) | Discounted (~15-20% cheaper per day, e.g., 2,400 SAR for 20 days = 120 SAR/day) |
| **Flexibility** | High (book any day, any shift) | Low-Medium (committed to scheduled days) |
| **Cancellation** | Strict policy (24-hour notice) | Flexible (can cancel individual days, pause subscription) |
| **Capacity Priority** | Standard | Higher (subscribers get priority capacity) |
| **Late Fee Discount** | None | 20% discount or first 2 waived/month |
| **Makeup Days** | N/A | Available (2/month) |
| **Add-Ons** | Pay per use | Discounted or included (all-inclusive plan) |

**Parent Incentive to Subscribe**:
- Cost savings
- Guaranteed capacity (pre-scheduled)
- Perks (late fee grace, makeup days, priority support)

---

## F) CAPACITY & STAFFING RULES (English)

### Capacity per Shift

**Configuration** (per shift, per day):
- **Morning Shift (7 AM-1 PM)**: Max 20 children
- **Evening Shift (1 PM-7 PM)**: Max 15 children (lower typical demand)
- **Full Day (7 AM-7 PM)**: Max 20 children (shared capacity with morning, separate from evening)

**Note**: Full-day bookings consume morning shift capacity (not separate pool)

**Capacity Allocation**:
- Total capacity = subscription pre-scheduled bookings + reserved slots for single-day walk-ins
- Example: Morning shift capacity = 20
  - Subscriptions: 14 pre-scheduled
  - Walk-in pool: 6 slots available
  - If walk-in pool fills up, can allocate from buffer (1-2 slots) or waitlist

---

### Waitlist Policy

**Trigger**: Shift capacity reaches 100%

**Process**:
1. **Parent attempts booking for full shift**:
   - System shows: "⚠️ الفترة ممتلئة. هل ترغب في الانضمام لقائمة الانتظار؟" (Shift full. Join waitlist?)
   - Button: "انضم لقائمة الانتظار" (Join Waitlist)

2. **Waitlist Entry Created**:
   - Store: child_id, package_id, preferred_date, shift, timestamp
   - Send confirmation: "تم إضافتك لقائمة الانتظار. سنبلغك إذا توفر مكان."

3. **Slot Opens** (due to cancellation):
   - Auto-notify first person in waitlist (FIFO order)
   - SMS/WhatsApp: "✅ توفر مكان في الحضانة! احجز الآن خلال ساعة واحدة: [booking_link]"
   - Booking window: 1 hour to confirm
   - If no response within 1 hour: Move to next in queue

4. **Waitlist Expiry**:
   - If date passes with no slot: Remove from waitlist, notify: "للأسف، لم يتوفر مكان في التاريخ المطلوب."

**Waitlist Priority**:
- Subscribers > Single-day bookers
- Timestamp order within each tier

---

### Overbooking Prevention

**Hard Capacity Limit**: Enforced at database level

**Constraint**: 
- Check capacity_available >= num_children_in_booking before confirming
- Use database transaction lock (SELECT FOR UPDATE) to prevent race condition
- If 2 bookings attempt to take last slot simultaneously: One succeeds, other gets "Capacity full" error

**No Overbooking Allowed**: 
- Unlike airlines, no intentional overbooking (safety/staff ratio regulations)
- If exceptional circumstance (VIP, emergency), requires manager override:
  - Manager can add 1-2 extra spots (emergency buffer)
  - Must justify in audit log
  - Must ensure staff ratio maintained (call in extra staff if needed)

---

### Staff Ratio Configuration

**Regulatory Requirement** (placeholder, adjust per local regulations):
- **Age 2-3**: 1 staff : 5 children
- **Age 4-5**: 1 staff : 6 children
- **Mixed age group**: Use lower ratio (1:5)

**System Configuration** (admin panel):
- Define min_staff_ratio per age group
- Define min_staff_count (absolute minimum, regardless of attendance)
  - E.g., Min 2 staff must be present at all times (safety)

**Capacity Enforcement Linked to Staff**:
- If only 2 staff scheduled for morning shift:
  - Max capacity = 2 × 6 = 12 children (using 1:6 ratio)
- If 3 staff scheduled:
  - Max capacity = 3 × 6 = 18 children
- If 4 staff scheduled:
  - Max capacity = 20 (capped by room size)

**Admin View** (staff scheduler):
- Assign staff to shifts
- System calculates max_capacity_based_on_staff
- Warn if bookings exceed calculated capacity: "⚠️ الحجوزات (22) تتجاوز السعة بناءً على الموظفين (18). يرجى إضافة موظف أو تقليل الحجوزات."

---

### Emergency Contact Requirements

**Minimum Contacts**: 2 (primary + backup)

**Validation**:
- At least 1 contact must be authorized for pickup
- Phone numbers must be reachable (staff may call to verify)
- If only 1 contact provided: Block booking, show error: "يرجى إضافة جهة اتصال طوارئ ثانية (مطلوب)"

**Emergency Protocol** (facility-level, not system):
- If child has incident and neither contact reachable:
  - Call emergency services (if medical emergency)
  - Keep child safe, continue attempts to reach parent
  - Log all attempts (time, method, outcome)
  - Last resort: Contact local authorities (child protective services) if parent unreachable for extended period

---

## G) MINIMUM DATA ENTITIES (English)

### 1) DayCarePlan

**Purpose**: Define day care package templates

**Fields**:
- id (UUID, PK)
- plan_name_en (e.g., "Half Day Morning")
- plan_name_ar (e.g., "نصف يوم صباحي")
- plan_type (enum: 'half_day_morning', 'half_day_evening', 'full_day', 'all_inclusive')
- shift_start_time (time, e.g., 07:00)
- shift_end_time (time, e.g., 13:00)
- duration_hours (decimal, e.g., 6)
- age_min (int, e.g., 2)
- age_max (int, e.g., 5)
- capacity_max (int, per shift)
- staff_ratio (decimal, e.g., 6 for 1:6)
- price_single_day (decimal)
- price_monthly_subscription (decimal, for ~20-24 days)
- included_meals (JSON array, e.g., ["snack", "lunch"])
- included_activities (JSON array, e.g., ["arts", "playground_30min"])
- included_areas (JSON array, e.g., ["daycare", "indoor_playground"])
- playground_time_minutes (int, e.g., 30)
- sand_area_included (boolean, default false)
- sand_time_minutes (int, nullable)
- add_ons_available (JSON array, e.g., ["sand_2hr", "extra_meal"])
- allowed_weekdays (JSON array, e.g., ["sun","mon","tue","wed","thu","fri"], null = all)
- cancellation_policy (text, policy description)
- active (boolean)
- created_at, updated_at

**Indexes**: (plan_type, active), (shift_start_time)

---

### 2) DayCareBooking

**Purpose**: Individual day care booking instance (single-day or part of subscription)

**Fields**:
- id (UUID, PK)
- booking_number (string, unique, e.g., "DC20260120-001")
- booking_type (enum: 'single_day', 'subscription') - indicates if part of subscription
- subscription_id (FK → daycare_subscriptions.id, nullable) - if booking_type='subscription'
- user_id (FK → users.id, parent)
- child_id (FK → children.id)
- plan_id (FK → daycare_plans.id)
- booking_date (date)
- shift (enum: 'morning', 'evening', 'fullday')
- shift_start_time (datetime, calculated from plan + date)
- shift_end_time (datetime)
- status (enum: 'draft', 'pending_payment', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show', 'auto_closed')
- payment_status (enum: 'pending', 'paid', 'failed', 'refunded', 'free') - 'free' if subscription
- amount_paid (decimal, 0 if subscription)
- coupon_code (string, nullable)
- discount_amount (decimal)
- tax_amount (decimal)
- total_amount (decimal)
- payment_intent_id (string, from gateway)
- cancelled_at (datetime, nullable)
- cancellation_reason (text, nullable)
- cancelled_by (FK → users.id or admins.id, nullable)
- refund_amount (decimal, nullable)
- notes (text, parent's booking notes)
- created_at, updated_at

**Indexes**: (booking_date, shift, status), (child_id, booking_date), (subscription_id), (booking_number)

---

### 3) DayCareSubscription

**Purpose**: Monthly subscription for day care

**Fields**:
- id (UUID, PK)
- subscription_number (string, unique, e.g., "DCS202601-045")
- user_id (FK → users.id)
- child_id (FK → children.id)
- plan_id (FK → daycare_plans.id)
- shift_type (enum: 'morning', 'evening', 'fullday')
- start_date (date)
- end_date (date, start + 30 days)
- status (enum: 'draft', 'pending_payment', 'active', 'paused', 'expired', 'cancelled')
- allowed_weekdays (JSON array, e.g., ["sun","mon","tue","wed","thu"])
- max_days_per_month (int, e.g., 24)
- days_used (int, default 0) - if entitlement model
- makeup_days_available (int, default 2)
- pauses_used (int, default 0, max 2)
- paused_at (datetime, nullable)
- pause_duration_days (int, nullable)
- resume_date (datetime, nullable)
- amount_paid (decimal)
- payment_intent_id (string)
- payment_status (enum: 'pending', 'paid', 'failed')
- auto_renew (boolean, default false)
- renewed_from_subscription_id (FK → daycare_subscriptions.id, nullable)
- cancelled_at (datetime, nullable)
- cancellation_reason (text, nullable)
- notes (text)
- created_at, updated_at

**Indexes**: (user_id, status), (child_id, status), (start_date, end_date), (subscription_number)

---

### 4) DayCareAttendance

**Purpose**: Track check-in/check-out events for each booking

**Fields**:
- id (UUID, PK)
- booking_id (FK → daycare_bookings.id)
- child_id (FK → children.id)
- attendance_date (date)
- shift (enum: 'morning', 'evening', 'fullday')
- check_in_time (datetime)
- check_out_time (datetime, nullable)
- scheduled_end_time (datetime)
- actual_duration_minutes (int, computed)
- check_in_method (enum: 'qr', 'manual', 'early_dropoff')
- check_out_method (enum: 'qr', 'manual')
- check_in_device_id (string, kiosk/device ID)
- check_out_device_id (string, nullable)
- check_in_staff_id (FK → staff.id)
- check_out_staff_id (FK → staff.id, nullable)
- assigned_staff_id (FK → staff.id, nullable) - primary caregiver for the day
- late_arrival_minutes (int, default 0)
- late_pickup_minutes (int, default 0)
- late_pickup_fee (decimal, default 0)
- early_dropoff_fee (decimal, default 0)
- extension_minutes (int, default 0) - if parent requested extension
- extension_fee (decimal, default 0)
- picked_up_by (JSON, {type, name, phone, id_verified})
- child_condition_at_checkout (JSON, {health_status, incidents, notes})
- attendance_status (enum: 'present', 'late', 'early_checkout', 'late_pickup', 'no_show', 'auto_closed')
- staff_notes (text, nullable)
- created_at, updated_at

**Indexes**: (booking_id), (child_id, attendance_date), (attendance_date, shift), (attendance_status)

---

### 5) ChildProfile

**Purpose**: Store child details and health information

**Fields**:
- id (UUID, PK)
- parent_user_id (FK → users.id)
- name (string)
- name_ar (string, nullable)
- date_of_birth (date)
- age (int, computed)
- gender (enum: 'male', 'female', 'other')
- photo_url (string, nullable)
- nationality (string, nullable)
- id_number (string, nullable, birth certificate or ID)
- special_needs (text, nullable)
- created_at, updated_at

**Linked Tables**:
- child_emergency_contacts (separate table for normalized storage)
- child_health_notes (separate table)

**Indexes**: (parent_user_id), (name), (date_of_birth)

---

### 6) ChildEmergencyContact

**Purpose**: Store emergency contacts for each child

**Fields**:
- id (UUID, PK)
- child_id (FK → children.id)
- contact_type (enum: 'primary', 'secondary', 'other')
- name (string)
- relationship (enum: 'mother', 'father', 'grandmother', 'grandfather', 'sibling', 'other')
- phone (string)
- phone_alternate (string, nullable)
- email (string, nullable)
- authorized_for_pickup (boolean, default false)
- notes (text, nullable)
- created_at, updated_at

**Indexes**: (child_id, contact_type), (phone)

**Constraint**: Min 2 contacts per child (enforced at application level)

---

### 7) ChildHealthNotes

**Purpose**: Store health and allergy information

**Fields**:
- id (UUID, PK)
- child_id (FK → children.id, unique) - one health record per child
- has_allergies (boolean, default false)
- allergies (JSON array, [{type: 'food', items: ['peanuts', 'dairy']}, {type: 'medication', items: ['penicillin']}])
- has_medical_conditions (boolean, default false)
- medical_conditions (text, description)
- has_medications (boolean, default false)
- medications (JSON array, [{name, dosage, timing, staff_can_administer: true/false, prescription_on_file: true/false}])
- dietary_restrictions (JSON array, e.g., ['vegetarian', 'dairy_free'])
- additional_notes (text, nullable)
- last_updated (datetime)
- parent_consent (boolean, required true)
- created_at, updated_at

**Indexes**: (child_id), (has_allergies), (has_medications)

---

### 8) AddOnPurchase

**Purpose**: Track add-on services purchased with day care booking

**Fields**:
- id (UUID, PK)
- booking_id (FK → daycare_bookings.id)
- add_on_type (enum: 'sand_2hr', 'extra_meal', 'insurance', 'photo_service', 'workshop')
- add_on_name (string, e.g., "ساعتين منطقة الرمل")
- time_slot (string, nullable, e.g., "11:00-13:00")
- price (decimal)
- status (enum: 'pending', 'confirmed', 'used', 'cancelled')
- used_at (datetime, nullable) - when child actually used add-on
- staff_notes (text, nullable)
- created_at, updated_at

**Indexes**: (booking_id), (add_on_type, status)

---

### 9) FeesLedger

**Purpose**: Track all additional fees (late pickup, extensions, early dropoff)

**Fields**:
- id (UUID, PK)
- booking_id (FK → daycare_bookings.id)
- attendance_id (FK → daycare_attendance.id, nullable)
- fee_type (enum: 'late_pickup', 'early_dropoff', 'extension', 'add_on', 'other')
- description (string, e.g., "Late pickup: 25 minutes")
- amount (decimal)
- currency (string, default 'SAR')
- status (enum: 'pending', 'paid', 'waived', 'disputed')
- payment_method (enum: 'cash', 'card', 'account', 'online', nullable)
- paid_at (datetime, nullable)
- waived_by (FK → admins.id, nullable) - if fee waived
- waived_reason (text, nullable)
- created_at, updated_at

**Indexes**: (booking_id, fee_type), (status, created_at), (attendance_id)

---

### 10) AuditLog

**Purpose**: Comprehensive audit trail for day care operations

**Fields**:
- id (UUID, PK)
- entity_type (enum: 'booking', 'subscription', 'attendance', 'payment', 'fee', 'admin_action')
- entity_id (UUID)
- action (enum: 'created', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'extended', 'fee_added', 'fee_waived', 'manual_override', etc.)
- actor_id (UUID, user/admin/staff who performed action)
- actor_type (enum: 'user', 'admin', 'staff', 'system', 'device')
- metadata (JSON, additional context)
- before_state (JSON, nullable, snapshot before change)
- after_state (JSON, nullable, snapshot after change)
- ip_address (string, nullable)
- device_id (string, nullable)
- timestamp (datetime, default now)

**Indexes**: (entity_id, action, timestamp), (actor_id, timestamp), (timestamp DESC)

---

## H) REPORTS (English, Names in Arabic)

### 1) تقرير الحضور اليومي (Daily Attendance Report)

**Purpose**: Overview of today's day care attendance across all shifts

**Filters**:
- Date (default: today)
- Shift (morning / evening / full day / all)
- Plan type (all / half-day / full-day / all-inclusive)

**Metrics**:
- **Total Bookings**: Count of confirmed bookings for selected date/shift
- **Checked In**: Count of children currently checked in
- **Checked Out**: Count of children already picked up
- **No-Shows**: Count of bookings with no check-in (past grace period)
- **Late Arrivals**: Count of check-ins >30 min late
- **Late Pickups**: Count of check-outs with late pickup fees
- **Average Duration**: Average time children spent (checked-out children only)
- **Capacity Utilization**: (Checked In / Max Capacity) × 100%

**Data Breakdown**:
- Table: List of all children (name, check-in time, check-out time, status, late fees)
- Export options: PDF, Excel, CSV

**Data Source**: DayCareBooking + DayCareAttendance tables

**API**: GET /api/reports/daycare/daily-attendance?date=2026-01-20&shift=morning

---

### 2) تقرير الإيرادات – الحضانة (Day Care Revenue Report)

**Purpose**: Financial overview of day care revenue

**Filters**:
- Date range (default: current month)
- Plan type (single-day / subscription / all)
- Payment status (paid / pending / failed)

**Metrics**:
- **Total Revenue**: Sum of all payments received
  - Breakdown by:
    - Single-day bookings
    - Monthly subscriptions
    - Add-ons
    - Late pickup fees
    - Extension fees
- **Average Revenue per Child**: Total revenue / unique children
- **Revenue by Plan Type**: Pie chart (half-day morning, half-day evening, full-day, all-inclusive)
- **Revenue by Payment Method**: Card, cash, online, account
- **Pending Fees**: Sum of unpaid late fees + extensions
- **Refunds Issued**: Sum of refunded amounts

**Data Breakdown**:
- Daily revenue trend (line chart)
- Top revenue days (bar chart)
- Revenue by shift (morning vs evening vs full-day)

**Data Source**: DayCareBooking, DayCareSubscription, FeesLedger, PaymentOrder tables

**API**: GET /api/reports/daycare/revenue?start_date=2026-01-01&end_date=2026-01-31

---

### 3) تقرير استخدام السعة (Capacity Utilization Report)

**Purpose**: Analyze capacity usage to optimize bookings and staffing

**Filters**:
- Date range
- Shift (morning / evening / full-day)
- Weekday (to see patterns, e.g., Mondays busier than Thursdays)

**Metrics**:
- **Average Occupancy Rate**: Average (checked_in_count / max_capacity) across date range
- **Peak Days**: Days with highest occupancy
- **Low Days**: Days with <50% occupancy (opportunity for promotions)
- **Waitlist Frequency**: How often waitlist activated (capacity full)
- **Staff-to-Child Ratio Actual**: Actual ratio based on attendance (vs planned)

**Visualizations**:
- Heatmap: Day of week × Week of month → color-coded by occupancy %
- Line chart: Daily occupancy trend
- Bar chart: Occupancy by shift

**Data Source**: DayCareAttendance, DayCareBooking, StaffSchedule tables

**API**: GET /api/reports/daycare/capacity?start_date=2026-01-01&end_date=2026-01-31

---

### 4) تقرير الأطفال الفردي (Individual Child Report)

**Purpose**: Detailed report for a specific child (for parent or admin)

**Filters**:
- Child ID (selected from dropdown)
- Date range

**Metrics**:
- **Total Days Attended**: Count of check-ins
- **Total Hours**: Sum of actual duration
- **Average Session Duration**: Average duration per day
- **Late Arrivals**: Count + dates
- **Late Pickups**: Count + total late fees
- **No-Shows**: Count + dates
- **Add-Ons Used**: List of add-ons (sand time, extra meals, etc.)
- **Incidents**: Any reported incidents from check-out condition reports

**Visualizations**:
- Calendar view: Days attended (color-coded: present, late, no-show)
- Activity timeline: Check-in/out times across days

**Export**: PDF report with child photo, parent info, attendance summary (shareable with parent)

**Data Source**: DayCareAttendance, ChildProfile, FeesLedger tables

**API**: GET /api/reports/daycare/child/{child_id}?start_date=2026-01-01&end_date=2026-01-31

---

### 5) تقرير الاشتراكات الشهرية (Monthly Subscriptions Report)

**Purpose**: Track subscription performance and renewal rates

**Filters**:
- Month (default: current month)
- Subscription status (active / paused / expired / cancelled)

**Metrics**:
- **Total Active Subscriptions**: Count
- **New Subscriptions**: Count of subscriptions started this month
- **Renewed Subscriptions**: Count of renewals
- **Cancelled Subscriptions**: Count + cancellation reasons (breakdown)
- **Paused Subscriptions**: Count + pause reasons
- **Renewal Rate**: (Renewed / Expiring this month) × 100%
- **Average Subscription Value**: Average amount paid per subscription
- **Makeup Days Used**: Total + average per subscription

**Data Breakdown**:
- Table: List of subscriptions (child name, plan, start date, end date, status, days used)
- Cancellation reasons: Pie chart (cost, dissatisfied, moved, child aged out, etc.)

**Data Source**: DayCareSubscription, DayCareBooking tables

**API**: GET /api/reports/daycare/subscriptions?month=2026-01

---

### 6) تقرير الرسوم الإضافية (Additional Fees Report)

**Purpose**: Track and reconcile late fees, extensions, and other charges

**Filters**:
- Date range
- Fee type (late_pickup / early_dropoff / extension / add_on)
- Payment status (paid / pending / waived)

**Metrics**:
- **Total Fees Charged**: Sum of all fees
- **Fees Collected**: Sum of paid fees
- **Pending Fees**: Sum of unpaid fees
- **Waived Fees**: Sum of fees waived (with reasons)
- **Average Late Pickup Fee**: Average amount per late pickup
- **Late Pickup Frequency**: % of bookings with late pickup

**Data Breakdown**:
- Table: List of fees (child, date, type, amount, status, waived reason)
- Trend: Daily/weekly fee totals (line chart)

**Use Case**: Identify repeat late-pickers (for follow-up reminders or policy enforcement)

**Data Source**: FeesLedger, DayCareAttendance tables

**API**: GET /api/reports/daycare/fees?start_date=2026-01-01&end_date=2026-01-31&status=all

---

### 7) تقرير الصحة والسلامة (Health & Safety Report)

**Purpose**: Track health-related incidents and compliance

**Filters**:
- Date range
- Incident type (injury / illness / allergy reaction / medication error / other)

**Metrics**:
- **Total Incidents**: Count
- **Incident Rate**: Incidents per 100 child-days
- **Children with Allergies**: Count (from health notes)
- **Children on Medications**: Count
- **Staff Training Compliance**: % of staff with current certifications (first aid, CPR)

**Data Breakdown**:
- Incident log table (date, child, type, description, first aid, parent notified)
- Allergy summary: List of all active children with allergies (for staff reference)

**Compliance Notes**:
- Flag children missing required vaccination records
- Flag staff due for training renewal

**Data Source**: ChildHealthNotes, DayCareAttendance (incidents from child_condition_at_checkout), StaffCertifications table

**API**: GET /api/reports/daycare/health-safety?start_date=2026-01-01&end_date=2026-01-31

---

## IMPLEMENTATION CHECKLIST

### Backend APIs to Implement

**Booking APIs**:
- GET /api/daycare/plans (list all packages)
- GET /api/daycare/availability?package_id={id}&date={date} (check capacity)
- GET /api/daycare/calendar?package_id={id}&month={YYYY-MM} (month availability)
- POST /api/daycare/bookings/checkout (single-day booking)
- POST /api/daycare/subscriptions/checkout (monthly subscription)
- GET /api/daycare/bookings?user_id={id}&status={status} (list user's bookings)
- GET /api/daycare/bookings/{id} (booking details)
- GET /api/daycare/bookings/{id}/qr (generate QR code)
- POST /api/daycare/bookings/{id}/cancel (cancel booking)
- POST /api/daycare/bookings/{id}/extend (extend time)
- POST /api/daycare/bookings/{id}/add-activity (add sand/playground time)

**Check-In/Out APIs**:
- POST /api/daycare/check-in (check in child)
- POST /api/daycare/check-out (check out child)
- GET /api/reception/daycare/today (reception dashboard)
- POST /api/daycare/attendance/{id}/add-fee (add late fee manually)

**Subscription APIs**:
- POST /api/daycare/subscriptions/{id}/pause (pause subscription)
- POST /api/daycare/subscriptions/{id}/resume (resume subscription)
- POST /api/daycare/subscriptions/{id}/cancel (cancel subscription)
- POST /api/daycare/subscriptions/{id}/use-makeup-day (schedule makeup day)

**Child/Health APIs**:
- POST /api/children (create child profile)
- PATCH /api/children/{id} (update child info)
- POST /api/children/{id}/health-notes (add/update health notes)
- GET /api/children/{id}/emergency-contacts (get contacts)

**Reports APIs**:
- GET /api/reports/daycare/daily-attendance
- GET /api/reports/daycare/revenue
- GET /api/reports/daycare/capacity
- GET /api/reports/daycare/child/{child_id}
- GET /api/reports/daycare/subscriptions
- GET /api/reports/daycare/fees
- GET /api/reports/daycare/health-safety

### Cron Jobs

- **Daily Attendance Cleanup** (10 PM):
  - Auto-close unclosed sessions
  - Calculate late fees
  - Generate daily report

- **Subscription Expiry** (12 AM):
  - Mark expired subscriptions
  - Trigger auto-renewal if enabled

- **Waitlist Notifications** (every 30 min):
  - Check for cancellations
  - Notify next in waitlist

- **Reminder Notifications**:
  - Day before booking: Send reminder to parent
  - 2 hours before shift: Send reminder with QR code
  - Shift end -15 min: Send pickup reminder to parent

### Notifications

- **WhatsApp** (preferred for parents):
  - Booking confirmed
  - Check-in success
  - Check-out success with daily report
  - Late pickup warning
  - Extension confirmed
  - Incident report (if any)

- **SMS** (backup):
  - Same as WhatsApp

- **Email**:
  - Booking confirmation with detailed info
  - Invoice/receipt
  - Monthly subscription summary

### Security & Validation

- QR checksum validation (prevent tampering)
- Health screening required at check-in
- Pickup authorization validation (only authorized persons)
- ID verification for "other person" pickups
- Audit log for all sensitive actions (check-in/out, fee waiver, admin overrides)

### Testing Scenarios

- Book single-day → check-in → check-out (normal flow)
- Book subscription → pre-schedule days → check-in multiple days
- Late arrival (within grace) → check-in allowed
- Late arrival (>1 hour) → check-in blocked
- Late pickup → calculate fees → collect payment
- Early drop-off → charge extra fee
- Cancel booking (>24 hours) → refund
- Cancel booking (<24 hours) → no refund
- Capacity full → join waitlist → slot opens → notify
- Pause subscription → verify check-in blocked → resume → verify check-in works
- Manual check-out (forgot to scan) → verify pickup authorization
- Health incident → report filled → parent notified
- Child with allergy → check staff alerted at check-in
- Admin waive late fee → verify audit log

---

END OF DOCUMENT
