# Public Diagnostics Validation

The `/devlogs` route was checked without an authenticated account on 2026-08-21. It rendered a public, read-only system snapshot and did not include account identities, email addresses, passwords, password hashes, cookies, reset tokens, OTP codes, provider API keys, database URLs, document bodies, Yjs updates, or chat text.

The development deployment reported `urlLooksValid: false` and all required Peerlock tables as `missing_or_unreachable` because `DATABASE_URL` was absent, invalid, or not a Neon PostgreSQL URL. This explains the registration failure. The account UI now maps that condition to the specific deployment action: configure a valid Neon PostgreSQL `DATABASE_URL` and redeploy with migrations.
