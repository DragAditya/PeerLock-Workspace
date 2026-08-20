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

  return <div className="onboarding-shell min-h-screen px-4 py-8 sm:px-8"><div className="onboarding-grid"><section className="onboarding-story"><span className="onboarding-mark"><LockKeyhole className="h-6 w-6" /></span><p className="onboarding-eyebrow">PEERLOCK / FIRST USE</p><h1>Before you write, choose how collaborators see you.</h1><p className="onboarding-copy">Your profile lives only in this browser. It gives your cursor, peer presence, and room chat a recognizable identity—without creating a central account.</p><div className="onboarding-points"><p><ShieldCheck className="h-4 w-4" />No cloud profile database</p><p><ShieldCheck className="h-4 w-4" />Visible only to room peers</p><p><ShieldCheck className="h-4 w-4" />Editable later in Settings</p></div></section><section className="onboarding-form"><span className="onboarding-form-icon"><UserRound className="h-5 w-5" /></span><p className="onboarding-eyebrow">LOCAL PROFILE</p><h2>Set up your presence</h2><p className="onboarding-form-copy">This is required before creating or joining a workspace.</p><div className="mt-7 space-y-5"><div className="space-y-2"><Label htmlFor="onboarding-name">Display name</Label><Input id="onboarding-name" autoFocus value={name} maxLength={32} onChange={event => { setName(event.target.value); setError(""); }} onKeyDown={event => { if (event.key === "Enter") continueToWorkspace(); }} placeholder="e.g. Yogeshwari" /></div><div className="space-y-2"><Label htmlFor="onboarding-color">Cursor color</Label><div className="flex items-center gap-3"><input id="onboarding-color" type="color" value={color} onChange={event => setColor(event.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1" /><span className="text-sm font-medium text-slate-600">{color.toUpperCase()}</span></div></div></div>{error && <p className="mt-4 text-xs font-medium text-rose-600">{error}</p>}<button onClick={continueToWorkspace} className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0C3A3B] text-sm font-semibold text-white transition hover:bg-[#145554]"><ShieldCheck className="h-4 w-4" />Continue to my private workspace</button><p className="mt-4 text-center text-[11px] leading-5 text-slate-500">Your name and color are saved in local browser storage. They are not sent to Peerlock’s application server.</p></section></div></div>;
}
