import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Check, Pencil, UserRound } from "lucide-react";
import { useState } from "react";

export function ProfileDialog() {
  const { profile, updateProfile } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState(profile.color);

  const openDialog = () => {
    setName(profile.name);
    setColor(profile.color);
    setOpen(true);
  };

  const save = () => {
    updateProfile({ ...profile, name, color });
    setOpen(false);
  };

  return <>
    <button onClick={openDialog} className="mt-3 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.055]">
      <span className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-[#071018]" style={{ backgroundColor: profile.color }}>{profile.name.slice(0, 1).toUpperCase()}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-[#D4DCE8]">{profile.name}</span><span className="mt-0.5 block text-[10px] text-[#718097]">Edit presence profile</span></span>
      <Pencil className="h-3.5 w-3.5 text-[#6C7990]" />
    </button>
    {open && <div className="fixed inset-0 z-[80] grid place-items-center bg-[#03050A]/75 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-3xl border border-white/[0.12] bg-[#111722] p-6 shadow-2xl shadow-black/50"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#7FE6CA]/12 text-[#7FE6CA]"><UserRound className="h-5 w-5" /></span><h2 className="mt-4 text-lg font-semibold text-white">Your peer identity</h2><p className="mt-1.5 text-xs leading-5 text-[#8F9CB1]">This name and color are sent only through room awareness messages. They are not saved by the application server.</p><div className="mt-5 space-y-4"><div className="space-y-2"><Label htmlFor="profile-name" className="text-xs text-[#C6CEDD]">Display name</Label><Input id="profile-name" value={name} maxLength={32} onChange={event => setName(event.target.value)} className="h-10 border-white/[0.12] bg-white/[0.045] text-[#E8EEF8]" /></div><div className="space-y-2"><Label htmlFor="profile-color" className="text-xs text-[#C6CEDD]">Cursor color</Label><div className="flex items-center gap-3"><input id="profile-color" type="color" value={color} onChange={event => setColor(event.target.value)} className="h-10 w-12 rounded-lg border border-white/[0.12] bg-white/[0.045] p-1" /><span className="text-xs text-[#90A0B5]">{color.toUpperCase()}</span></div></div></div><div className="mt-6 flex justify-end gap-3"><button onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm text-[#9FAABD] hover:bg-white/[0.06] hover:text-white">Cancel</button><button onClick={save} className="flex items-center gap-2 rounded-xl bg-[#E5FFF5] px-4 py-2 text-sm font-semibold text-[#0A372E]"><Check className="h-4 w-4" />Save profile</button></div></div></div>}
  </>;
}
