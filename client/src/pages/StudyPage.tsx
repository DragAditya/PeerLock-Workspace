import { AppShell } from "@/components/AppShell";
import { CheckCircle2, ClipboardList, Lightbulb, MessageCircleQuestion, Presentation, Quote, ShieldCheck } from "lucide-react";

const slides = [
  ["01", "Problem / motivation", "Centralised editors commonly process and retain document data remotely. Peerlock narrows this trust boundary for small teams."],
  ["02", "System topology", "Introduce browser replicas, IndexedDB, encrypted WebRTC channels, and a signaling relay outside the document-content path."],
  ["03", "CRDT convergence", "Explain how independent replicas merge concurrent and offline work without a central ordering authority."],
  ["04", "Offline protocol", "Disable network, make a local edit, restore connectivity, and show the replica converge with a peer."],
  ["05", "Privacy boundary", "State the precise guarantee and the remaining metadata and endpoint limitations."],
  ["06", "Live implementation", "Host a room, join from another browser, write concurrently, inspect presence, and export Markdown."],
  ["07", "Evaluation / scope", "Discuss the ten-peer target, mesh trade-offs, signaling dependency, and next research steps."],
];

const questions = [
  ["Why use a CRDT instead of operational transformation?", "CRDT replicas can merge independent offline edits without a central ordering authority, which fits a local-first peer topology."],
  ["Is this entirely serverless?", "No. WebRTC often uses signaling to exchange connection information. The design excludes the signaling path from document storage and editing."],
  ["How is document content protected?", "Updates travel through encrypted WebRTC data channels. The y-webrtc room secret also protects signaling communication; the application server does not receive document content."],
  ["What happens during conflicting offline work?", "Each replica preserves local CRDT updates. On reconnection, Yjs exchanges and deterministically merges them into one convergent state."],
  ["What are IndexedDB limitations?", "It is browser-local persistence, not an application-managed encrypted vault. Device and browser-profile security still matter."],
  ["Why limit a room to ten users?", "A peer mesh increases connection and bandwidth work per browser. The limit keeps the direct collaboration model practical for this project."],
];

const demoSteps = ["Open the vault and explain that document metadata stays in the browser.", "Host a room and show the short code plus fragment-bound secret.", "Open the invite in a second browser profile or device.", "Type concurrently and observe coloured peer carets and presence.", "Toggle offline, make a local edit, then reconnect.", "Export Markdown and open the academic report route."];

export default function StudyPage() {
  return <AppShell><main className="briefing-deck mx-auto max-w-6xl pb-12"><header className="briefing-head"><span>03 / DEFENCE BRIEFING</span><div><h1>Explain the<br /><em>system.</em></h1><p>A structured narrative for your project presentation, live demonstration, and technical viva. Lead with the trust boundary, then show the working peer mesh.</p></div><div className="briefing-stamp"><Presentation className="h-5 w-5" /><b>07</b><small>SLIDES<br />READY</small></div></header>
    <section className="briefing-architecture"><div className="briefing-arch-grid" aria-hidden="true"><span>LOCAL</span><i /><span>PEER</span><i /><span>PEER</span><i /><span>SIGNAL</span></div><div className="briefing-arch-copy"><p className="control-label">CORE TALKING POINT</p><h2>Start with the replica—not the relay.</h2><p>Each browser owns a Yjs replica and persists it in IndexedDB. A relay assists discovery, but content never becomes an application-server record. After setup, CRDT updates move across encrypted WebRTC data channels.</p><blockquote>Speaker cue: point to the local replica first, then the peer links, then state the privacy boundary in one sentence.</blockquote></div></section>
    <section className="briefing-track"><div className="briefing-section-head"><span>01 / PRESENTATION RUN</span><p>Seven concise slides for a 7–10 minute defence.</p></div><div className="briefing-slide-list">{slides.map(([number, title, note]) => <article key={number} className="briefing-slide"><span>{number}</span><h3>{title}</h3><p>{note}</p><Presentation className="h-4 w-4" /></article>)}</div></section>
    <section className="briefing-duo"><article className="briefing-protocol"><div className="control-block-head"><span><Lightbulb className="h-4 w-4" /></span><div><p className="control-label">DEMO PROTOCOL</p><h2>Show, don’t claim.</h2></div></div><ol>{demoSteps.map((step, index) => <li key={step}><b>{String(index + 1).padStart(2, "0")}</b><span>{step}</span><CheckCircle2 className="h-4 w-4" /></li>)}</ol></article><article className="briefing-viva"><div className="control-block-head"><span><MessageCircleQuestion className="h-4 w-4" /></span><div><p className="control-label">VIVA CONSOLE</p><h2>Practice the reasoning.</h2></div></div><div>{questions.map(([question, answer], index) => <details key={question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<i>+</i></summary><p>{answer}</p></details>)}</div></article></section>
    <footer className="briefing-quote"><Quote className="h-4 w-4" /><p>A credible answer separates <b>what the system guarantees</b> from <b>what it cannot guarantee</b>. Never overclaim anonymity or metadata invisibility.</p><ShieldCheck className="h-4 w-4" /></footer>
  </main></AppShell>;
}
