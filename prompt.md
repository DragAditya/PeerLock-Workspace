# Build Prompt: Peerlock — Local-First P2P Encrypted Workspace

Build a complete **local-first, peer-to-peer encrypted collaborative workspace** for small groups. Focus on robust functionality, privacy boundaries, offline behavior, and technically accurate collaboration. Do **not** copy or prescribe any existing visual design; choose the user interface independently.

## Product Goal

Create a browser-based collaborative rich-text editor for up to ten people. Users should be able to write alone while offline, share a document through a private invite, and edit it concurrently with peers without sending document content to the application’s own server.

The application server may serve the frontend and provide ordinary application infrastructure, but it must not store, process, index, or expose document bodies, Yjs updates, editor exports, chat content, or room secrets. A signaling service may be used only to establish WebRTC connections.

## Core Technical Architecture

Use a modern React and TypeScript frontend. Use **Yjs** as the CRDT layer, **Tiptap** as the rich-text editor, **y-indexeddb** for browser-local persistence, and **y-webrtc** for direct peer synchronization. Use an IndexedDB wrapper such as `idb` for the application’s local document registry.

The document content model must live in a Yjs `Y.Doc`. Tiptap should bind to a Yjs XML fragment through the collaboration extension. Each document must have one stable local document ID and a separate IndexedDB persistence namespace so local edits survive refreshes, browser restarts, network loss, and delayed reconnection.

Use a small peer-mesh room model. Explicitly target a maximum of ten participants, which means no more than nine direct remote peers per participant. Display current connected peers and clear connection state such as local-only, restoring, waiting for peers, synchronized, offline, and error.

## Private Rooms and Invites

Allow users to create a local document, create a private peer room from it, or join an existing room.

Generate:

- An eight-character non-ambiguous room code using uppercase letters and digits that avoid easily confused characters.
- A cryptographically random 256-bit room secret.
- A concise invite URL using the form `https://your-app/r/ROOMCODE#SECRET`.

Keep the secret in the URL fragment, not the path or query string, because fragments are not sent in the HTTP request. Derive an opaque WebRTC room name from the room code and secret using SHA-256 in the browser. Supply the room secret as the `y-webrtc` password. Do not use the human room code as the signaling-room identifier.

Support legacy invite parsing only if needed for migration. Joining a room must create or reopen the matching local document without uploading its content to the application server.

## Encryption and Honest Privacy Boundaries

Communicate privacy clearly but accurately:

> Document content is persisted in the browser and synchronized directly with peers through encrypted WebRTC data channels. The application server does not receive document bodies.

Do not claim that all metadata disappears. Document that signaling, STUN/TURN, and network infrastructure may observe connection timing or network metadata. Document that IndexedDB is local browser persistence, not an application-managed encrypted vault, and that a compromised device or leaked invite secret can expose local content.

Keep the application’s backend out of the document-content, export, Yjs update, chat-message, and room-secret storage paths.

## Required User Features

### Local Profile and Presence

Require a user to create a local profile before creating or editing documents. The profile contains a username and a color. Store it only in browser storage. Use it in peer awareness, room chat, and cursor identity.

Provide a profile settings area where the username and color can be changed locally.

### Document Management

Store document metadata in IndexedDB. Users must be able to:

- Create local documents.
- List local documents ordered by last update.
- Rename documents.
- Delete documents from the local registry.
- Convert an existing local document into a private peer room.
- View whether a document is local-only or attached to a private room.

Document metadata should include at least ID, title, creation time, update time, optional room code, optional room secret, and a per-document external-AI privacy policy.

### Rich-Text Technical Editor

Use Tiptap with Yjs collaboration. Provide standard editing features such as headings, bold, italics, strike-through, quotes, numbered and bullet lists, inline code, undo, and redo.

Support Markdown-style input shortcuts for headings, lists, quotes, and fenced code blocks. Add syntax-highlighted code blocks through Tiptap’s lowlight code-block extension. Use local syntax highlighting only.

Support browser-only automatic formatting. It should transform common plain-text technical conventions into structured editor content, including headings, unordered lists, ordered lists, quotes, horizontal rules, and fenced code blocks. This feature must remain available even if AI processing is disabled.

### Remote Cursor Behavior

Use Yjs awareness and collaboration caret support. Remote cursors must be unobtrusive:

- Show a slim blinking caret in the peer’s selected color.
- Do not show a large colored selection highlight.
- Do not render persistent large name labels inside the text.
- Keep peer identity available in the separate presence panel instead.

### Presence and Peer Topology

Show connected participants in a presence panel with initials, names, selected colors, and active state. Render a lightweight graph of the local peer and direct remote peer connections. Clearly state the supported room limit and warn when the room is at or above capacity.

### Room Chat

Implement room chat using a Yjs array in the same Yjs document. Do not create a server-side chat database or chat API.

Each chat message should include a unique ID, local author ID, author name, author color, body, timestamp, and optional mentioned peer IDs. Normalize incoming shared data defensively and discard malformed values so a legacy or invalid Yjs value cannot crash the interface.

Include:

- Real-time replicated messages.
- Local timestamps.
- Mention chips for currently active peers.
- Emoji reactions replicated through a separate Yjs array.
- Safe reaction toggling per user, message, and emoji.
- Empty state and local-only state.

### Export

Allow the user to export the current document entirely in the browser as `.txt` and `.md`. Do not upload the document to generate exports.

## AI Formatting with Explicit Consent

Add optional Gemini-backed formatting only if a server-side Gemini credential is configured. The browser must never receive the credential.

Implement a server-side request boundary that accepts plain document text, a formatting instruction, explicit user consent, and the document’s external-AI policy. The request must be rejected before calling Gemini when:

- The document policy disables external AI.
- Consent is absent.
- Document text is empty or too large.
- The service credential is unavailable.

The UI must explain that AI formatting sends selected document text to the configured Gemini service. Require an explicit user action before the request. Show loading, failure, service-unavailable, timeout, cancellation, preview, and apply states. Do not overwrite the editor immediately; show formatted output first and apply it only after user confirmation.

Add a persistent per-document control named clearly, for example **“Disable external AI for this sensitive document.”** When enabled, Gemini formatting must be unavailable in the editor and blocked again by the server request boundary. Browser-only automatic formatting must remain usable.

## Academic Content

Include in-app pages suitable for an MCA project submission:

- A technical report explaining local-first architecture, CRDT theory, Yjs, WebRTC signaling, encryption boundaries, IndexedDB persistence, limitations, and future work.
- A presentation preparation page with a recommended slide sequence, architecture explanation, demo steps, and talking points.
- A viva preparation page with likely questions and technically accurate answers.

Use real references to official Yjs, y-webrtc, y-indexeddb, and Tiptap documentation. Do not fabricate benchmark numbers, security guarantees, or citations.

## Quality and Safety Requirements

Use TypeScript end to end. Create unit tests for:

- Room-code and secret generation.
- Compact invite parsing.
- Document metadata and per-document AI policy persistence.
- Browser-only formatting helper behavior.
- Export conversion.
- Chat-message and chat-reaction normalization.
- Room-capacity logic.
- Privacy copy and server rejection of external-AI requests for protected documents.

Run type checking, unit tests, and a production build before delivery. Test both desktop and mobile behavior. Never hardcode fake user reviews, ratings, testimonials, or fabricated usage metrics.

## Deliverables

Deliver the working application, a concise architecture document, the in-app academic report/presentation/viva pages, test coverage, and setup instructions. Describe the privacy model precisely: the product is document-content-serverless, not infrastructure-free.
