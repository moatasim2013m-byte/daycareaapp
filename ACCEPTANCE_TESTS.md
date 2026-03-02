# ACCEPTANCE_TESTS

End-to-end scenarios that validate the target operating flow.

## Scenario 1: Booking -> Waiver -> Check-in -> Timer -> Overdue -> Checkout

### Preconditions
- Branch and zone exist with capacity >= 1.
- Parent account and child profile exist.
- Active waiver template exists for branch.
- Admission product exists with included session minutes.

### Steps
1. Parent creates booking for child in a specific zone slot.
2. System reserves slot capacity.
3. Parent signs waiver (Arabic or English) linked to guardian + child.
4. Reception opens booking at arrival and verifies waiver status = valid.
5. Reception checks in child and assigns wristband.
6. Session transitions to `ACTIVE` and timer starts.
7. Session reaches included duration and transitions to `ENDED` or `OVERDUE` depending on policy.
8. If still active, overdue minutes and fees accumulate.
9. Reception checks out child; system finalizes overdue charge into unified order.
10. Payment completes and session transitions to `CLOSED`.

### Expected Results
- Capacity was decremented at booking and not exceeded.
- Waiver signature is stored with expiry and is queryable.
- Wristband is mapped to one active session only.
- Overdue amount = configured rule applied to exceeded minutes.
- Order/payment ledger and audit logs are written.

## Scenario 2: Walk-in POS booking uses same capacity logic

### Steps
1. Reception/Cashier creates walk-in via POS.
2. System calls same availability engine as online booking.
3. If slot full, manager override is required.
4. With override, booking/session can proceed and audit log is written.

### Expected Results
- Shared logic path for online and POS bookings.
- Override action is auditable with actor and reason.

## Scenario 3: Refund/Void auditing

### Steps
1. Cashier attempts refund on paid order.
2. If policy requires approval, manager approves.
3. System records refund event and updates financial state.

### Expected Results
- Refund/void reflected in payment totals.
- Audit log contains before/after, actor, reason, timestamp.

## Scenario 4: Membership visit consumption

### Steps
1. Parent purchases visit-pack membership.
2. Child checks in using eligible session.
3. Entitlement engine consumes one visit.

### Expected Results
- Remaining visits decrement by one.
- If no entitlement remains, normal pricing applies.
- Membership change is auditable.

## Scenario 5: Reporting integrity

### Steps
1. Run daily close report after several sessions and sales.
2. Compare orders, payments, refunds, overdue charges.

### Expected Results
- Totals reconcile within branch/day filters.
- Sales by category and overdue fees match source ledgers.

## Scenario 6: Admissions enquiry funnel from form to conversion

### Preconditions
- At least one enquiry form exists with status `live`.
- Email template exists for admission follow-up.
- Staff users exist for lead assignment.

### Steps
1. Admin creates or updates enquiry form and publishes it.
2. Parent submits form through public link or QR scan.
3. Lead appears in enquiries dashboard with source + initial status.
4. Counselor opens lead profile, logs a call note, and uploads a document.
5. Counselor creates follow-up task and assigns it to a staff member.
6. Staff completes the task from consolidated tasks board.
7. Counselor sends an email using saved template from lead profile.
8. Lead status is updated through stages until conversion.

### Expected Results
- Public form submissions create lead records without duplicate task entries.
- Activities, tasks, notes, and emails are fully time-stamped under lead timeline.
- Task board supports pending/done filters and lead-based drill down.
- Template-based email composition pre-fills subject/body and allows edits before send.
- Lead conversion links downstream guardian/child profile references when created.
