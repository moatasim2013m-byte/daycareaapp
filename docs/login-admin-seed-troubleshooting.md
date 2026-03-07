# Login troubleshooting on Cloud Run (admin user seed)

If frontend and backend deployments are healthy but login fails for:

- `admin@peekaboo.com`
- `admin123`

the most likely root cause is a missing admin user in MongoDB.

## Why this happens

The login endpoint validates credentials only against existing users.
If no user exists with `email=admin@peekaboo.com`, authentication fails.

The development seed endpoint creates this account only when `DEV_MODE=true`.

## Quick fix

1. Open backend Swagger docs:
   - `https://daycareapp-837978573979.europe-west1.run.app/docs`
2. Run:
   - `POST /api/dev/seed`
3. Retry login in frontend:
   - `https://daycareapp-frontend-837978573979.europe-west1.run.app`

Expected admin credentials after seed:

- Email: `admin@peekaboo.com`
- Password: `admin123`
- Role: `ADMIN`

## If `/api/dev/seed` returns 403

`DEV_MODE` is not enabled in backend Cloud Run service.

Set env var on `daycareapp` service and redeploy:

- `DEV_MODE=true`

## MongoDB verification checklist

In MongoDB Atlas database `daycare_db`, collection `users`, verify admin record fields:

- `email: admin@peekaboo.com`
- `display_name: Peekaboo Admin`
- `role: ADMIN`
- `password_hash: <bcrypt hash>`

> Important: if the field is `password` instead of `password_hash`, login validation will fail.

## Relevant code references

- Seed endpoint route: `backend/routes/dev_seed.py`
- Seed logic and admin creation: `backend/services/dev_seed_service.py`
- Password check during login: `backend/routers/auth.py`
