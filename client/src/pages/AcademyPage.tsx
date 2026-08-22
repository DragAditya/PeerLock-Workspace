import { AppFrame } from "@/app/AppFrame";
import { ProfileGate } from "@/app/ProfileGate";
import { BookOpen, CheckCircle2, ClipboardCheck, FileText, GraduationCap, Lightbulb, MicVocal, Network, Presentation, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocation, useRoute } from "wouter";

const tabs = ["overview", "architecture", "report", "presentation", "viva", "checklist"] as const;
type SectionKey = typeof tabs[number];

type LearningBlock = {
  title: string;
  text: string;
  bullets?: string[];
  note?: string;
};

type LearningSection = {
  label: string;
  title: string;
  lead: string;
  icon: LucideIcon;
  metric: string;
  metricLabel: string;
  blocks: LearningBlock[];
};

const content: Record<SectionKey, LearningSection> = {
  overview: {
    label: "Study map", title: "Understand the system, not just the screens.", lead: "Use this kit to turn your working PeerLock build into a clear MCA explanation, a credible report, and a confident project demonstration.", icon: GraduationCap, metric: "06", metricLabel: "guided modules", blocks: [
      { title: "What PeerLock proves", text: "PeerLock demonstrates a local-first collaborative editor. The browser keeps a durable local replica, while approved peers exchange document updates directly through WebRTC data channels.", bullets: ["Local-first persistence with IndexedDB", "Conflict-free convergence with Yjs CRDTs", "Peer-to-peer synchronization over WebRTC", "Server-held metadata only; not document bodies or chat text"] },
      { title: "A simple study route", text: "Start with the architecture module, then use the report outline to write your chapters. Rehearse the presentation flow before using the viva prompts for rapid questions.", note: "Tip: show a browser-local note first, then a shared room. The contrast makes the privacy boundary easy to explain." },
      { title: "Use precise language", text: "Do not call the project ‘serverless’ or claim that it eliminates all risk. PeerLock uses server-verifiable room and account metadata plus signaling infrastructure, while keeping document content out of the application server." },
    ],
  },
  architecture: {
    label: "System design", title: "Follow one edit from keyboard to peer.", lead: "This is the technical path behind a collaboration event. Explain each boundary exactly: what remains local, what is synchronized, and what the service is allowed to know.", icon: Network, metric: "04", metricLabel: "system layers", blocks: [
      { title: "1. Editor and CRDT layer", text: "Tiptap turns user actions into structured rich-text operations. Yjs represents that state as a CRDT, so independent browser replicas can merge valid concurrent changes without a central ordering authority.", bullets: ["Edits may happen while offline", "Yjs updates converge when replicas reconnect", "Formatting, chat, and awareness remain peer-replicated state"] },
      { title: "2. Local persistence layer", text: "IndexedDB stores the browser’s local document replica. A refresh or temporary network failure should not remove local work; startup recovery hydrates the local state before collaborative networking begins." },
      { title: "3. Peer synchronization layer", text: "After an approved room is opened, Yjs updates move through encrypted WebRTC data channels. The room’s canonical server-issued identity keeps approved peers in the same collaboration namespace." },
      { title: "4. Service boundary", text: "The service verifies accounts, room codes, passwords, membership, and approval state. It does not receive document bodies, room chat, password values, reset tokens, or WebRTC transport secrets.", note: "Important limitation: signaling and connection infrastructure can still observe timing and network metadata. A compromised endpoint is outside transport encryption’s protection." },
    ],
  },
  report: {
    label: "Written submission", title: "A report structure that explains the engineering.", lead: "Use this outline as a high-information starting point. Add your institution’s required front matter, diagrams, testing evidence, and references in its prescribed format.", icon: FileText, metric: "08", metricLabel: "report chapters", blocks: [
      { title: "1–2. Introduction and problem statement", text: "Explain the problem with centralized collaborative editors: document processing depends on a cloud service. State the PeerLock objective: preserve local editing while letting small approved groups synchronize directly." },
      { title: "3. Requirements and constraints", text: "List functional requirements: rich editing, offline resilience, short room codes, owner approval, password-protected rooms, ten-peer cap, shared chat, and export. List non-functional constraints: privacy, latency, mobile usability, recoverability, and accessibility." },
      { title: "4–5. Architecture and implementation", text: "Include a component diagram for React/Tiptap, Yjs, IndexedDB, WebRTC, metadata APIs, and signaling. Then explain the room UUID, public code, password verification, membership approval, and canonical sync namespace." },
      { title: "6–8. Testing, limitations, and conclusion", text: "Document your multi-browser sync tests, incorrect-password denial, duplicate-room prevention, empty-document persistence, mobile checks, and recovery paths. End with limitations: endpoint compromise, metadata exposure, direct-mesh scaling, and browser storage dependency." },
    ],
  },
  presentation: {
    label: "Project demonstration", title: "Tell the story in a clean seven-minute run.", lead: "A short demonstration works best when every click proves a technical claim. Avoid narrating every feature; show a few high-value flows and name the engineering reason behind each one.", icon: Presentation, metric: "07", metricLabel: "demo beats", blocks: [
      { title: "Open with the problem", text: "State the contrast: traditional collaboration sends edits to a central service; PeerLock keeps the document replica inside each participant’s browser and synchronizes approved peers directly." },
      { title: "Demonstrate the local-first path", text: "Create a private note, write a short paragraph, refresh, and show it returning from browser-local persistence. Explain that the application server has not received the text." },
      { title: "Demonstrate the trusted-room path", text: "Create a room, share the short code, approve a second account, and show the second browser opening the same document with existing text. Then make a live edit from each side." },
      { title: "Close with boundaries", text: "Show privacy indicators and state what remains outside the document server: document bodies and room chat. Also name the limitations honestly, including endpoint security and network metadata." },
    ],
  },
  viva: {
    label: "Oral defence", title: "Answer the hard questions accurately.", lead: "Practice short answers first. Then add one example from the live product so your explanation is grounded in the build rather than only theory.", icon: MicVocal, metric: "10", metricLabel: "key prompts", blocks: [
      { title: "Why use a CRDT?", text: "A CRDT lets separate replicas accept valid edits independently and merge them deterministically later. This is useful when peers disconnect, reconnect, or type at the same time." },
      { title: "Is WebRTC alone enough?", text: "No. Peers need a signaling path to discover and negotiate connections. PeerLock constrains that service to metadata and connection setup rather than using it as a document store." },
      { title: "How are protected rooms enforced?", text: "A password-protected room does not grant a join request from a code alone. The server verifies the password and authorization state before the user receives the canonical room access needed to synchronize." },
      { title: "Why limit a room to ten peers?", text: "A direct peer mesh increases connections per browser as the group grows. The cap keeps resource use and debugging practical for a collaborative capstone demonstration." },
      { title: "What does encryption not solve?", text: "Encryption does not protect a compromised device, a leaked room secret, or all forms of timing and network metadata. Privacy claims must be scoped to document content and the stated trust boundary." },
    ],
  },
  checklist: {
    label: "Before submission", title: "A practical evidence checklist.", lead: "Use this page before your review or viva. Every item should be backed by a live check, a test result, a screenshot, or a documented limitation—not only a statement in the report.", icon: ClipboardCheck, metric: "12", metricLabel: "evidence checks", blocks: [
      { title: "Architecture evidence", text: "Prepare one diagram and one concise explanation for local persistence, CRDT convergence, peer synchronization, and server metadata boundaries.", bullets: ["Browser-local document persistence works after refresh", "Two approved peers converge on the same room document", "Incorrect room codes and passwords are denied", "The public code and internal room identity are not interchangeable"] },
      { title: "Privacy and security evidence", text: "Show the user-facing privacy language and explain the concrete server exclusions. Never demonstrate with real passwords, OTPs, reset links, or private document content in public material.", bullets: ["Accounts and owner approval are verified server-side", "Documents and chat are not exposed by diagnostics or admin APIs", "External AI can be disabled per document", "Account and room metadata are separated from document content"] },
      { title: "Quality evidence", text: "Capture desktop and mobile screens, include relevant test totals, and list known limitations honestly. A precise limitation is stronger than an unrealistic security promise.", note: "Final reminder: cite the official Yjs, y-webrtc, y-indexeddb, Tiptap, React, and WebRTC documentation used in the report." },
    ],
  },
};

