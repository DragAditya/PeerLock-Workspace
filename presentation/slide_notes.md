# 1 - Peer-to-Peer Encrypted Workspace

Welcome to the presentation of our peer-to-peer encrypted workspace. We built a local-first collaborative editor designed for small groups where document content never touches an application server. Throughout this overview, we focus on distributed systems, conflict-free synchronization, offline-first design, and practical privacy engineering. The core takeaway is simple: the server helps browsers meet, but it does not own the document. Let us look closely at why we chose this architecture.

# 2 - Problem and Motivation

Centralized editors offer undeniable convenience, but they create a single central point for document processing and storage. We asked whether a small group can edit the same document concurrently while keeping the entire document state safely inside their browsers. Notice that we are not eliminating all infrastructure, because signaling is still needed for WebRTC connection establishment. The real achievement here is keeping document content completely out of the application server data path. And to understand how this works in practice, let us examine the system architecture and its trust boundaries.

# 3 - Architecture and Trust Boundary

Every participant runs an independent browser replica containing our rich-text editor, CRDT state, and local persistence. After initial discovery through an ephemeral signaling relay, peers establish direct encrypted WebRTC channels to exchange document updates. The critical boundary here is that the application host serves only the interface, while the signaling relay never sees a document body or edit history. That setup gives us direct transport between peers, though network infrastructure can still observe connection metadata. Now that you see how the communication flows, let us examine the mathematics of how these edits merge without conflicts.

# 4 - CRDT Theory: Conflict-Free Collaboration

Yjs uses conflict-free replicated data types so multiple replicas can make valid edits independently and later merge them deterministically. We do not rely on a central last-writer-wins operation for ordinary text collaboration. When two users edit different parts of a document while offline, both updates are stored locally and merge cleanly after reconnection instead of overwriting each other. This means offline work remains a valid input to later synchronization. Let us see how this local-first model behaves when the network drops entirely.

# 5 - Offline-First Workflow

Offline editing is completely normal in our system because the browser owns its local state first. When you open a document, Yjs restores the state directly from IndexedDB before any network sync happens. If you lose connection, you keep typing and your updates remain safely persisted in the browser. Once you reconnect, the system discovers peers and exchanges missing updates so all reachable replicas converge. The network is simply there to replicate your work, not to make typing possible in the first place.

# 6 - Privacy and Security Model

Let us be precise about what this privacy model protects and where its limits lie. Building on our offline architecture, we establish that document text and updates never touch the application server data path. But we must be honest about our constraints. WebRTC and network infrastructure can still expose connection metadata, and anyone with the complete invite secret can access the room. This isn't about claiming absolute anonymity or unbreakable endpoint security. It is about a clear trust boundary where the server's role is strictly limited to signaling discovery.

# 7 - Implemented Application Features

Moving from our security guarantees to our functional implementation, we can look at the delivered capability map. The application combines a local document vault backed by IndexedDB with a rich-text Tiptap editor and real-time Yjs collaboration. We have distinct peer awareness cursors, a live connection graph, and browser-only markdown exports. Following our offline-first flow, you start by writing alone in your local browser vault. Collaboration happens as an explicit action that adds a peer room without altering your document's storage boundary.

# 8 - Live Demonstration Plan

Instead of just walking through static architecture diagrams, let us prove this design in two live browser profiles. Start by creating a local document in the vault and verifying it sits in IndexedDB. Next, convert that document into a private room and copy the generated invite link. Open that invite in your second browser profile to watch the encrypted peer connection and presence cursors appear. Type concurrently in both windows to show automatic CRDT merge without manual conflicts. Finally, take one participant offline, make local edits, and reconnect to observe convergence.

# 9 - Evaluation, Constraints, and Future Work

When we evaluate this system, we must treat its constraints as a deliberate part of the design. Supporting up to ten participants keeps the peer mesh connection workload manageable for ordinary browsers. Our validation covers TypeScript contracts, Vitest suites for room codes and exports, and cross-device visual checks. We acknowledge the real trade-offs here. Without a trusted central authority, we cannot enforce global revocation or unlimited scaling. The goal is a functional local-first tool for small groups, backed by transparent engineering limits rather than inflated benchmarks.

# 10 - Conclusion

To conclude our discussion, this project proves that collaborative editing can be built effectively as a distributed browser application. By combining Yjs for replica convergence, WebRTC for direct encrypted transport, and IndexedDB for local persistence, we deliver a practical, privacy-first MCA capstone. We have established a transparent trust model where the application server is kept entirely outside the document content path. To leave you with our final core takeaway: the server helps browsers meet, but it does not own your document.
