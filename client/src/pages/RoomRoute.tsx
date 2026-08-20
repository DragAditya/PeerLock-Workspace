import { useWorkspace } from "@/app/WorkspaceProvider";
import { ProfileGate } from "@/app/ProfileGate";
import { readInvite } from "@/features/room/invite";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export function RoomRoute() {
  const [, navigate] = useLocation(); const { openRoom, profile } = useWorkspace(); const [error, setError] = useState(""); const [password, setPassword] = useState(""); const invite = readInvite();
  useEffect(() => { if (!profile) return; if (!invite) { setError("This invite does not include a valid eight-character room code."); return; } if (invite.protected && !password) return; void openRoom(invite.roomCode, { protected: invite.protected, password }).then(document => navigate(`/studio/${document.id}`)).catch(() => setError("This room could not be opened in this browser. Check the invite and try again.")); }, [invite?.roomCode, invite?.protected, password, profile?.id, navigate, openRoom]);
  const content = invite?.protected && !password ? <div className="route-loading"><div className="route-error"><p className="eyebrow">Password-protected room</p><h1>Enter the room password.</h1><p>The owner chose to protect this room. Peerlock does not have an account password or a saved room-secret database.</p><form onSubmit={event => { event.preventDefault(); const value = new FormData(event.currentTarget).get("password"); if (typeof value === "string" && value.trim().length >= 4) setPassword(value.trim()); }}><input name="password" type="password" placeholder="Room password" autoFocus /><button type="submit">Open room</button></form></div></div> : <div className="route-loading">{error ? <div className="route-error"><h1>Room not opened</h1><p>{error}</p><button onClick={() => navigate("/")}>Return to workspace</button></div> : "Preparing your room…"}</div>;
  return <ProfileGate>{content}</ProfileGate>;
}
