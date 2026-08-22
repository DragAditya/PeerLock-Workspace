---
name: privacy-first-webapp-delivery
description: Build, repair, and release privacy-first full-stack web applications with local-first data, account access, real-time collaboration, secure admin controls, email delivery, diagnostics, mobile UX, validation, and GitHub synchronization. Use when a web project must preserve strict client-data privacy while iterating safely from bug report to deployed release.
---

# Privacy-First Web App Delivery

Use this skill for browser-local or peer-to-peer web apps where server metadata and private content have different trust boundaries.

## Core boundary

Treat document bodies, chat bodies, passwords, password hashes, reset tokens, OTPs, WebRTC transport secrets, database URLs, API keys, and raw provider responses as **non-displayable data**. Do not expose them in diagnostics, admin panels, audit logs, notifications, client state, screenshots, or source control.

Admin functionality may manage account and room **metadata** only. It must not grant visibility into private content.

## Delivery workflow

1. **Frame the request.** State the intended outcome briefly. For material changes, create a phased plan and add concrete unchecked items to the project tracker before implementation.
2. **Read the local architecture.** Inspect the route, service, schema, and style files relevant to the reported behavior. Read mandatory platform and integration skills before using their capabilities.
3. **Find the actual boundary or root cause.** Prefer safe runtime diagnostics, focused tests, logged status codes, and reproduction over speculative UI-only changes.
4. **Implement the smallest durable repair.** Put authorization on the server. Keep private data client-local. Use database migrations only for metadata that the server genuinely needs.
5. **Test at the appropriate layer.** Add focused unit tests for deterministic logic; add server-only integration tests for configured external services and database migrations; use browser checks for responsive flows.
6. **Verify real deployment behavior.** Separate sandbox configuration from production configuration. Do not infer production secrets from local success. Use safe, redacted diagnostics and production logs.
7. **Publish deliberately.** Review the tracker, create a checkpoint only after validation, then push the exact committed state to GitHub. State what was validated and what still requires user action.

## Planning and tracker discipline

- Add new requests to `todo.md` before modifying the app.
- Mark items complete as soon as they are actually validated. Preserve history; do not delete tracker items.
- Before a checkpoint, read the relevant tracker entries and ensure completed work is marked `[x]`.
- If an external service needs user action, keep its item open and ask a focused question instead of treating it as fixed.

## Data model and authorization rules

- Prefer immutable server IDs over visible invite codes for room identity and transport namespaces.
- Store only room registry metadata server-side: IDs, access policy, membership status, timestamps, and safe operational state.
- Derive an administrator role from a server-only configured identity or an explicit server role. Never trust a client role flag.
- Gate every admin procedure on the server; hide the navigation entry for non-admins only as a secondary UX measure.
- For destructive actions, use an explicit confirmation dialog, record a safe audit event, revoke sessions and metadata links, and document that browser-local content cannot be deleted remotely.

## Database and migration procedure

1. Update the typed schema first.
2. Generate and review migration SQL. Reject destructive migration steps unless the user explicitly asked for them and the impact is understood.
3. Ensure migration tooling uses the same database URL as the application. When a platform-managed `DATABASE_URL` is incompatible with the intended PostgreSQL service, use a server-only explicit fallback such as `NEON_DATABASE_URL` consistently in the application and migration configuration.
4. Apply the migration to the intended database only.
5. Add a server-only schema readiness test that queries metadata tables but never document or credential data.

## Account and email delivery procedure

- Enforce password policy on the server and reflect it clearly in the client. Prefer an eight-character minimum with upper, lower, number, and symbol requirements rather than digit-only passwords.
- Keep account error messages actionable and safe. Map duplicate, migration, connectivity, and email-provider failures to user-facing guidance without database stacks.
- Use an opaque session cookie and reject suspended users during both sign-in and session resolution.
- Use a six-digit OTP with a short expiry, attempt limit, and resend cooldown.
- Send HTML **and** text email bodies. Escape dynamic values; use responsive, email-client-safe table layout and inline CSS.
- Before claiming delivery works, run a controlled, user-approved server-only provider test. Do not log keys, recipients, OTPs, or message bodies.
- For Resend, use a verified sender domain for general delivery. A test sender can be restricted to the Resend account owner; explain this precisely rather than reporting a generic failure.

## Diagnostics and operational UX

- Public diagnostics must be intentionally read-only and redacted. Permit high-level runtime, table-readiness, email-configuration, and signaling status; exclude account identities, tokens, cookie names, server paths, secret names when not needed, and all private content.
- Return typed authorization errors without serialized stacks.
- Pair asynchronous actions with local loading state, success/error notifications, and a retry-safe outcome. Never include sensitive content in a toast.
- Add user-visible recovery states for local persistence delays; bounded fallback must not send local content to a server.

## Collaboration and mobile UX

