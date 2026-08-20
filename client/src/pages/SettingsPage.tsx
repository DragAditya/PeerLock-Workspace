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

  return <AppShell><main className="control-deck mx-auto max-w-6xl pb-10"><header className="control-deck-head"><div><span>04 / CONTROL PLANE</span><h1>System<br /><em>preferences.</em></h1></div><p>Every control resolves locally in this browser. No profile record, document policy, or collaboration signal becomes a cloud account.</p></header>
    <div className="control-grid"><section className="control-block control-profile"><div className="control-block-number">A1</div><div className="control-block-head"><span><UserRound className="h-4 w-4" /></span><div><p className="control-label">IDENTITY SIGNAL</p><h2>Your local presence</h2></div></div><p className="control-copy">This identity is shared only through peer awareness when you enter a room.</p><div className="control-fields"><div><Label htmlFor="settings-name">Username</Label><Input id="settings-name" value={name} maxLength={32} onChange={event => setName(event.target.value)} /></div><div><Label htmlFor="settings-color">Cursor wavelength</Label><div className="control-color"><input id="settings-color" type="color" value={color} onChange={event => setColor(event.target.value)} /><code>{color.toUpperCase()}</code></div></div></div><button onClick={save} className="control-primary"><Check className="h-4 w-4" />{saved ? "SIGNAL STORED" : "STORE LOCAL PROFILE"}</button></section>
      <section className="control-block control-mode"><div className="control-block-number">A2</div><div className="control-block-head"><span><Cpu className="h-4 w-4" /></span><div><p className="control-label">OPERATING MODE</p><h2>Dark, by design</h2></div></div><div className="control-mode-display"><div className="control-mode-orb" /><span>DARK / ACTIVE</span><p>One low-glare visual environment prevents state changes across private rooms and technical writing sessions.</p></div><div className="control-mode-list"><p><i />Local document replica</p><p><i />Encrypted WebRTC transport</p><p><i />No content cloud</p></div></section>
    </div>
    <section className="control-policy"><div className="control-policy-intro"><div className="control-block-head"><span><Fingerprint className="h-4 w-4" /></span><div><p className="control-label">EXTERNAL AI BOUNDARY</p><h2>Document protection matrix</h2></div></div><p>Protected documents cannot submit their text to Gemini. Browser-only formatting remains available for every document.</p></div><div className="control-policy-list">{documents.length === 0 ? <p className="control-empty">Create a document to set its external-AI boundary.</p> : documents.map((document, index) => { const allowed = isExternalAiAllowed(document); return <div key={document.id} className="control-policy-row"><span className="control-row-index">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><p>{document.title}</p><small>{allowed ? "EXTERNAL AI / AVAILABLE" : "SENSITIVE / LOCAL FORMAT ONLY"}</small></div><button onClick={() => void setDocumentExternalAiEnabled(document.id, !allowed)} className={allowed ? "control-policy-toggle control-policy-warn" : "control-policy-toggle control-policy-safe"}>{allowed ? <><ShieldOff className="h-3.5 w-3.5" />BLOCK AI</> : <><ShieldCheck className="h-3.5 w-3.5" />PROTECTED</>}</button></div>; })}</div></section>
    <footer className="control-footer"><ShieldCheck className="h-4 w-4" /><p>Peerlock stores no document bodies, exports, chat content, or room secrets in an application-owned cloud database. Network infrastructure can still observe connection metadata.</p></footer>
  </main></AppShell>;
}
