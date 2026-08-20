import { AppFrame, RoomBadge } from "@/app/AppFrame";
import { ProfileGate } from "@/app/ProfileGate";
import { useWorkspace } from "@/app/WorkspaceProvider";
import { ArrowUpRight, FilePlus2, Link2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import "./guest-room-access.css";

export function HubPage() {
  const [, navigate] = useLocation();
  const { documents, loading, createDocument, removeDocument, openRoom } = useWorkspace();
  const [roomCode, setRoomCode] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [protectedRoom, setProtectedRoom] = useState(false);
  const [joinError, setJoinError] = useState("");
  const create = async () => { const document = await createDocument(); navigate(`/studio/${document.id}`); };
  const join = async (event: React.FormEvent) => {
    event.preventDefault(); setJoinError("");
    if (!/^[A-Z0-9]{8}$/i.test(roomCode)) { setJoinError("Enter the eight-character room code from the invite."); return; }
    if (protectedRoom && roomPassword.trim().length < 4) { setJoinError("Enter the room password chosen by the room owner."); return; }
    try { const document = await openRoom(roomCode.toUpperCase(), { protected: protectedRoom, password: roomPassword.trim() }); navigate(`/studio/${document.id}`); }
    catch { setJoinError("This room could not be opened in this browser. Check the invite and try again."); }
  };
  return <ProfileGate><AppFrame><div className="hub-layout"><section className="hub-intro"><div><p className="eyebrow">Your workspace</p><h1>Documents<br />without a cloud.</h1><p>Every draft starts in this browser. Turn one into a room only when you decide to work directly with peers.</p></div><div className="hub-actions"><button onClick={() => void create()}><FilePlus2 size={18} />Start a note</button><button onClick={() => document.getElementById("join-room")?.scrollIntoView({ behavior: "smooth" })}><Link2 size={18} />Join a room</button></div></section><section className="document-library"><header><div><p className="eyebrow">Local library</p><h2>Open work</h2></div><span>{String(documents.length).padStart(2, "0")} items</span></header>{loading ? <p className="loading">Opening local index…</p> : documents.length ? <div className="document-grid">{documents.map(document => <article key={document.id}><button className="document-card-main" onClick={() => navigate(`/studio/${document.id}`)}><span className="document-card-type">{document.roomCode ? (document.roomProtected || document.roomSecret ? "Password room" : "Open room") : "Private draft"}</span><h3>{document.title}</h3><p>Updated {new Date(document.updatedAt).toLocaleDateString()}</p><RoomBadge connected={Boolean(document.roomCode)} /><ArrowUpRight size={18} /></button><button className="delete-note" onClick={() => { if (confirm(`Remove “${document.title}” from this browser?`)) void removeDocument(document.id); }} aria-label={`Remove ${document.title}`}><Trash2 size={15} /></button></article>)}</div> : <div className="empty-library"><span>Nothing saved here yet.</span><h3>Start with a single private thought.</h3><button onClick={() => void create()}>Create first note <ArrowUpRight size={16} /></button></div>}</section><section id="join-room" className="join-room"><div><p className="eyebrow">Bring your own invite</p><h2>Enter a room from another peer.</h2><p>Every invite starts with a short room code. A password is required only when the room owner deliberately protects the room.</p></div><form onSubmit={join}><label>Room code<input value={roomCode} onChange={event => { setRoomCode(event.target.value.toUpperCase()); setJoinError(""); }} maxLength={8} placeholder="AB12CD34" /></label><label className="room-protection-choice"><input type="checkbox" checked={protectedRoom} onChange={event => { setProtectedRoom(event.target.checked); setJoinError(""); }} />This room has a password</label>{protectedRoom && <label>Room password<input type="password" value={roomPassword} onChange={event => { setRoomPassword(event.target.value); setJoinError(""); }} placeholder="Enter the password" /></label>}{joinError && <p className="join-error" role="alert">{joinError}</p>}<button type="submit">Open room <ArrowUpRight size={16} /></button></form></section></div></AppFrame></ProfileGate>;
}
