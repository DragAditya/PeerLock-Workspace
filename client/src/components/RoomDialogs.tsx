import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoomCode, createRoomSecret, normalizeRoomCode, parseInviteInput } from "@/lib/room";
import { DoorOpen, Link2, Loader2, PlusCircle, UsersRound } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

type Mode = "create" | "join";

export function RoomDialogs({ compact = false }: { compact?: boolean }) {
  const [, setLocation] = useLocation();
  const { createDocument, createOrOpenRoom } = useWorkspace();
  const [mode, setMode] = useState<Mode | null>(null);
  const [joinValue, setJoinValue] = useState("");
  const [joinSecret, setJoinSecret] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const hostRoom = async () => {
    setWorking(true);
    const roomCode = createRoomCode();
    const roomSecret = createRoomSecret();
    const document = await createDocument("Untitled secure room", { roomCode, roomSecret });
    setLocation(`/editor/${document.id}`);
    setWorking(false);
    setMode(null);
  };

  const joinRoom = async () => {
    const parsedInvite = parseInviteInput(joinValue);
    const invite = { ...parsedInvite, roomSecret: parsedInvite.roomSecret || joinSecret.trim() };
    if (!invite.roomCode || !invite.roomSecret) {
      setError("Enter the eight-character room code and private key, or paste a complete invite link.");
      return;
    }
    setWorking(true);
    const document = await createOrOpenRoom(invite.roomCode, invite.roomSecret);
    setLocation(`/editor/${document.id}`);
    setWorking(false);
    setMode(null);
  };

  if (!mode) {
    return (
      <div className={compact ? "flex gap-2" : "flex flex-col gap-3 sm:flex-row"}>
        <button onClick={() => setMode("create")} className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E5FFF5] px-4 text-sm font-semibold text-[#0A372E] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0">
          <PlusCircle className="h-4 w-4" />
          Host secure room
        </button>
        <button onClick={() => setMode("join")} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-4 text-sm font-medium text-[#D8DFEC] transition hover:border-[#7FE6CA]/40 hover:bg-white/[0.07]">
          <DoorOpen className="h-4 w-4 text-[#7FE6CA]" />
          Join room
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#03050A]/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#111722] p-6 shadow-2xl shadow-black/50">
        {mode === "create" ? (
          <>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#6CE8C6]/12 text-[#7FE6CA]"><UsersRound className="h-5 w-5" /></span>
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-white">Host a private room</h2>
            <p className="mt-2 text-sm leading-6 text-[#98A4B9]">We will create a random room code and a 256-bit secret. Only people with the complete invite link can join.</p>
            <div className="mt-5 rounded-2xl border border-[#70E8C5]/15 bg-[#70E8C5]/[0.055] px-4 py-3 text-xs leading-5 text-[#B8D8CE]">The secret stays in the link fragment, which is not sent in the HTTP request to this app.</div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setMode(null)} disabled={working} className="rounded-xl px-3 py-2 text-sm text-[#9FAABD] hover:bg-white/[0.06] hover:text-white">Cancel</button>
              <button onClick={hostRoom} disabled={working} className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-[#E5FFF5] px-4 py-2.5 text-sm font-semibold text-[#0A372E] disabled:opacity-70">
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Create private room
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#9C8BFF]/12 text-[#B6ACFF]"><DoorOpen className="h-5 w-5" /></span>
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-white">Join a private room</h2>
            <p className="mt-2 text-sm leading-6 text-[#98A4B9]">Paste a full invite link, or enter the short room code and matching private key separately.</p>
            <div className="mt-5 space-y-2">
              <Label htmlFor="room-invite" className="text-xs text-[#C6CEDD]">Invite link or room code</Label>
              <Input id="room-invite" value={joinValue} onChange={event => { setJoinValue(event.target.value); setError(""); }} placeholder="ABCD1234 or https://…/room/ABCD1234#key=…" className="h-11 border-white/[0.12] bg-white/[0.045] text-[#E8EEF8] placeholder:text-[#69768B]" />
              {!parseInviteInput(joinValue).roomSecret && <><Label htmlFor="room-secret" className="pt-1 text-xs text-[#C6CEDD]">Private key</Label><Input id="room-secret" value={joinSecret} onChange={event => { setJoinSecret(event.target.value); setError(""); }} placeholder="Shared private key" className="h-11 border-white/[0.12] bg-white/[0.045] font-mono text-xs text-[#E8EEF8] placeholder:font-sans placeholder:text-[#69768B]" /></>}
              {error && <p className="text-xs text-[#FF9DAF]">{error}</p>}
              {joinValue && <p className="text-[11px] text-[#728197]">Detected room code: <strong className="font-semibold text-[#9FEAD6]">{normalizeRoomCode(parseInviteInput(joinValue).roomCode) || "—"}</strong></p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setMode(null)} disabled={working} className="rounded-xl px-3 py-2 text-sm text-[#9FAABD] hover:bg-white/[0.06] hover:text-white">Cancel</button>
              <button onClick={joinRoom} disabled={working} className="flex min-w-28 items-center justify-center gap-2 rounded-xl bg-[#E5FFF5] px-4 py-2.5 text-sm font-semibold text-[#0A372E] disabled:opacity-70">
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <DoorOpen className="h-4 w-4" />}
                Join room
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
