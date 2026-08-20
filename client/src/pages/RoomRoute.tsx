import { useWorkspace } from "@/app/WorkspaceProvider";
import { readInvite } from "@/features/room/invite";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export function RoomRoute() {
  const [, navigate] = useLocation(); const { openRoom } = useWorkspace(); const [error, setError] = useState("");
  useEffect(() => { const invite = readInvite(); if (!invite) { setError("This invite is incomplete. Ask the room owner to send the full link, including the secret after #."); return; } void openRoom(invite.roomCode, invite.roomSecret).then(document => navigate(`/studio/${document.id}`)).catch(() => setError("This private room could not be opened in this browser. Check the invite and try again.")); }, [navigate, openRoom]);
  return <div className="route-loading">{error ? <div className="route-error"><h1>Room not opened</h1><p>{error}</p><button onClick={() => navigate("/")}>Return to workspace</button></div> : "Preparing a private room…"}</div>;
}
