# Prompt: Cloud Run build/export failure diagnosis

Use this prompt with an AI assistant when your Cloud Run source deploy fails during image export.

```text
You are a senior Google Cloud and buildpacks troubleshooting engineer.

I am deploying a Node.js frontend to Cloud Run from source and I get this failure:

[exporter] ERROR: failed to export: saving image: failed to fetch base layers: saving image with ID "sha256:..." from the docker daemon: error during connect: Get "http://%2Fvar%2Frun%2Fdocker.sock/...": EOF
ERROR: failed to build: executing lifecycle. This may be the result of using an untrusted builder: failed with status code:62

Please do the following:
1) Identify the most likely root causes, ordered by probability.
2) Explain why this error references docker.sock even when deploying to Cloud Run.
3) Give a minimal, copy-paste command sequence to deploy frontend and backend from source using gcloud (no local Docker dependency).
4) Provide a validation checklist (commands + expected outputs) for:
   - gcloud auth/project/region
   - Cloud Build API and Artifact Registry availability
   - Cloud Run service health
   - frontend -> backend connectivity via env vars
5) Provide a fallback path if source deploy still fails (build with Cloud Build, then deploy image).
6) Keep response concise and practical.

Context:
- Frontend service: daycareaapp-frontend
- Backend service: daycareaapp-backend
- Build-time frontend env var: REACT_APP_BACKEND_URL
- I can run gcloud commands locally.
```