- Test owner/guest room isolation with independent browser contexts. The approved guest must enter the owner’s exact immutable room namespace and receive existing content automatically.
- Make the editor usable before optional room tooling. On narrow screens, keep room consoles collapsed by default after room creation, provide an obvious close control, and avoid overlaying the editor indefinitely.
- Treat empty document and empty title states as valid persistent CRDT states.
- Constrain rich-editor grid columns with `minmax(0, 1fr)`, wrap long text safely, and keep code blocks independently scrollable to prevent horizontal overflow.

## Mobile visual repair loop

Use this procedure when a user supplies screenshots showing clipping, contrast defects, crowded controls, inconsistent light/dark rendering, oversized cards, or poor destructive-action UI.

1. Read the route component, the shared frame/header, and the exact style rules that target the route before editing. Treat screenshots as evidence of a rendered defect, not as a substitute for finding the competing selector or container responsible.
2. Add precise unchecked tracker entries before changing code. Keep the repair route-scoped when possible so a mobile fix does not disturb editor or account flows.
3. Repair hierarchy before decoration. Fix width constraints, `min-width: 0`, grid tracks, clipping, alignment, and tap-target size before adjusting color, shadows, or animation.
4. Define light and dark surfaces together. Every route-level override must explicitly set its background, foreground, muted text, borders, and active states in both themes. Never leave dark mode to inherit a paper-white surface from a light rule.
5. Keep compact header controls visually identical: use one width, height, border radius, gap, icon size, and surface treatment for every visible control at the breakpoint. Retain a distinct active state only where it communicates the current route.
6. For full-width mobile sections, constrain the frame, main area, route root, and content area to the viewport. Give the outer page, main, and route root compatible backgrounds. Use `overflow-x: clip` only at the layout boundary after identifying the overflow source; do not clip editor content or scrollable code blocks.
7. Validate the exact narrow width implicated by the user’s screenshot. If automated access reaches an account gate instead of protected content, state that limitation accurately and combine the route-shell check with source-level constraints and relevant tests.

### Destructive card interactions

- Keep normal card tap behavior separate from deletion. On mobile, make delete discoverable through a deliberate left swipe only; preserve a visible desktop delete affordance.
- Start a swipe only when leftward horizontal travel clearly exceeds vertical travel. Use `touch-action: pan-y`, clamp the reveal distance, and ignore short, vertical, and rightward gestures.
- Reveal a delete rail; never delete at the swipe threshold. A tap on an already revealed card should close the rail rather than navigate.
- Use an accessible confirmation dialog with a concise title, a one-sentence browser-local impact statement, a neutral cancel action, and a clearly destructive delete action. Do not use an unstyled browser confirmation when the product has an accessible dialog component.
- Keep confirmation copy privacy-safe. Explain that deleting local metadata or a local document cannot remotely remove independently stored browser copies held by approved peers.
- Extract gesture thresholds and clamping rules into a small pure utility and cover them with unit tests. Test intentional left swipes, vertical scrolling, threshold boundaries, clamping, cancellation, and no-direct-delete behavior.

### Contrast and containment checklist

| Area | Required check |
| --- | --- |
| Hero rail | Confirm every heading line and supporting sentence is visible at normal opacity in both themes. |
| Navigation grid | Align icon and label in the same track; prevent absolute positioning inherited from desktop styles. |
| Card surface | Verify card, text, metadata, borders, badges, and action rails against the active theme. |
| Header | Verify no control retains a different background, dimensions, or spacing at the active mobile breakpoint. |
| Edge of viewport | Verify that no white gutter, horizontal scroll, or clipped background appears alongside a dark route. |
| Dialog | Verify the overlay, content width, action order, and destructive emphasis on a phone-width viewport. |

## Motion and interaction quality

- Use 120–300ms transform/opacity/color transitions for ordinary feedback. Add press feedback, focus states, loading states, and meaningful success/error confirmation.
- Avoid continuous or decorative motion around text entry and critical actions.
- Gate non-essential animations with `prefers-reduced-motion: no-preference`; retain static affordances for all users.
- Validate mobile layouts after motion changes because fixed panels, transforms, and overflow rules can interact badly.

## Required validation checklist

Run the relevant subset, then run the full suite before release:

```bash
pnpm check
pnpm test
pnpm build
```

Also perform applicable checks:

- Server-only connection, schema, and configured provider tests.
- An explicit, user-approved delivery test when changing email sender configuration.
- Authenticated and unauthenticated procedure checks for access boundaries.
- Independent browser room convergence checks for collaboration changes.
- Phone-width visual checks for account, document, diagnostics, and overlay changes.
- Production log inspection and redacted public diagnostics checks when fixing live-only failures.
- For mobile UI repairs, add or update deterministic tests for any gesture, threshold, or state-transition logic. Run type checking, the relevant test subset, the full suite, and a production build. If a configured external integration times out while all application tests pass, retry only that integration with an appropriate bounded timeout and report it as an environment-latency event rather than hiding the original outcome.

## Release handoff

- Explain the exact root cause in simple language.
- State the validation outcome and any deliberate test skips.
- Attach the checkpoint only after it is safe to review.
- Push the same state to GitHub and confirm the remote branch.
- If the user must verify a DNS sender, configure a credential, or redeploy an external host, state one short next action and do not claim that portion is complete.
