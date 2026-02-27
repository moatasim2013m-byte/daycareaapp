# UI STYLE GUIDE - Peekaboo Playful Design System
## Indoor Playground Management System

---

## 🎯 DESIGN PHILOSOPHY

**"Playful Shell + Professional Data Surfaces"**

- **Playful**: Buttons, cards, headers, icons, empty states, illustrations
- **Professional**: Tables, totals, invoices, receipts, charts, audit logs

The system must feel friendly and approachable for parents/kids while remaining serious and trustworthy for financial transactions.

---

## 🎨 COLOR PALETTE (Design Tokens)

### Primary Colors
```css
--primary-yellow: #FFD93B    /* Primary actions, highlights */
--blue: #00BBF9              /* Secondary actions, info */
--red: #FF595E               /* Danger, errors, overdue */
--orange: #FF924C            /* Warnings, pending states */
--green: #8AC926             /* Success, active, confirmed */
--outline-brown: #4A2C2A     /* Mascot outline accent (small use only) */
```

### Neutrals
```css
--white: #FFFFFF
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-500: #6B7280
--gray-700: #374151
--gray-900: #111827
--black: #000000
```

### Usage Rules
- **ONE accent per screen**: Choose primary module color (POS=Green, Bookings=Blue, etc.)
- **Status badges only**: Use multiple colors for status indicators
- **Avoid rainbow layouts**: Keep it clean and focused

---

## 📐 SHAPES & SPACING

### Border Radius
- **Cards**: `24px` (large, friendly)
- **Inputs/Fields**: `16px` (comfortable)
- **Buttons**: `20px` (medium rounded)
- **Pills/Badges**: `999px` (fully rounded)
- **Modals**: `28px` (extra soft)

### Borders
- **Weight**: `2px` (friendly, visible)
- **Color**: `gray-200` (light gray, subtle)
- **Focus/Active**: `blue` (primary blue)

### Shadows
```css
--shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-card: 0 4px 16px rgba(0, 0, 0, 0.10);
--shadow-elevated: 0 8px 24px rgba(0, 0, 0, 0.12);
```
- **Never harsh**: Always soft, subtle elevation
- **Cards at rest**: `shadow-soft`
- **Cards on hover**: `shadow-card`
- **Modals**: `shadow-elevated`

### Spacing Scale
```css
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
--space-2xl: 48px
--space-3xl: 64px
```

**Rule**: Lots of whitespace. Don't cram content.

---

## 🔤 TYPOGRAPHY (Arabic-First)

