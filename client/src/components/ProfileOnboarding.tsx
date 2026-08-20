import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";

export function ProfileOnboarding({ children }: { children: React.ReactNode }) {
  const { profile, profileReady, updateProfile } = useWorkspace();
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState(profile.color);
  const [error, setError] = useState("");

  if (profileReady) return <>{children}</>;

  const continueToWorkspace = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Choose a display name with at least two characters.");
      return;
    }
    updateProfile({ ...profile, name: trimmed, color });
  };

  return <div className="relay-onboard min-h-screen"><div className="relay-onboard-grid"><section className="relay-onboard-intro"><div className="relay-onboard-brand"><span><LockKeyhole className="h-5 w-5" /></span><p><b>peer</b><i>lock</i><small>local / direct / encrypted</small></p><em>FIRST CONTACT</em></div><div className="relay-onboard-number">01 / INITIALIZE</div><h1>Make your<br /><em>signal</em><br />known.</h1><p className="relay-onboard-copy">Your presence lives with your documents, on this device. It gives people in a private room a way to recognise your cursor—without creating a central account.</p><div className="relay-onboard-claims"><p><ShieldCheck className="h-4 w-4" />No cloud profile database</p><p><ShieldCheck className="h-4 w-4" />Visible only to invited peers</p><p><ShieldCheck className="h-4 w-4" />Changeable from Control</p></div><div className="relay-onboard-gridmark" aria-hidden="true"><i /><i /><i /><i /><i /></div><div className="relay-onboard-corner">LOCAL<br />REPLICA / READY</div></section><section className="relay-onboard-form"><div className="relay-form-index">YOUR DEVICE / YOUR SIGNAL</div><span className="relay-form-icon"><UserRound className="h-5 w-5" /></span><h2>Set your<br />peer presence.</h2><p>A small identity for encrypted collaboration. The information below stays in this browser until a room shares it through peer awareness.</p><div className="relay-form-fields"><div><Label htmlFor="onboarding-name">USERNAME</Label><Input id="onboarding-name" autoFocus value={name} maxLength={32} onChange={event => { setName(event.target.value); setError(""); }} onKeyDown={event => { if (event.key === "Enter") continueToWorkspace(); }} placeholder="Choose a username" /></div><div><Label htmlFor="onboarding-color">CURSOR SIGNAL</Label><div className="relay-color-field"><input id="onboarding-color" type="color" value={color} onChange={event => setColor(event.target.value)} /><span style={{ backgroundColor: color }} /><code>{color.toUpperCase()}</code></div></div></div>{error && <p className="relay-form-error">{error}</p>}<button onClick={continueToWorkspace} className="relay-form-submit"><ShieldCheck className="h-4 w-4" /><span>Enter the relay room</span><i>↗</i></button><p className="relay-form-privacy">No central account. No uploaded profile. Only private-room peer presence.</p></section></div></div>;
}
