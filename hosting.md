# Hosting Peerlock

## Deployment decision

Peerlock is a **single Node.js web service**, not a static website. Its Node server serves the React app, tRPC API, room-event stream, database-backed room metadata, and an in-memory WebSocket signaling relay at `/api/peerlock-signaling`.

| Platform | Suitability for the current code | Recommendation |
| --- | --- | --- |
| **Render Web Service** | Full support for the single long-running Node process and same-origin WebSocket upgrade path. | **Recommended production host.** |
| **Vercel** | Express and WebSockets are supported, but WebSockets are Beta and connections may reach different function instances. The current signaling relay deliberately keeps topic membership only in process memory. | Use for evaluation or after adding a shared pub/sub layer; do not use the current single-memory relay for multi-instance production rooms. |
| Manus built-in hosting | Already configured for this project. | Suitable when you want managed deployment and custom-domain controls inside Manus. |

> **Privacy boundary:** no provider configuration should add document-body storage, Yjs update persistence, or chat persistence to the server. The Neon PostgreSQL database is only for rooms, password hashes, guest sessions, and approvals.

## 1. Before deploying

Use Node.js **22.x** and pnpm **10.x**, then test the exact release locally.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm start
```

The production commands are already defined in `package.json`.

| Command | Purpose |
| --- | --- |
| `pnpm build` | Builds the Vite client into `dist/public` and bundles the Node server into `dist/index.js`. |
| `pnpm start` | Starts the combined production Node service. It reads the host-provided `PORT`; do not hard-code a port. |
| `pnpm drizzle-kit migrate` | Applies the committed Neon PostgreSQL migrations. Use this for production databases. |

## 2. Create the database

Create a Neon PostgreSQL database, preferably in a region close to the Node service. In Neon, open **Connect**, copy the pooled PostgreSQL connection string, and add it as `DATABASE_URL`.

```text
postgresql://USERNAME:PASSWORD@HOST/DATABASE?sslmode=require
```

Then apply the project schema once from a trusted local or CI environment:

```bash
DATABASE_URL='postgresql://…?sslmode=require' pnpm drizzle-kit migrate
```

The schema creates room metadata and membership tables. It must never be extended with document text, Yjs state, chat messages, or AI request bodies.

## 3. Environment variables

Copy `.env.example` for local development. In a hosting dashboard, add secrets through its secret-management UI; never commit a populated `.env` file.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection used only for room registry and approval metadata. |
| `JWT_SECRET` | Yes | Template session infrastructure secret. Use a long cryptographically random value. |
| `GEMINI_API_KEY` | No | Enables the consent-gated Gemini formatting actions. Leave empty to disable AI safely. |
| `NODE_ENV` | Yes in production | Set to `production`. |
| `PORT` | Host-managed | Do not set unless your provider explicitly requires it; Peerlock reads it automatically. |
| `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID` | Optional | Required only if you retain the template OAuth integration. Peerlock collaboration itself remains guest-first. |

## 4. Deploy on Render — recommended

Render supports Node/Express web services and lets you connect a GitHub repository, choose a build command, a start command, and environment variables.[1]

### Dashboard deployment

1. Push this repository to GitHub.
2. In Render, choose **New → Web Service** and connect the GitHub repository.
3. Use the following configuration.

| Render setting | Value |
| --- | --- |
| Runtime | `Node` |
| Build command | `pnpm install --frozen-lockfile && pnpm build && pnpm drizzle-kit migrate` |
| Start command | `pnpm start` |
| Health check path | `/` |
| Node version | `22.x` |
| Region | Same region as the database, where possible |

4. Add the environment variables from the preceding table.
5. Apply the database migration once.
6. Deploy, then open the Render URL using **two separate browser profiles** to test Main ID and Fake ID room approval.

### Blueprint deployment

The repository includes `render.yaml`. Render can use this Blueprint to prefill the service definition. Its ordinary build command applies `pnpm drizzle-kit migrate` after the application build, so the metadata-only room-registry schema is created without Render Shell access. You must still supply `DATABASE_URL` and, if wanted, `GEMINI_API_KEY` as protected values.

### Fixing `Failed query: insert into peerlock_guest_sessions`

This error means Render can reach the configured database but the Peerlock tables have not yet been migrated. It is **not** a document-sync or password error. The missing tables are `peerlock_guest_sessions`, `peerlock_rooms`, and `peerlock_room_memberships`.

1. Open the Render service and confirm that `DATABASE_URL` is set to the intended Neon PostgreSQL database.
2. Set the **Build Command** to:

   ```bash
   pnpm install --frozen-lockfile && pnpm build && pnpm drizzle-kit migrate
   ```

3. Keep the **Start Command** as `pnpm start`.
4. Click **Manual Deploy → Clear build cache & deploy**.
5. Create a **new** local document and create a room again. The failed document remains local in the browser; it can be reopened, but a newly created document makes the result easiest to verify.

After updating from this repository revision, new Render Blueprint deployments use the same build command automatically. Do not use `pnpm db:push` as a Render startup command because it regenerates migration files; production should apply the committed migrations with `pnpm drizzle-kit migrate`.

### Render verification checklist

| Check | Expected result |
| --- | --- |
| `GET /` | Guest entry screen loads over HTTPS. |
| Create open room | Main ID receives one eight-character room code. |
| Join from a new browser profile | Fake ID waits for approval. |
| Approve | Fake ID opens the canonical room document and sees Main ID’s text automatically. |
| WebSocket | Browser DevTools shows a successful `wss://YOUR-DOMAIN/api/peerlock-signaling` connection. |
| AI disabled | Documents still edit and sync normally when `GEMINI_API_KEY` is absent. |

