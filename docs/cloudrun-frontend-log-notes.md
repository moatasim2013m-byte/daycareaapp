# Cloud Run frontend log notes (2026-03-07)

## What these logs show

The provided log sequence indicates a **healthy cold start** of the `daycare-frontend` Cloud Run revision:

1. A new instance was created due to autoscaling (`scaling_reason: AUTOSCALING`).
2. The frontend container started with `npm run start:cloudrun` and launched `serve -s build -l ${PORT:-8080}`.
3. The static server bound to port `8080` and reported `Accepting connections`.
4. Cloud Run startup TCP probe succeeded on the first attempt.
5. User traffic was served successfully (`/favicon.ico` returned `304`).

## About `POST /api/auth/login` from `169.254.169.126`

A single internal request to `/api/auth/login` that returns `200` during startup does **not** indicate a crash or failed revision by itself.

- Source IP `169.254.169.126` is an internal platform address in Cloud Run logs.
- Because the request returned quickly (`29 ms`) with `200`, this event is informational unless it is unexpectedly frequent.

## When to investigate further

Investigate only if you also observe one or more of the following patterns:

- Spikes of unexpected login requests without corresponding user traffic.
- Repeated 4xx/5xx responses on auth routes.
- Container restarts or probe failures near the same timestamps.

If that occurs, review Cloud Run service configuration and any synthetic monitoring checks to ensure probes/tests hit a dedicated health endpoint instead of auth routes.
