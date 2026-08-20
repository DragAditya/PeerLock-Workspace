import { AppShell } from "@/components/AppShell";
import { BadgeCheck, BookOpenCheck, Boxes, DatabaseZap, ExternalLink, LockKeyhole, Network, ShieldAlert, ShieldCheck, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const references = [
  { label: "Yjs: Offline Support", url: "https://docs.yjs.dev/getting-started/allowing-offline-editing" },
  { label: "y-indexeddb provider", url: "https://github.com/yjs/y-indexeddb" },
  { label: "y-webrtc connector", url: "https://github.com/yjs/y-webrtc" },
  { label: "Tiptap: Awareness", url: "https://tiptap.dev/docs/collaboration/core-concepts/awareness" },
];

const modules: [string, string, string, LucideIcon, string][] = [
  ["01", "System architecture", "The browser owns editor state. Tiptap renders a Yjs document, IndexedDB persists local updates, and y-webrtc carries the same CRDT updates between direct peers." , Boxes, "#c7bcff"],
  ["02", "Signaling boundary", "Peers exchange temporary connection information through signaling, but signaling does not become a document API, history store, or backup layer.", Network, "#76e2c5"],
  ["03", "CRDT convergence", "Independent replicas record valid operations and merge deterministically after simultaneous or offline work, without a central conflict resolver.", DatabaseZap, "#7bc9ff"],
  ["04", "Offline protocol", "The document restores from IndexedDB first. When peers return, missing Yjs updates move across the mesh and replicas converge.", Wifi, "#f5ca82"],
];

export default function ReportPage() {
  return <AppShell><article className="research-deck mx-auto max-w-6xl pb-12"><header className="research-head"><div><span>02 / RESEARCH LEDGER</span><h1>A document<br /><em>without a cloud.</em></h1></div><p>Technical record for the Peerlock MCA submission. The system narrows central trust by keeping document content in browser replicas and direct peer links.</p><div className="research-mark"><BookOpenCheck className="h-5 w-5" /><span>LOCAL<br />FIRST</span></div></header>
    <section className="research-abstract"><div><span className="control-label">ABSTRACT / 001</span><h2>Replica ownership is the design decision.</h2><p>Peerlock investigates whether small-team collaboration can keep the useful real-time behavior of cloud editors while removing document content from the application server. Each participant persists a Yjs replica in the browser, then exchanges mergeable operations with peers through WebRTC.</p></div><div className="research-flow" aria-label="Document architecture"><span>BROWSER<br />REPLICA</span><i>YJS</i><span>ENCRYPTED<br />PEER LINK</span><i>YJS</i><span>BROWSER<br />REPLICA</span><small>SIGNALING / CONNECTION ONLY</small></div></section>
    <section className="research-facts">{[["LOCAL PERSISTENCE", "Y IndexedDB retains updates through refreshes and offline intervals."], ["PEER TRANSPORT", "y-webrtc exchanges updates through direct encrypted data channels."], ["EPHEMERAL AWARENESS", "Names, colour signals, and cursors remain outside document history."]].map(([label, copy], index) => <div key={label}><span>{String(index + 1).padStart(2, "0")}</span><b>{label}</b><p>{copy}</p></div>)}</section>
    <section className="research-modules">{modules.map(([number, title, copy, Icon, color]: [string, string, string, LucideIcon, string]) => <article key={number}><div><span>{number}</span><Icon className="h-5 w-5" style={{ color }} /></div><h2>{title}</h2><p>{copy}</p></article>)}</section>
    <section className="research-boundary"><div className="research-boundary-copy"><LockKeyhole className="h-5 w-5" /><span className="control-label">SECURITY MODEL / BOUNDARY</span><h2>Private rooms are created in the browser.</h2><p>An invite carries a short room code plus a random secret in the URL fragment. The browser derives an opaque room name, supplies the secret to y-webrtc, and keeps document data out of the application server’s storage path.</p></div><div className="research-boundary-table"><div><ShieldCheck className="h-4 w-4" style={{ color: "#76e2c5" }} /><b>IN SCOPE</b><p>Document content remains in browser storage and peer browsers.</p></div><div><BadgeCheck className="h-4 w-4" style={{ color: "#f5ca82" }} /><b>METADATA</b><p>Network services may observe connection timing and network identifiers.</p></div><div><ShieldAlert className="h-4 w-4" style={{ color: "#ff9bad" }} /><b>ENDPOINT</b><p>A compromised device or leaked invite secret can expose local content.</p></div></div></section>
    <section className="research-closing"><BookOpenCheck className="h-5 w-5" /><div><h2>Conclusion / next research scope</h2><p>The contribution is not eliminating every service; it is narrowing which service needs access to content. Future work can explore self-hosted signaling, user-selected encrypted backups, key rotation, revocation, attachments, and performance measurement under peer churn.</p></div></section>
    <footer className="research-references"><span>REFERENCES / VERIFIED</span>{references.map((reference, index) => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer"><b>[{index + 1}]</b>{reference.label}<ExternalLink className="h-3.5 w-3.5" /></a>)}</footer>
  </article></AppShell>;
}
