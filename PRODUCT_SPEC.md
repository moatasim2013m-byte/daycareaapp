# PRODUCT_SPEC

## 1) Product Goal
A multi-branch daycare operations platform that unifies:
- Reception/check-in operations
- POS sales and payments
- Online booking and parent self-service
- Waiver compliance
- Session timing and overdue billing
- Memberships/visit packs/loyalty
- Parties, inventory, and reporting

## 2) Domain Model (Target)

### Core Entities
- **Branch**: Physical location and top-level tenant boundary.
- **Zone**: Play/experience area within a branch, with capacity policy.
- **User**: Authenticated actor in the platform.
- **Role**: RBAC role applied per user (Admin, Manager, Cashier, Reception, Staff, Parent).
- **Guardian (Parent Profile)**: Parent account metadata.
- **Child**: Child profile linked to guardian.
- **WaiverTemplate**: Versioned legal text per branch (Arabic/English).
- **WaiverSignature**: Signed waiver instance bound to guardian + children + expiry.
- **Product**: Sellable item (admission/add-on/retail/F&B).
- **Order**: Commercial transaction (POS and online share same engine).
- **OrderItem**: Line item under order.
- **Payment**: Payment attempts/settlements for order.
- **Refund/Void**: Reversal operations with reason + operator.
- **BookingSlot**: Time slot with zone capacity.
- **Booking**: Reservation by guardian/child for slot.
- **Session**: On-site lifecycle record from check-in to closure.
- **Wristband**: Physical/virtual identifier mapped to active session.
- **MembershipPlan**: Monthly or visit-pack definition.
- **MembershipSubscription**: Active purchase and remaining entitlement.
- **LoyaltyLedger**: Earn/redeem points journal.
- **PartyPackage/PartyBooking**: Structured event sales + logistics.
- **InventoryItem/InventoryMovement**: Stock tracking.
- **AuditLog**: Immutable sensitive action log.
- **EnquiryForm**: Public or private lead-capture form for admissions.
- **EnquiryLead**: Parent/child admission enquiry record with lifecycle status.
- **EnquiryActivity**: Time-stamped call/meeting/email/note/document entries under a lead.
- **FollowUpTask**: Assigned follow-up task with due date and completion state.
- **EnquiryEmailTemplate**: Reusable plain-text templates for admissions communication.

## 3) Roles and Permissions (Target)

### Admin
- Full system control across branches
- Manage users/roles, global settings, reports

### Manager
- Branch-scoped management
- Capacity overrides, refunds/voids approval, branch reports

### Cashier
- POS orders, payments, receipt printing
- Limited refund initiation (approval workflow configurable)

### Reception
- Check-in/check-out, waiver verification, wristband assignment
- Walk-in booking via shared availability logic

### Staff
- Session support, party task updates, operational board visibility

### Parent
- Child profiles, online booking, waiver signing, membership use

## 4) Key State Machines

### Session State Machine
`CREATED -> CHECKED_IN -> ACTIVE -> ENDED -> OVERDUE -> CLOSED`

Rules:
- `CREATED`: record created after booking/walk-in intake.
- `CHECKED_IN`: reception validates waiver, assigns wristband.
- `ACTIVE`: timer is running.
- `ENDED`: nominal package time reached or manual end.
- `OVERDUE`: active after entitlement end; overdue billing accumulates.
- `CLOSED`: checkout complete and all financials settled.

### Booking State Machine
`DRAFT -> CONFIRMED -> CHECKED_IN -> COMPLETED`
With cancellation branch:
`DRAFT|CONFIRMED -> CANCELLED`

### Order State Machine
`OPEN -> PARTIALLY_PAID -> PAID -> FULFILLED`
Reversal path:
`PAID|FULFILLED -> VOIDED/REFUNDED`

### Waiver State Machine
`DRAFT -> SIGNED -> EXPIRED`
Optional invalidation:
`SIGNED -> REVOKED`

### Enquiry Lead State Machine
`NEW -> CONTACTED -> INTERESTED -> TOURED -> APPLIED -> CONVERTED`
With loss/parking branches:
`NEW|CONTACTED|INTERESTED|TOURED|APPLIED -> LOST|ARCHIVED`

Rules:
- Leads are created either from public enquiry forms or manual entry by staff.
- Every change in lead state writes a time-stamped enquiry activity entry.
- Converted leads can be linked to guardian/child records for downstream admissions.

### Follow-Up Task State Machine
`PENDING -> DONE`
Optional re-open path:
`DONE -> PENDING`

Rules:
- Tasks are scoped to lead + assignee with due date and priority.
- Task updates are visible in both lead profile timeline and consolidated task board.

## 5) Multi-Branch and Data Isolation
- Every operational entity carries `branch_id` except globally shared catalogs by explicit design.
- Queries default to branch-scoped filters.
- Admin can switch context or aggregate across branches.

## 6) Non-Functional Requirements
- Arabic-first interface with RTL support.
- English source code and comments.
- Sensitive actions must write audit logs (refunds, voids, membership changes, check-in/out).
- Performance indexes for branch scoping, time queries, wristband lookup, and booking slots.
- Enquiry timeline events must remain immutable and fully time-stamped for traceability.