const tabMeta: Array<{ key: SectionKey; label: string; icon: LucideIcon }> = [
  { key: "overview", label: "Study map", icon: BookOpen }, { key: "architecture", label: "Architecture", icon: Network }, { key: "report", label: "Report guide", icon: FileText }, { key: "presentation", label: "Demo run", icon: Presentation }, { key: "viva", label: "Viva practice", icon: MicVocal }, { key: "checklist", label: "Evidence checklist", icon: ClipboardCheck },
];

export function AcademyPage() {
  const [, params] = useRoute("/academy/:section?");
  const [, navigate] = useLocation();
  const section = tabs.includes(params?.section as SectionKey) ? params!.section as SectionKey : "overview";
  const current = content[section];
  const CurrentIcon = current.icon;
  return <ProfileGate><AppFrame><div className="academy-page academy-expanded">
    <aside className="academy-rail"><div className="academy-rail-mark"><BookOpen size={18} /></div><p className="eyebrow">PeerLock learning kit</p><h1>Make the system<br /><span>understandable.</span></h1><p className="academy-rail-copy">A structured study companion for your MCA report, live demonstration, and viva preparation.</p><nav aria-label="Learning Kit sections">{tabMeta.map(tab => { const Icon = tab.icon; return <button className={tab.key === section ? "active" : ""} onClick={() => navigate(`/academy/${tab.key}`)} key={tab.key}><Icon size={16} /><span>{tab.label}</span><b>→</b></button>; })}</nav><div className="academy-rail-foot"><ShieldCheck size={15} /><span>Technical facts, stated with privacy boundaries intact.</span></div></aside>
    <article className="academy-content"><header><div className="academy-section-icon"><CurrentIcon size={22} /></div><div><p className="eyebrow">{current.label}</p><h2>{current.title}</h2></div><div className="academy-metric"><b>{current.metric}</b><span>{current.metricLabel}</span></div></header><p className="academy-lead">{current.lead}</p><div className="academy-blocks">{current.blocks.map((block, index) => <section key={block.title}><span className="academy-block-index">{String(index + 1).padStart(2, "0")}</span><div><h3>{block.title}</h3><p>{block.text}</p>{block.bullets && <ul>{block.bullets.map(bullet => <li key={bullet}><CheckCircle2 size={14} />{bullet}</li>)}</ul>}{block.note && <aside><Lightbulb size={15} /><span>{block.note}</span></aside>}</div></section>)}</div><footer><ShieldCheck size={16} />Use official documentation for citations: Yjs, y-indexeddb, y-webrtc, Tiptap, React, and WebRTC.</footer></article>
  </div></AppFrame></ProfileGate>;
}
