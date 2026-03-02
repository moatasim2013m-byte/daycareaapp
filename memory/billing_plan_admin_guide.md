# Billing & Accounting Admin Guide: Creating Billing Plans

This guide explains how to set up billing prerequisites and build fee plans for automated invoice generation.

## 1) Add Fee Components

Fee Components are individual billable items (for example: tuition, admission, food, or transportation).

1. Go to **Billing & Accounting → Fee Plan → Fee Components**.
2. Click **Add Fee Component**.
3. Fill:
   - **Name**: Component name (for example, `Admission Fee`).
   - **Description**: Text that appears on invoices.
   - **Unit Price**: Default amount (editable while creating invoices).
   - **Category**:
     - **One-Time**: Charged once.
     - **Recurring**: Charged on a schedule.
   - **Item Code**: Unique internal code.
   - **Refundable**: Enable if collected amount should be tracked as a student deposit.
4. Click **OK**.

Repeat for all required components.

---

## 2) Add Tax Components

1. Go to **Billing & Accounting → Fee Plan → Tax Rate**.
2. Click **Add Tax Rate**.
3. Fill:
   - **Tax Name** (for example, `VAT`).
   - **Tax Rate** (percentage).
   - **Item Code** (unique identifier).
4. Click **OK**.

All configured tax rates are listed on the Tax Rate screen.

---

## 3) Configure Discount Codes

1. Go to **Billing & Accounting → Fee Plan → Discount**.
2. Click **Add Discount**.
3. Fill:
   - **Discount Name** (for example, `Sibling Discount`).
   - **Type**: Percentage or Fixed Amount.
   - **Amount/Percentage**.
   - **Item Code**.
   - **Discount Type**:
     - **Standard**: Always available.
     - **Conditional**: Controlled by conditions such as:
       - **Usage Limit** (for example, valid for first 10 invoices only).
       - **Expiration Date** (for example, valid through 31 Oct 2025).
4. Click **OK**.

Use the Discount list page to filter, edit, or delete discounts.

---

## 4) Create a Fee Plan

A Fee Plan automates billing so invoices can be generated based on defined rules.

1. Go to **Billing & Accounting → Fee Plan → Add Fee Plan**.
2. Configure **Plan Schedule**:
   - **Fee Plan Name** (for example, `Summer Camp`).
   - **Program** and **Label**.
   - **Frequency**: Weekly, bi-weekly, monthly, quarterly, half-yearly, or yearly.
   - **Period**: Start month and optional end month.
   - **Invoice Generation Date** and **Due Date**.
   - Optional: **Generate first invoice on joining date** for students joining after scheduled generation date.
3. Select billing basis:
   - **Previous Billing**
   - **Current Billing**
   - **Next Billing**
4. Optional settings:
   - Send invoice by email to parent.
   - Settle with credit.
   - Add internal school notes (not visible to parents).
   - Add parent notes (visible to parents).
5. Click **Next** and add fee components.
   - Component category comes from setup and is non-editable.
   - You can adjust component amounts at plan level.
   - Add plan-level discounts/taxes if needed.
6. Click **Save Plan**.

---

## 5) Generate Invoices

You can generate invoices in two ways:

### Option A: Manually
- Go to **Billing & Accounting → Invoices**.
- Create invoices by selecting students.

### Option B: Automatically via Fee Plan Assignment
1. Go to **Fee Plan**.
2. Select a plan.
3. Click **Assign / Assigned Students**.
4. Add or update student details:
   - Student name
   - Start/end dates
   - Discounts
   - Upcoming invoice details
5. Click **Save**.

---

## 6) Manage Existing Fee Plans

### Pause or unpause an entire plan
1. Go to **Fee Plan**.
2. Search and open the plan action menu (three dots).
3. Click **Pause** to pause, or **Activate Plan** to resume.

### Pause for an individual student
1. Open **Fee Plan** and select a plan.
2. Go to **Assigned Students**.
3. Open the selected student’s action menu (three dots).
4. Click **Pause** (or activate later as needed).

You can use similar actions to delete a plan or remove one/more students from an assigned plan.
