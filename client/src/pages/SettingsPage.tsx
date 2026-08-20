import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Check, MonitorCog, Moon, Palette, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { profile, updateProfile } = useWorkspace();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState(profile.color);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setName(profile.name); setColor(profile.color); }, [profile.color, profile.name]);
  const save = () => {
    updateProfile({ ...profile, name: name.trim() || profile.name, color });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return <AppShell><main className="mx-auto max-w-5xl pb-12"><header className="settings-hero"><p className="settings-kicker">LOCAL PREFERENCES</p><h1>Profile, appearance, and privacy.</h1><p>These preferences are stored in this browser. They support collaboration without creating a central account profile.</p></header><div className="mt-7 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]"><section className="settings-panel"><div className="flex items-start gap-3"><span className="settings-icon"><UserRound className="h-5 w-5" /></span><div><h2>Presence profile</h2><p>Your name and color appear in peer awareness, cursor labels, and room chat.</p></div></div><div className="mt-7 space-y-5"><div className="space-y-2"><Label htmlFor="settings-name">Display name</Label><Input id="settings-name" value={name} maxLength={32} onChange={event => setName(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="settings-color">Cursor color</Label><div className="flex items-center gap-3"><input id="settings-color" type="color" value={color} onChange={event => setColor(event.target.value)} className="h-10 w-12 rounded-xl border border-slate-200 bg-white p-1" /><span className="text-sm font-medium text-slate-600">{color.toUpperCase()}</span></div></div></div><button onClick={save} className="mt-7 flex h-10 items-center gap-2 rounded-xl bg-[#0C3A3B] px-4 text-sm font-semibold text-white hover:bg-[#145554]"><Check className="h-4 w-4" />{saved ? "Profile saved" : "Save local profile"}</button></section><section className="settings-panel"><div className="flex items-start gap-3"><span className="settings-icon"><Palette className="h-5 w-5" /></span><div><h2>Appearance</h2><p>Light mode is the default. Your selection is preserved in local browser storage.</p></div></div><div className="mt-7 grid grid-cols-2 gap-3"><button onClick={() => setTheme("light")} className={`theme-choice ${theme === "light" ? "theme-choice-active" : ""}`}><span className="theme-preview theme-preview-light"><Sun className="h-4 w-4" /></span><span><b>Light</b><small>Clean workspace</small></span></button><button onClick={() => setTheme("dark")} className={`theme-choice ${theme === "dark" ? "theme-choice-active" : ""}`}><span className="theme-preview theme-preview-dark"><Moon className="h-4 w-4" /></span><span><b>Dark</b><small>Focused editing</small></span></button></div><div className="settings-tip"><MonitorCog className="h-4 w-4" /><p>The application keeps your selection on this device; it is not shared with room peers.</p></div></section></div><section className="settings-privacy mt-5"><ShieldCheck className="h-5 w-5" /><div><h2>Privacy settings by design</h2><p>There is no cloud profile or document preference record to configure. Document bodies, messages, exports, and room secrets remain outside this application server’s storage path. Network and peer infrastructure may still observe connection metadata.</p></div></section></main></AppShell>;
}
