import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { isExternalAiAllowed } from "@/lib/workspace";
import { Check, Cpu, Fingerprint, ShieldCheck, ShieldOff, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { profile, updateProfile, documents, setDocumentExternalAiEnabled } = useWorkspace();
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState(profile.color);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setName(profile.name); setColor(profile.color); }, [profile.color, profile.name]);
  const save = () => { updateProfile({ ...profile, name: name.trim() || profile.name, color }); setSaved(true); window.setTimeout(() => setSaved(false), 2000); };

  return <AppShell><main className="relay-control mx-auto max-w-[1320px] pb-12"><header className="relay-page-head"><div><span>04 / LOCAL CONTROL</span><h1>Your signal.<br /><em>Your rules.</em></h1></div><p>Every preference takes effect in this browser. The controls below shape your peer presence and document boundaries without becoming a cloud account.</p></header>
    <section className="relay-control-grid"><article><span className="relay-block-index">A / IDENTITY</span><div className="relay-block-icon"><UserRound className="h-4 w-4" /></div><h2>Show up<br />as yourself.</h2><p>This information travels only through temporary peer awareness when you enter an encrypted room.</p><div className="relay-control-fields"><div><Label htmlFor="settings-name">USERNAME</Label><Input id="settings-name" value={name} maxLength={32} onChange={event => setName(event.target.value)} /></div><div><Label htmlFor="settings-color">CURSOR SIGNAL</Label><div className="relay-color-field"><input id="settings-color" type="color" value={color} onChange={event => setColor(event.target.value)} /><span style={{ backgroundColor: color }} /><code>{color.toUpperCase()}</code></div></div></div><button onClick={save} className="relay-control-save"><Check className="h-4 w-4" />{saved ? "Signal stored locally" : "Store local profile"}<i>↗</i></button></article>
      <article className="relay-mode-card"><span className="relay-block-index">B / ENVIRONMENT</span><div className="relay-block-icon"><Cpu className="h-4 w-4" /></div><h2>Low glare.<br /><em>High focus.</em></h2><div className="relay-mode-visual"><i /><span>DARK / ACTIVE</span><p>One deliberate workspace removes appearance changes from a session of serious writing.</p></div><div className="relay-mode-list"><p><i />IndexedDB local replica</p><p><i />Encrypted WebRTC transport</p><p><i />No central content record</p></div></article></section>
    <section className="relay-policy"><div className="relay-policy-intro"><span>AI / TRUST BOUNDARY</span><Fingerprint className="h-5 w-5" /><h2>Keep some<br />rooms <em>opaque.</em></h2><p>When a document is protected, its text cannot be submitted to Gemini. Browser-only formatting stays available.</p></div><div className="relay-policy-list">{documents.length === 0 ? <p className="relay-policy-empty">Create a document to define its external-AI boundary.</p> : documents.map((document, index) => { const allowed = isExternalAiAllowed(document); return <div key={document.id} className="relay-policy-row"><span>{String(index + 1).padStart(2, "0")}</span><div><b>{document.title}</b><small>{allowed ? "EXTERNAL AI / AVAILABLE BY CONSENT" : "SENSITIVE / LOCAL FORMATTING ONLY"}</small></div><button onClick={() => void setDocumentExternalAiEnabled(document.id, !allowed)} className={allowed ? "relay-policy-block" : "relay-policy-protect"}>{allowed ? <><ShieldOff className="h-3.5 w-3.5" />BLOCK AI</> : <><ShieldCheck className="h-3.5 w-3.5" />PROTECTED</>}</button></div>; })}</div></section>
    <footer className="relay-control-note"><ShieldCheck className="h-4 w-4" /><p>Peerlock does not store document bodies, exports, chat content, or room secrets in an application-owned cloud database. Network infrastructure can still observe connection metadata.</p></footer>
  </main></AppShell>;
}
