import { ProfileGate } from "@/app/ProfileGate";
import { AppFrame, RoomBadge } from "@/app/AppFrame";
import { useWorkspace } from "@/app/WorkspaceProvider";
import { ArrowUpRight, FilePlus2, Link2, LockKeyhole, Radio, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import "./guest-room-access.css";

const hubMobileRepairStyles = `
@media (max-width: 850px) {
  .app-frame:has(.hub-redesign) .hub-layout { padding-top: 30px; }
  .hub-redesign .hub-library { scroll-margin-top: 84px; }
  .hub-redesign .document-grid { grid-template-columns: 1fr; gap: 12px; }
  .hub-redesign .workspace-document-card { min-height: 0; overflow: hidden; border-color: #d0d7cf; border-radius: 13px; }
  .hub-redesign .workspace-document-card .document-card-main { display: grid; grid-template-rows: auto minmax(0,1fr) auto; min-height: 166px; height: auto; padding: 17px 18px 15px; }
  .hub-redesign .workspace-document-card .document-card-top { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: center; gap: 12px; padding-right: 32px; }
  .hub-redesign .workspace-document-card .document-card-main::before { left: 16px; width: 36px; }
  .hub-redesign .workspace-document-card .document-card-heading { display: flex; align-items: center; min-width: 0; gap: 12px; margin-top: 0; }
  .hub-redesign .workspace-document-card .document-card-heading h3 { max-width: none; margin: 0; overflow-wrap: anywhere; font-size: clamp(1.42rem, 6.6vw, 1.78rem); line-height: 1.04; white-space: normal; }
  .hub-redesign .workspace-document-card .document-card-open { display: none; }
  .hub-redesign .workspace-document-card .document-card-footer { display: grid; grid-template-columns: auto minmax(0,1fr); align-items: center; gap: 12px; margin-top: 0; border-top: 1px solid #e0e4de; padding-top: 12px; }
  .hub-redesign .workspace-document-card .document-card-footer > span { min-width: 0; color: #5f6d64; font-size: 11px; line-height: 1.3; text-align: right; }
  .hub-redesign .workspace-document-card .room-badge { margin: 0; white-space: nowrap; }
  .hub-redesign .workspace-document-card .document-card-main svg { position: static; right: auto; bottom: auto; }
  .hub-redesign .workspace-document-card .delete-note { top: 10px; right: 10px; z-index: 2; width: 30px; height: 30px; opacity: 1; }
}
@media (max-width: 480px) {
  .app-frame:has(.hub-redesign) .app-header { height: 62px; padding: 0 10px; }
  .app-frame:has(.hub-redesign) .app-logo { gap: 7px; }
  .app-frame:has(.hub-redesign) .app-logo .app-logo-mark { width: 30px; height: 30px; border-radius: 8px; }
  .app-frame:has(.hub-redesign) .app-logo b { font-size: 11px; letter-spacing: .14em; }
  .app-frame:has(.hub-redesign) .app-header-actions { gap: 4px; }
  .app-frame:has(.hub-redesign) :is(.header-admin, .header-account, .header-learning, .header-settings) { width: 35px; min-width: 35px; height: 35px; min-height: 35px; border-radius: 8px; }
  .hub-redesign .hub-layout { width: min(100% - 32px, 640px); padding-top: 24px; }
  .hub-redesign .hub-library > header { align-items: end; gap: 12px; padding-bottom: 15px; }
  .hub-redesign .hub-library > header > p { max-width: 136px; margin: 0; font-size: 11px; line-height: 1.35; text-align: right; }
  .hub-redesign .workspace-document-card .document-card-main { min-height: 158px; padding: 16px 16px 14px; }
  .hub-redesign .workspace-document-card .document-card-top { gap: 8px; padding-right: 28px; }
  .hub-redesign .workspace-document-card .document-card-type { font-size: 9px; }
  .hub-redesign .workspace-document-card .document-card-date { font-size: 10px; }
  .hub-redesign .workspace-document-card .document-card-heading h3 { font-size: 1.55rem; }
  .hub-redesign .workspace-document-card .document-card-footer { gap: 9px; padding-top: 11px; }
  .hub-redesign .workspace-document-card .room-badge { padding: 5px 7px; font-size: 9px; }
  .hub-redesign .workspace-document-card .document-card-footer > span { font-size: 10px; }
}
`;

export function HubPage() {
  const [, navigate] = useLocation(); const { documents, loading, createDocument, removeDocument, profile } = useWorkspace(); const [roomCode, setRoomCode] = useState(""); const [joinError, setJoinError] = useState(""); const liveRooms = trpc.room.liveCount.useQuery(undefined, { refetchInterval: 15000 });
  const sharedDocumentCount = useMemo(() => documents.filter(document => Boolean(document.roomId)).length, [documents]);
  useEffect(() => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return; const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("hub-reveal-visible"); observer.unobserve(entry.target); } }), { threshold: .12 }); document.querySelectorAll(".hub-reveal").forEach(element => observer.observe(element)); return () => observer.disconnect(); }, []);
  const create = async () => { const document = await createDocument(); navigate(`/studio/${document.id}`); };
  const join = (event: React.FormEvent) => { event.preventDefault(); setJoinError(""); if (!/^[A-Z0-9]{8}$/i.test(roomCode)) { setJoinError("Enter the eight-character code from a real room invite."); return; } navigate(`/r/${roomCode.toUpperCase()}`); };
  const tiltHero = (event: React.PointerEvent<HTMLElement>) => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const bounds = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--hub-pointer-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 9}px`); event.currentTarget.style.setProperty("--hub-pointer-y", `${((event.clientY - bounds.top) / bounds.height - .5) * 8}px`); };
  const resetHero = (event: React.PointerEvent<HTMLElement>) => { event.currentTarget.style.setProperty("--hub-pointer-x", "0px"); event.currentTarget.style.setProperty("--hub-pointer-y", "0px"); };
  const liveCount = liveRooms.data ?? 0;

  return <ProfileGate><AppFrame><style>{hubMobileRepairStyles}</style><div className="hub-layout hub-redesign">
    <section className="hub-hero hub-reveal" onPointerMove={tiltHero} onPointerLeave={resetHero}>
      <div className="hub-hero-copy"><p className="hub-kicker"><Radio size={12} />Local-first studio <span>·</span>{liveCount} live now</p><h1>Documents<br /><span>without a cloud.</span></h1><p className="hub-hero-description">Build in private, work in your own rhythm, and invite approved peers only when an idea needs a second mind.</p><div className="hub-hero-stats"><span><b>{String(documents.length).padStart(2, "0")}</b><small>local drafts</small></span><span><b>{String(sharedDocumentCount).padStart(2, "0")}</b><small>shared rooms</small></span><span><b>0</b><small>server copies</small></span></div></div>
      <div className="hub-hero-visual" aria-hidden="true"><div className="hub-visual-grid" /><div className="hub-core"><i /><i /><i /><span><LockKeyhole size={18} /></span></div><p>Browser vault<br /><em>Encrypted peer mesh</em></p><div className="hub-visual-caption"><Sparkles size={14} />Your words stay with you.</div></div>
      <div className="hub-hero-actions"><button className="hub-action-primary" onClick={() => void create()}><FilePlus2 size={18} /><span>Start a note<small>Begin locally</small></span><ArrowUpRight size={17} /></button><button className="hub-action-secondary" onClick={() => document.getElementById("join-room")?.scrollIntoView({ behavior: "smooth", block: "center" })}><Link2 size={17} /><span>Join a room</span><ArrowUpRight size={16} /></button></div>
    </section>
    <section className="hub-library hub-reveal"><header><div><p className="eyebrow">The desk</p><h2>Open work</h2></div><p>{documents.length ? "Local drafts and approved rooms" : "Your browser is ready when you are."}</p></header>{loading ? <p className="loading">Opening local index…</p> : documents.length ? <div className="document-grid">{documents.map((document, index) => <article key={document.id} className="workspace-document-card hub-card-reveal" style={{ "--card-delay": `${index * 60}ms` } as React.CSSProperties}><button className="document-card-main" onClick={() => navigate(`/studio/${document.id}`)}><div className="document-card-top"><span className="document-card-type">{document.roomId ? (document.roomProtected ? "Password room" : "Open room") : "Private draft"}</span><span className="document-card-date">{new Date(document.updatedAt).toLocaleDateString()}</span></div><div className="document-card-heading"><h3>{document.title}</h3><span className="document-card-open">Open <ArrowUpRight size={16} /></span></div><div className="document-card-footer"><RoomBadge connected={Boolean(document.roomId)} connectedLabel="Shared room" /><span>{document.roomId ? "Invite-controlled" : "Only this browser"}</span></div></button><button className="delete-note" onClick={() => { if (confirm(`Remove “${document.title}” from this browser?`)) void removeDocument(document.id); }} aria-label={`Remove ${document.title}`}><Trash2 size={15} /></button></article>)}</div> : <div className="empty-library hub-empty-library"><div><Sparkles size={18} /><p className="eyebrow">A clear desk</p><h3>Start with one private thought.</h3><p>It is stored in this browser first. No cloud account is needed for your words.</p></div><button onClick={() => void create()}>Create first note <ArrowUpRight size={16} /></button></div>}</section>
    <section id="join-room" className="join-room join-room-flow hub-join-terminal hub-reveal"><div className="join-room-copy"><p className="eyebrow">Verified room entry</p><h2>Bring a code.<br /><span>We’ll do the checking.</span></h2><p>We verify the room before asking for anything sensitive. A password is requested only when a protected room requires it.</p><ol className="join-room-steps"><li className="active"><span>01</span><b>Verify code</b><small>Check the room</small></li><li><span>02</span><b>Check protection</b><small>Ask only if needed</small></li><li><span>03</span><b>Request access</b><small>Owner decides</small></li></ol></div><form onSubmit={join}><label htmlFor="room-code">Room code<input id="room-code" value={roomCode} onChange={event => { setRoomCode(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase()); setJoinError(""); }} maxLength={8} inputMode="text" autoCapitalize="characters" autoComplete="off" placeholder="AB12CD34" aria-describedby="room-code-help" /></label><p id="room-code-help" className="join-room-help"><ShieldCheck size={15} />Password checks happen only after the room code is verified.</p>{joinError && <p className="join-error" role="alert">{joinError}</p>}<button type="submit" disabled={!profile}>Continue securely <ArrowUpRight size={16} /></button></form></section>
  </div></AppFrame></ProfileGate>;
}
