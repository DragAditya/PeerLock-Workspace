# Environment-variable reference

Create an untracked `.env` file only for local development. Do not copy real values into this repository, GitHub issues, screenshots, or client-side code.

| Variable | Example format | Required | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | `mysql://USERNAME:PASSWORD@HOST:3306/DATABASE_NAME` | Yes | Database holds metadata-only room records and memberships. |
| `JWT_SECRET` | Long random string | Yes | Generate a strong random value for each deployment. |
| `GEMINI_API_KEY` | Google Gemini API key | No | Enables consent-gated AI formatting. |
| `NODE_ENV` | `production` | Production | Hosting providers normally set this value. |
| `PORT` | `3000` | No | Hosting provider normally supplies this automatically. |
| `VITE_APP_ID` | Platform application ID | No | Needed only when retaining template OAuth functionality. |
| `OAUTH_SERVER_URL` | HTTPS URL | No | Needed only when retaining template OAuth functionality. |
| `VITE_OAUTH_PORTAL_URL` | HTTPS URL | No | Needed only when retaining template OAuth functionality. |
| `OWNER_OPEN_ID` | Platform owner ID | No | Needed only when retaining template OAuth functionality. |
