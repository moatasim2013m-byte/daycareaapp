# DATA_MODEL

This file describes the **target MongoDB collections** for upcoming phases, plus the currently implemented baseline collection.

## Current Baseline (already in repo)

### `status_checks`
Purpose: Demo/status sample records written by `/api/status`.

Fields:
- `id` (string, UUID)
- `client_name` (string)
- `timestamp` (ISO datetime string)

## Target Collections

### 1) `branches`
- `_id`
- `branch_id` (string unique business key)
- `name_ar`, `name_en`
- `address`, `timezone`, `is_active`
- `created_at`, `updated_at`

Indexes:
- `{ branch_id: 1 }` unique
- `{ is_active: 1 }`

### 2) `zones`
- `_id`
- `branch_id`
- `zone_id`
- `name_ar`, `name_en`
- `capacity`
- `age_min`, `age_max`
- `is_active`
- `created_at`, `updated_at`

Indexes:
- `{ branch_id: 1, zone_id: 1 }` unique
- `{ branch_id: 1, is_active: 1 }`

### 3) `users`
- `_id`
- `user_id`
- `email` (unique)
- `password_hash`
- `display_name`
- `roles` (array of role strings)
- `branch_ids` (array)
- `is_active`
- `created_at`, `updated_at`, `last_login_at`

Indexes:
- `{ email: 1 }` unique
- `{ branch_ids: 1 }`
- `{ roles: 1 }`

### 4) `guardians`
- `_id`
- `guardian_id`
- `user_id` (if linked to login)
- `full_name`, `phone`, `email`
- `branch_id` (home branch)

Indexes:
- `{ guardian_id: 1 }` unique
- `{ branch_id: 1, phone: 1 }`

### 5) `children`
- `_id`
- `child_id`
- `guardian_id`
- `branch_id`
- `full_name`
- `birth_date`
- `medical_notes`
- `is_active`

Indexes:
- `{ guardian_id: 1 }`
- `{ branch_id: 1, full_name: 1 }`

### 6) `waiver_templates`
- `_id`
- `template_id`
- `branch_id`
- `title_ar`, `title_en`
- `content_ar`, `content_en`
- `version`
- `is_active`

Indexes:
- `{ branch_id: 1, is_active: 1 }`
- `{ branch_id: 1, version: -1 }`

### 7) `waiver_signatures`
- `_id`
- `signature_id`
- `branch_id`
- `template_id`
- `guardian_id`
- `child_ids` (array)
- `signed_at`
- `expires_at`
- `status` (`SIGNED|EXPIRED|REVOKED`)

Indexes:
- `{ branch_id: 1, guardian_id: 1, status: 1 }`
- `{ expires_at: 1 }`

### 8) `products`
- `_id`
- `product_id`
- `branch_id` (nullable if globally shared)
- `category` (`admission|addon|retail|fnb`)
- `name_ar`, `name_en`
- `price`
- `tax_profile`
- `is_active`

Indexes:
- `{ branch_id: 1, category: 1, is_active: 1 }`

### 9) `orders`
- `_id`
- `order_id`
- `branch_id`
- `channel` (`pos|online`)
- `customer_ref` (guardian/user)
- `status`
- `subtotal`, `discount_total`, `tax_total`, `grand_total`
- `created_by`, `created_at`, `updated_at`

Indexes:
- `{ branch_id: 1, created_at: -1 }`
- `{ branch_id: 1, status: 1 }`

### 10) `order_items`
- `_id`
- `order_id`
- `branch_id`
- `product_id`
- `qty`
- `unit_price`
- `line_total`

Indexes:
- `{ order_id: 1 }`
- `{ branch_id: 1, product_id: 1 }`

### 11) `payments`
- `_id`
- `payment_id`
- `order_id`
- `branch_id`
- `method` (`cash|card|online`)
- `amount`
- `status`
- `provider_ref`
- `created_at`

Indexes:
- `{ order_id: 1 }`
- `{ branch_id: 1, created_at: -1 }`

### 12) `refunds_voids`
- `_id`
- `event_id`
- `branch_id`
- `order_id`
- `type` (`refund|void`)
- `amount`
- `reason`
- `approved_by`
- `created_by`
- `created_at`

Indexes:
- `{ branch_id: 1, created_at: -1 }`
- `{ order_id: 1 }`

### 13) `booking_slots`
- `_id`
- `slot_id`
- `branch_id`
- `zone_id`
- `start_at`, `end_at`
- `capacity_total`
- `capacity_reserved`

Indexes (required):
- `{ branch_id: 1, zone_id: 1, start_at: 1 }`  
- `{ branch_id: 1, start_at: 1, end_at: 1 }`

### 14) `bookings`
- `_id`
- `booking_id`
- `branch_id`
- `zone_id`
- `slot_id`
- `guardian_id`
- `child_ids`
- `status`
- `created_at`