## 5. Vercel deployment — compatible with caveats

Vercel currently supports Express applications as a single Vercel Function and offers WebSockets in Beta.[2] [3] A WebSocket stays pinned to the function instance that accepted it, but newly opened connections can land on another instance. Vercel therefore recommends external shared state for room or pub/sub coordination across instances.[3]

Peerlock’s current signaling relay is intentionally **memory-only**: it does not store document content and keeps the active opaque room topics inside one Node process. This is ideal for a single Render Web Service. It is not a safe multi-instance design for Vercel without shared ephemeral pub/sub.

### What works on Vercel today

| Feature | Current status |
| --- | --- |
| Static Vite frontend | Compatible after a Vercel-specific build/output setup. |
| Express/tRPC API | Compatible as an Express function. |
| Guest room metadata and approvals | Compatible with an externally reachable Neon PostgreSQL database. |
| Multi-peer WebRTC signaling | Requires a Vercel adapter plus external ephemeral pub/sub (for example, Redis) so topic membership is shared across function instances. |

### Safe Vercel path

1. Deploy the frontend/API to Vercel only after adding a Vercel Express adapter and copying the built client assets to `public/**`; Vercel documents that `express.static()` is ignored and static files must use `public/**`.[2]
2. Move the signaling topic map from process memory to an ephemeral shared pub/sub service. Do **not** place document contents in that service.
3. Configure a WebSocket duration and reconnect strategy consistent with Vercel’s function limits, since connections close at the maximum duration.[3]
4. Keep the Vercel frontend and the signaling/API service on the same HTTPS origin, or explicitly configure cookies, CORS, WebSocket origin controls, and callback URLs.

Until those Vercel-specific changes are made, deploy the complete current application to **Render**. This avoids silent multi-instance room splits and gives Main ID and Fake ID one shared signaling process.

## 6. Domains, HTTPS, and cookies

Use the hosting provider’s HTTPS domain or connect a custom domain before testing rooms. Peerlock determines secure cookie behavior from HTTPS and uses same-origin browser requests for tRPC, server-sent room events, and WebSocket signaling.

Avoid splitting the client, API, and signaling relay across unrelated domains unless you deliberately update cookie and CORS policy. A single origin is the simplest and safest deployment.

## 7. Troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Fake ID stays on “Your request is with the owner” | Database/approval connectivity issue or owner did not approve. | Check service logs and verify the Neon `DATABASE_URL`; test a fresh room. |
| Fake ID opens but sees no Main ID text | WebSocket upgrade path is blocked or peers are on different signaling instances. | Check `/api/peerlock-signaling`; use a single Render Web Service for the current build. |
| AI says unavailable | `GEMINI_API_KEY` is unset or invalid. | Add it as a protected host secret; AI is optional. |
| App cannot connect to database | Incorrect URL, IP allow-list, TLS, or database region issue. | Validate the connection string and network allow-list using the provider’s database instructions. |
| Local browser document does not load | Browser IndexedDB is blocked or cleared. | Open the workspace root and create/open the local document again; the server cannot restore document content by design. |

## References

[1]: https://render.com/docs/deploy-node-express-app "Render: Deploy a Node Express App"
[2]: https://vercel.com/docs/frameworks/backend/express "Vercel: Express on Vercel"
[3]: https://vercel.com/docs/functions/websockets "Vercel: WebSockets"