### Font Families
```css
/* Arabic */
--font-arabic: 'Noto Sans Arabic', 'Cairo', 'Tajawal', sans-serif;

/* English/Numbers */
--font-latin: 'Inter', 'Roboto', sans-serif;

/* Monospace (for codes/IDs) */
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

### Font Sizes
```css
--text-xs: 12px
--text-sm: 14px
--text-base: 16px
--text-lg: 18px
--text-xl: 20px
--text-2xl: 24px
--text-3xl: 32px
--text-4xl: 40px
```

### Font Weights
- **Headings**: `700` (Bold) - Round, friendly
- **Body**: `400` (Regular) - Readable, not thin
- **Emphasis**: `600` (Semibold)
- **POS Numbers**: `700` (Bold) + larger size

### Usage
- **Headings**: Round bold style (playful)
- **Body text**: Readable, clean
- **Money/totals**: **Bigger + bolder** in POS screens
- **Arabic**: Always use Arabic-specific font for proper rendering

---

## 🧩 COMPONENT LIBRARY

### 1. Buttons

#### Primary (Main Actions)
```css
Background: primary-yellow (#FFD93B)
Text: gray-900 (dark)
Border: none
Radius: 20px
Padding: 12px 24px
Hover: Slightly bouncy scale(1.02) + shadow-card
```

**Example**: "حفظ", "تأكيد الدفع", "إضافة حجز"

#### Secondary (Supporting Actions)
```css
Background: blue (#00BBF9)
Text: white
Border: none
Radius: 20px
Padding: 12px 24px
Hover: Darken 5% + shadow-card
```

**Example**: "تعديل", "عرض التفاصيل"

#### Danger (Destructive Actions)
```css
Background: red (#FF595E)
Text: white
Border: none
Radius: 20px
Padding: 12px 24px
Hover: Darken 5% + strong shadow
Requires: Confirmation modal
```

**Example**: "حذف", "إلغاء الحجز", "استرداد"

#### Ghost (Tertiary/Cancel)
```css
Background: white
Text: blue
Border: 2px solid blue
Radius: 20px
Padding: 12px 24px
Hover: blue background + white text
```

**Example**: "إلغاء", "رجوع"

**Rule**: Always rounded + slightly bouncy hover (transform: scale(1.02))

---

### 2. Cards

#### Standard Card
```css
Background: white
Border: 2px solid gray-200
Radius: 24px
Shadow: shadow-soft
Padding: space-lg (24px)
Hover: shadow-card (subtle lift)
```

#### Card with Color Strip (Module-Specific)
```css
Top border: 4px solid [module-color]
  - POS: green
  - Bookings: blue
  - Day Care: orange
  - Memberships: primary-yellow
  - Reports: gray-500
```

**Example**:
```html
<div class="card card-pos">
  <!-- 4px green top strip -->
  <h3>نقطة البيع</h3>
  ...
</div>
```

---

### 3. Inputs & Forms

#### Text Input
```css
Background: white
Border: 2px solid gray-200
Radius: 16px
Padding: 12px 16px
Font-size: text-base (16px)
Focus: 
  Border: blue
  Ring: 0 0 0 3px rgba(0, 187, 249, 0.1)
```

#### Textarea
```css
Same as text input
Min-height: 120px
```

#### Select/Dropdown
```css
Same as text input
Arrow icon: chevron-down (rounded style)
```

#### Checkbox/Radio
```css
Border: 2px solid gray-300
Radius: 6px (checkbox) / 999px (radio)
Checked: blue background + white checkmark
Size: 20px × 20px (large, tappable)
```

**Form Layout Rules**:
- **1-2 column max** (not dense)
- **Big tap targets** (min 44px height)
- **Clear labels** above inputs (Arabic)
- **Inline errors** below fields (red text + icon)

---

### 4. Badges & Status Indicators

#### Badge Styles (Pill Shape)
```css
Radius: 999px (fully rounded pill)
Padding: 4px 12px
Font-size: text-xs (12px)
Font-weight: 600 (semibold)
```

#### Color-Coded States
- **Active**: Green background + white text
- **Confirmed**: Blue background + white text
- **Pending**: Orange background + white text
- **Overdue**: Red background + white text
- **Cancelled**: Gray background + gray-700 text
- **Expired**: Gray-300 background + gray-600 text

**Example**:
```html
<span class="badge badge-active">نشط</span>
<span class="badge badge-overdue">متأخر</span>
```

---

### 5. Icons

**Style**: Rounded / filled style (not sharp line icons)

**Libraries**:
- Lucide React (rounded variants)
- Heroicons (solid style)
- Font Awesome (rounded duotone)

**Usage**:
- **Size**: 20px-24px default
- **Color**: Match text or accent color
- **Spacing**: 8px gap from text

**Examples**:
- Home: 🏠 (rounded house)
- User: 👤 (simple avatar)
- Calendar: 📅 (friendly calendar)
- Money: 💰 (coin stack)
- Check: ✓ (rounded checkmark)

**Avoid**: Sharp angles, thin line icons

---

### 6. Tables (Professional)

#### Money-Safe Table Design
```css
Background: white
Border: 1px solid gray-200 (subtle)
Header: gray-50 background + gray-700 text + font-weight 600
Rows: Divide with 1px gray-200 borders
Hover: gray-50 background (subtle highlight)
Padding: 12px 16px (cell spacing)
```

#### Totals Row (Special Treatment)
```css
Font-size: text-lg (18px)
Font-weight: 700 (bold)
Background: gray-100
Border-top: 2px solid gray-300 (separator)
Text-align: right (for Arabic)
```

**Example**:
```
| المنتج       | الكمية | السعر    |
|--------------|--------|----------|
| ساعة لعب     | 2      | 200 ريال |
| مشروب        | 3      | 15 ريال  |
|--------------|--------|----------|
| **المجموع** |        | **215 ريال** |
```

---

### 7. Modals & Dialogs

#### Standard Modal
```css
Background: white
Radius: 28px (extra soft)
Shadow: shadow-elevated
Max-width: 500px (comfortable reading)
Padding: space-xl (32px)
Backdrop: rgba(0, 0, 0, 0.5) blur(4px)
```

#### Confirmation Modal (Danger Actions)
```css
Icon: Large warning icon (red circle + exclamation)
Title: Bold, red text
Message: Clear explanation of consequence
Buttons: 
  - Danger (red): "تأكيد الحذف"
  - Ghost (cancel): "إلغاء"
Button order: Cancel on right (RTL), Danger on left
```

**Example**:
```
⚠️ تحذير
هل أنت متأكد من حذف هذا الفرع؟
لا يمكن التراجع عن هذا الإجراء.

[إلغاء]  [تأكيد الحذف]
```

---

### 8. Empty States (Playful)

#### Design
```css
Illustration: Simple, colorful, friendly
  - Empty box with stars
  - Sleeping mascot
  - Friendly message bubble
Text: Encouraging, helpful tone
CTA: Primary yellow button
Spacing: Generous padding (space-3xl = 64px)
```

**Example**:
```
[Illustration: Empty playground]

لا توجد حجوزات حالياً

ابدأ بإضافة حجز جديد لعرضه هنا

[+ إضافة حجز جديد]
```

---

## 🧾 MONEY-SAFE DESIGN RULES

### POS Screens
- **Clean layout**: White background, no distractions
- **Big numbers**: Font-size `text-2xl` (24px) or larger for totals
- **Color coding**:
  - Green: Payments, completed
  - Red: Refunds, voids
  - Orange: Pending, holds
- **Clear actions**: Primary buttons for payment, danger for refund

### Receipts (Print-Friendly)
```css
Background: white (no colors)
Font: monospace for amounts
Layout: Simple, aligned columns
Border: 1px solid gray-300 (if needed)
Logo: Grayscale version
```

### Invoices
- Professional PDF layout
- Clear line items
- Bold totals
- Tax breakdown
- Payment method indicated

### Audit Logs
- Clean table design
- Timestamp + Actor + Action
- Color-coded action types:
  - Created: blue
  - Updated: orange
  - Deleted: red
  - Override: red + bold

---

## 📱 RESPONSIVE & TOUCH-FRIENDLY

### Breakpoints
```css
--mobile: 0-640px
--tablet: 641-1024px
--desktop: 1025px+
```

### Touch Targets
- **Minimum size**: 44px × 44px (Apple HIG standard)
- **Buttons**: Generous padding (12px vertical min)
- **Form inputs**: Large enough for fat fingers
- **Table rows**: Tappable rows (12px padding)

### POS-Specific
- **Larger buttons**: 60px height for product selection
- **Grid layout**: 2-3 columns on tablet for product tiles
- **Number pad**: Large keys (80px × 80px)

---

## 🌐 RTL (Right-to-Left) SUPPORT

### CSS Rules
```css
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

/* Flexbox reversal */
.flex-row-rtl {
  flex-direction: row-reverse;
}

/* Spacing reversal */
.space-x-reverse > * + * {
  margin-right: var(--space);
  margin-left: 0;
}
```

### Layout Guidelines
- Navigation: Right-aligned
- Forms: Labels above or to right of inputs
- Icons: Mirror directional icons (arrows, chevrons)
- Tables: Headers right-aligned
- Modals: Buttons reversed (Cancel on right, Action on left)

---

## 🎨 MODULE COLOR ASSIGNMENTS

Use **one primary accent** per screen/module:

| Module | Accent Color | Usage |
|--------|--------------|-------|
| **POS** | Green (#8AC926) | Payment success, active items |
| **Bookings** | Blue (#00BBF9) | Calendar, time slots |
| **Day Care** | Orange (#FF924C) | Shifts, attendance |
| **Memberships** | Yellow (#FFD93B) | Plans, benefits |
| **Parties** | Primary Yellow | Celebration theme |
| **Inventory** | Gray-500 | Professional, stock |
| **Reports** | Blue | Analytics, charts |
| **Settings** | Gray-700 | Admin, config |

**Rule**: Use accent for:
- Primary buttons in that module
- Card top strips
- Icon colors
- Active states

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1 (Core Platform) - DONE ✅
- [x] RTL layout configured
- [x] Arabic fonts loaded
- [x] Primary buttons (yellow)
- [x] Cards with 24px radius
- [x] Badges for status

### Phase 2 (POS)
- [ ] Create POS theme with green accent
- [ ] Large number displays for totals
- [ ] Product card grid (playful)
- [ ] Receipt print styles (professional)
- [ ] Refund confirmation modal (danger)

### Phase 3 (Waivers)
- [ ] Signature pad component
- [ ] Waiver card design
- [ ] Expiry warning badges

### Phase 4 (Bookings)
- [ ] Calendar component (blue theme)
- [ ] Time slot picker (playful)
- [ ] Booking confirmation card

### Phase 5 (Sessions + Wristbands)
- [ ] Live timer display
- [ ] Active sessions dashboard
- [ ] Check-in/out success animations
- [ ] Overdue alert (red)

### Phase 6 (Memberships)
- [ ] Membership cards (yellow theme)
- [ ] Benefits list (icons)
- [ ] QR code display

### Phase 7 (Parties)
- [ ] Party package cards (celebration colors)
- [ ] Task checklist (friendly checkboxes)
- [ ] Deposit payment flow

### Phase 8 (Inventory + Reports)
- [ ] Low stock alerts (orange)
- [ ] Charts (professional, clean)
- [ ] Daily close summary (table format)

---

## 🚫 DON'Ts (Anti-Patterns)

❌ **Don't**: Use sharp corners (0px radius)  
✅ **Do**: Always round (16px+ radius)

❌ **Don't**: Use thin line icons  
✅ **Do**: Use filled/rounded icons

❌ **Don't**: Cram multiple colors everywhere  
✅ **Do**: One accent per screen + neutral backgrounds

❌ **Don't**: Use harsh shadows  
✅ **Do**: Soft, subtle elevation only

❌ **Don't**: Thin fonts (300 weight)  
✅ **Do**: Regular (400) or Bold (700)

❌ **Don't**: Tiny tap targets (<44px)  
✅ **Do**: Large, finger-friendly buttons

❌ **Don't**: Rainbow status badges  
✅ **Do**: Semantic color system (green=active, red=danger)

❌ **Don't**: Add playful styles to money tables  
✅ **Do**: Keep receipts/invoices clean and professional

---

## 📦 DESIGN TOKENS (CSS Variables)

```css
:root {
  /* Colors */
  --primary-yellow: #FFD93B;
  --blue: #00BBF9;
  --red: #FF595E;
  --orange: #FF924C;
  --green: #8AC926;
  --outline-brown: #4A2C2A;
  
  /* Neutrals */
  --white: #FFFFFF;
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-700: #374151;
  --gray-900: #111827;
  
  /* Radius */
  --radius-card: 24px;
  --radius-input: 16px;
  --radius-button: 20px;
  --radius-pill: 999px;
  --radius-modal: 28px;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  
  /* Shadows */
  --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.10);
  --shadow-elevated: 0 8px 24px rgba(0, 0, 0, 0.12);
  
  /* Typography */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;
}
```

---

**END OF UI STYLE GUIDE**