Indexes:
- `{ branch_id: 1, slot_id: 1 }`
- `{ guardian_id: 1, created_at: -1 }`

### 15) `sessions`
- `_id`
- `session_id`
- `branch_id`
- `zone_id`
- `booking_id` (optional)
- `guardian_id`, `child_id`
- `state`
- `checkin_at`, `started_at`, `ended_at`, `closed_at`
- `included_minutes`, `overdue_minutes`, `overdue_amount`
- `wristband_id`

Indexes (required):
- `{ branch_id: 1, state: 1, started_at: 1 }` (time queries)
- `{ branch_id: 1, checkin_at: -1 }`
- `{ wristband_id: 1 }` (lookup)

### 16) `wristbands`
- `_id`
- `wristband_id`
- `branch_id`
- `status` (`available|assigned|lost|disabled`)
- `assigned_session_id`

Indexes:
- `{ branch_id: 1, wristband_id: 1 }` unique
- `{ assigned_session_id: 1 }`

### 17) `membership_plans`
- `_id`
- `plan_id`
- `branch_id`
- `plan_type` (`monthly_unlimited|visit_pack`)
- `name_ar`, `name_en`
- `price`
- `visits_included` (nullable)
- `validity_days`

Indexes:
- `{ branch_id: 1, plan_type: 1, is_active: 1 }`

### 18) `membership_subscriptions`
- `_id`
- `subscription_id`
- `branch_id`
- `guardian_id`
- `plan_id`
- `start_at`, `end_at`
- `remaining_visits`
- `status`

Indexes:
- `{ branch_id: 1, guardian_id: 1, status: 1 }`
- `{ end_at: 1 }`

### 19) `loyalty_ledger`
- `_id`
- `entry_id`
- `branch_id`
- `guardian_id`
- `type` (`earn|redeem|adjust`)
- `points`
- `ref_type`, `ref_id`
- `created_at`

Indexes:
- `{ branch_id: 1, guardian_id: 1, created_at: -1 }`

### 20) `audit_logs`
- `_id`
- `audit_id`
- `branch_id`
- `actor_user_id`
- `action`
- `entity_type`, `entity_id`
- `before`, `after`
- `reason`
- `created_at`

Indexes:
- `{ branch_id: 1, created_at: -1 }`
- `{ entity_type: 1, entity_id: 1, created_at: -1 }`

### 21) `enquiry_forms`
- `_id`
- `form_id`
- `branch_id`
- `name`
- `description`
- `status` (`draft|live|disabled`)
- `theme` (json for style customization)
- `fields` (array of configured form fields)
- `share_link`
- `qr_code_url`
- `created_by`, `created_at`, `updated_at`

Indexes:
- `{ branch_id: 1, status: 1, updated_at: -1 }`
- `{ form_id: 1 }` unique

### 22) `enquiry_leads`
- `_id`
- `lead_id`
- `branch_id`
- `source` (`form|manual|website|event|social|import`)
- `form_id` (nullable)
- `parent_name`, `parent_phone`, `parent_email`
- `child_name`, `child_age_months`
- `interest_area`
- `status` (`new|contacted|interested|toured|applied|converted|lost|archived`)
- `assigned_to` (user_id nullable)
- `last_follow_up_at`, `next_follow_up_at`
- `converted_guardian_id`, `converted_child_id` (nullable)
- `created_by`, `created_at`, `updated_at`

Indexes:
- `{ branch_id: 1, status: 1, created_at: -1 }`
- `{ branch_id: 1, assigned_to: 1, next_follow_up_at: 1 }`
- `{ branch_id: 1, parent_phone: 1 }`

### 23) `enquiry_activities`
- `_id`
- `activity_id`
- `branch_id`
- `lead_id`
- `activity_type` (`call|meeting|email|note|document|status_update`)
- `title`
- `content`
- `metadata` (json: meeting date, email subject, file info, etc.)
- `created_by`
- `created_at`

Indexes:
- `{ lead_id: 1, created_at: -1 }`
- `{ branch_id: 1, activity_type: 1, created_at: -1 }`

### 24) `enquiry_tasks`
- `_id`
- `task_id`
- `branch_id`
- `lead_id`
- `title`
- `description`
- `assignee_user_id`
- `due_at`
- `status` (`pending|done`)
- `completed_at`
- `created_by`, `created_at`, `updated_at`

Indexes:
- `{ branch_id: 1, assignee_user_id: 1, status: 1, due_at: 1 }`
- `{ lead_id: 1, status: 1, due_at: 1 }`

### 25) `enquiry_email_templates`
- `_id`
- `template_id`
- `branch_id`
- `name`
- `subject`
- `body_text`
- `label`
- `is_active`
- `created_by`, `updated_by`, `created_at`, `updated_at`

Indexes:
- `{ branch_id: 1, is_active: 1, updated_at: -1 }`
- `{ branch_id: 1, name: 1 }`
