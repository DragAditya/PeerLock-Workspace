# Environment-variable reference

Create an untracked `.env` file only for local development. Do not copy real values into this repository, GitHub issues, screenshots, or client-side code.

| Variable | Example format | Required | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | `postgresql://USER:PASSWORD@HOST/DB?sslmode=require` | Yes | Neon PostgreSQL connection. The database holds metadata-only room records and memberships. |
| `JWT_SECRET` | Long random string | Yes | Generate a strong random value for each deployment. |
| `GEMINI_API_KEY` | Google Gemini API key | No | Enables consent-gated AI formatting. |
| `RESEND_API_KEY` | Resend server API key | Yes for account recovery | Sends email verification and password-reset links. Keep server-side only. |
| `RESEND_FROM_EMAIL` | `Peerlock <noreply@yourdomain.com>` | Yes for account recovery | Must be a verified Resend sender. `onboarding@resend.dev` is suitable only for limited testing to the account owner. |
| `APP_BASE_URL` | `https://your-app.onrender.com` | Yes in production | Public HTTPS origin used to build secure verification and password-reset links. |
| `NODE_ENV` | `production` | Production | Hosting providers normally set this value. |
| `PORT` | `3000` | No | Hosting provider normally supplies this automatically. |
| `VITE_APP_ID` | Platform application ID | No | Needed only when retaining template OAuth functionality. |
| `OAUTH_SERVER_URL` | HTTPS URL | No | Needed only when retaining template OAuth functionality. |
| `VITE_OAUTH_PORTAL_URL` | HTTPS URL | No | Needed only when retaining template OAuth functionality. |
| `OWNER_OPEN_ID` | Platform owner ID | No | Needed only when retaining template OAuth functionality. |
