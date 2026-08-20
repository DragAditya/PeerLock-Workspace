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

  return <div className="onboarding-shell min-h-screen px-4 py-8 sm:px-8"><div className="onboarding-grid"><section className="onboarding-story"><div className="onboarding-brand-row"><span className="onboarding-mark"><LockKeyhole className="h-6 w-6" /></span><span className="onboarding-wordmark"><b>peer</b>lock<em>LOCAL / DIRECT / ENCRYPTED</em></span></div><div className="onboarding-mesh" aria-hidden="true"><i /><i /><i /><i /></div><p className="onboarding-eyebrow">PRIVATE PRESENCE / FIRST USE</p><h1>Before you write, choose how collaborators see you.</h1><p className="onboarding-copy">Your profile lives only in this browser. It gives your cursor, peer presence, and room chat a recognizable identity—without creating a central account.</p><div className="onboarding-points"><p><ShieldCheck className="h-4 w-4" />No cloud profile database</p><p><ShieldCheck className="h-4 w-4" />Visible only to room peers</p><p><ShieldCheck className="h-4 w-4" />Editable later in Settings</p></div></section><section className="onboarding-form"><div className="onboarding-form-mesh" aria-hidden="true"><i /><i /><i /></div><span className="onboarding-form-icon"><UserRound className="h-5 w-5" /></span><p className="onboarding-eyebrow">LOCAL PROFILE</p><h2>Set up your presence</h2><p className="onboarding-form-copy">This is required before creating or joining a workspace.</p><div className="mt-7 space-y-5"><div className="space-y-2"><Label htmlFor="onboarding-name">Display name</Label><Input id="onboarding-name" autoFocus value={name} maxLength={32} onChange={event => { setName(event.target.value); setError(""); }} onKeyDown={event => { if (event.key === "Enter") continueToWorkspace(); }} placeholder="e.g. Yogeshwari" /></div><div className="space-y-2"><Label htmlFor="onboarding-color">Cursor color</Label><div className="flex items-center gap-3"><input id="onboarding-color" type="color" value={color} onChange={event => setColor(event.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1" /><span className="text-sm font-medium text-slate-600">{color.toUpperCase()}</span></div></div></div>{error && <p className="mt-4 text-xs font-medium text-rose-600">{error}</p>}<button onClick={continueToWorkspace} className="onboarding-cta mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"><ShieldCheck className="h-4 w-4" />Enter my private workspace</button><p className="mt-4 text-center text-[11px] leading-5 text-slate-500">Stored on this device. Visible only to room peers. Never sent to Peerlock’s application server.</p></section></div></div>;
}
