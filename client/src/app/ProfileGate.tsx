import { useWorkspace } from "@/app/WorkspaceProvider";
import { nanoid } from "nanoid";
import { useState } from "react";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { profile, setProfile } = useWorkspace();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0f766e");
  if (profile) return <>{children}</>;
  return <div className="profile-gate"><section><p className="eyebrow">Peerlock / first device</p><h1>Start with a local identity.</h1><p className="gate-copy">This is not an account. It is the name and cursor colour that other people will see only when you join the same encrypted room.</p><form onSubmit={event => { event.preventDefault(); if (name.trim().length > 1) setProfile({ id: nanoid(10), name: name.trim(), color }); }}><label>Username<input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Your workspace name" maxLength={32} /></label><label>Cursor colour<span className="color-row"><input type="color" value={color} onChange={event => setColor(event.target.value)} /><code>{color.toUpperCase()}</code></span></label><button type="submit">Create local identity <span>→</span></button></form><small>Stored in this browser. Peerlock does not create a profile database.</small></section><aside><p>LOCAL-FIRST</p><div className="gate-diagram"><i /><i /><i /></div><strong>Write alone.<br />Sync by choice.</strong><span>Your documents start and stay on your device.</span></aside></div>;
}
