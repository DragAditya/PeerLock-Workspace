# Peerlock — P2P Encrypted Workspace

Peerlock is a **guest-first, local-first collaborative editor** for small teams of up to ten people. It combines Yjs CRDTs, IndexedDB persistence, and encrypted WebRTC peer synchronization so document bodies and room chat are not stored by the application server.

> The server stores only room metadata, password hashes where used, approval state, and temporary WebRTC signaling messages. It does **not** store document text, Yjs updates, or room-chat messages.

## Features

| Area | Included capability |
| --- | --- |
| Private writing | Tiptap rich-text editor with Markdown shortcuts, lists, quotes, and syntax-highlighted code blocks. |
| Local-first data | Browser-local document registry and Yjs IndexedDB replicas. |
| Collaboration | Server-verified room codes, optional passwords, owner approval, encrypted WebRTC peer sync, cursors, presence, and replicated chat. |
| Reliability | Canonical server UUID room identity, deterministic guest room mapping, bounded IndexedDB recovery, and a project-owned memory-only signaling relay. |
| AI assistance | Consent-gated Gemini document and selected-text formatting, with a per-document privacy switch. |
| College support | In-app report, presentation guide, and viva preparation content. |

## Quick start

```bash
pnpm install --frozen-lockfile
# Create your own untracked .env from the variable list in environment.example.md.
# Set DATABASE_URL and JWT_SECRET. GEMINI_API_KEY is optional.
pnpm dev
```

Open `http://localhost:3000` in two separate browser profiles. Create a room in the first profile, share the short link, request access in the second profile, and approve the request in the first profile.

## Quality checks

```bash
pnpm check
pnpm test
pnpm build
node scripts/document-startup.mjs
node scripts/room-convergence.mjs
```

`hosting.md` contains complete deployment guidance for Render and a careful Vercel compatibility note.

## Repository safety

Never commit `.env` files, database credentials, Gemini keys, cookies, or exported private documents. The included `.gitignore` excludes common secrets, generated bundles, local logs, and browser-development artifacts.

## License

This capstone project is published without a license file by default. Add a license appropriate to your intended reuse policy before accepting external contributions.
