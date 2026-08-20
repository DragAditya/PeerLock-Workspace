import { useWorkspace } from "@/app/WorkspaceProvider";
import { nanoid } from "nanoid";
import { useState } from "react";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { profile, setProfile } = useWorkspace();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0f766e");
  if (profile) return <>{children}</>;
  const enterGuest = () => setProfile({ id: nanoid(10), name: name.trim() || `Guest ${nanoid(4).toUpperCase()}`, color });
  return <div className="profile-gate"><section><p className="eyebrow">Peerlock / guest entry</p><h1>Enter as a guest.</h1><p className="gate-copy">There are no accounts, user IDs, or login passwords. Choose a display name only if you want one; it is used for your cursor inside a room.</p><form onSubmit={event => { event.preventDefault(); enterGuest(); }}><label>Display name <small>(optional)</small><input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Guest name" maxLength={32} /></label><label>Cursor colour<span className="color-row"><input type="color" value={color} onChange={event => setColor(event.target.value)} /><code>{color.toUpperCase()}</code></span></label><button type="submit">Continue as guest <span>→</span></button></form><small>Saved only in this browser. Peerlock does not create a profile database.</small></section><aside><p>LOCAL-FIRST</p><div className="gate-diagram"><i /><i /><i /></div><strong>Write alone.<br />Sync by choice.</strong><span>Your documents start and stay on your device.</span></aside></div>;
}
