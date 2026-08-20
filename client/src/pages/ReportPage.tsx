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
  return <AppShell><article className="relay-research mx-auto max-w-[1320px] pb-12">
    <header className="relay-academic-hero"><div><span>02 / RESEARCH LEDGER</span><h1>Content<br /><em>has a home.</em></h1></div><p>Peerlock is an MCA capstone about reducing the central trust required for small-team collaboration. The work keeps document content in browser replicas and peer links.</p><div className="relay-academic-stamp"><BookOpenCheck className="h-5 w-5" /><b>LOCAL</b><small>FIRST / STUDY</small></div></header>
    <section className="relay-report-proposition"><div><span>ABSTRACT / 001</span><h2>Replica ownership<br />is the <em>decision.</em></h2><p>Peerlock investigates whether a writing tool can remain real-time and collaborative without turning the application server into a document vault. Each participant persists a Yjs replica locally, then exchanges mergeable operations with peers through WebRTC.</p></div><div className="relay-report-diagram" aria-label="Browser-to-browser collaboration architecture"><span>LOCAL<br />REPLICA</span><i>YJS</i><span>DIRECT<br />PEER LINK</span><i>YJS</i><span>LOCAL<br />REPLICA</span><small>CONNECTION DISCOVERY / NO DOCUMENT STORE</small></div></section>
    <section className="relay-report-facts">{[["LOCAL PERSISTENCE", "Y IndexedDB retains updates through refreshes and offline intervals."], ["PEER TRANSPORT", "y-webrtc exchanges updates through direct encrypted data channels."], ["EPHEMERAL AWARENESS", "Names, colour signals, and cursors remain outside document history."]].map(([label, copy], index) => <article key={label}><span>{String(index + 1).padStart(2, "0")}</span><b>{label}</b><p>{copy}</p></article>)}</section>
    <section className="relay-report-chapters"><div className="relay-section-label"><span>ARCHITECTURE / FOUR WORKING PARTS</span><p>Each layer exists to keep the writing surface useful without centralizing its content.</p></div><div>{modules.map(([number, title, copy, Icon, color]: [string, string, string, LucideIcon, string]) => <article key={number}><div><span>{number}</span><Icon className="h-5 w-5" style={{ color }} /></div><h2>{title}</h2><p>{copy}</p></article>)}</div></section>
    <section className="relay-report-boundary"><div><LockKeyhole className="h-5 w-5" /><span>SECURITY / TRUST BOUNDARY</span><h2>Private rooms<br />start <em>in-browser.</em></h2><p>An invite carries a short room code plus a random secret in the URL fragment. The browser derives an opaque room name, supplies the secret to y-webrtc, and keeps document data out of the application server’s storage path.</p></div><div className="relay-boundary-list"><article><ShieldCheck className="h-4 w-4" /><b>IN SCOPE</b><p>Document content remains in browser storage and peer browsers.</p></article><article><BadgeCheck className="h-4 w-4" /><b>METADATA</b><p>Network services may observe connection timing and network identifiers.</p></article><article><ShieldAlert className="h-4 w-4" /><b>ENDPOINT</b><p>A compromised device or leaked invite secret can expose local content.</p></article></div></section>
    <section className="relay-research-closing"><BookOpenCheck className="h-5 w-5" /><div><span>CONCLUSION / NEXT SCOPE</span><h2>Narrow the service<br />that needs <em>content.</em></h2><p>Future work can explore self-hosted signaling, user-selected encrypted backups, key rotation, revocation, attachments, and peer-churn performance measurement.</p></div></section>
    <footer className="relay-academic-references"><span>REFERENCES / VERIFIED</span>{references.map((reference, index) => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer"><b>[{index + 1}]</b>{reference.label}<ExternalLink className="h-3.5 w-3.5" /></a>)}</footer>
  </article></AppShell>;
}
