import { ProfileGate } from "@/app/ProfileGate";
import { AppFrame, RoomBadge } from "@/app/AppFrame";
import { useWorkspace } from "@/app/WorkspaceProvider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { clampLeftSwipeOffset, shouldBeginLeftSwipe, shouldRevealMobileDelete } from "@/features/workspace/mobileCardGesture";
import { ArrowUpRight, FilePlus2, Link2, LockKeyhole, Radio, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  .hub-redesign .workspace-document-card .delete-note { display: none; }
  .hub-redesign .workspace-document-card { position: relative; isolation: isolate; }
  .hub-redesign .mobile-card-delete-reveal { position: absolute; z-index: 0; inset: 0; display: flex; justify-content: flex-end; align-items: stretch; background: #b54837; }
  .hub-redesign .mobile-card-delete-reveal button { display: inline-flex; width: 94px; align-items: center; justify-content: center; gap: 6px; border: 0; color: #fff8f6; background: #b54837; font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
  .hub-redesign .card-swipe-surface { position: relative; z-index: 1; border-radius: inherit; background: #fffefb; touch-action: pan-y; will-change: transform; }
  .hub-redesign .card-swipe-surface[data-dragging="true"] { transition: none; }
  .hub-redesign .card-swipe-surface[data-dragging="false"] { transition: transform 190ms var(--ease-out-expo); }
}
@media (max-width: 480px) {
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
:root[data-peerlock-theme="dark"] .hub-redesign .workspace-document-card { border-color: rgba(238,244,235,.16); background: #13211b; }
:root[data-peerlock-theme="dark"] .hub-redesign .card-swipe-surface, :root[data-peerlock-theme="dark"] .hub-redesign .workspace-document-card .document-card-main { color: #f2f8ef; background: #13211b; }
:root[data-peerlock-theme="dark"] .hub-redesign .workspace-document-card .document-card-type { color: #a9d66d; }
:root[data-peerlock-theme="dark"] .hub-redesign .workspace-document-card .document-card-date, :root[data-peerlock-theme="dark"] .hub-redesign .workspace-document-card .document-card-footer > span { color: rgba(235,244,235,.64); }
:root[data-peerlock-theme="dark"] .hub-redesign .workspace-document-card .document-card-heading h3 { color: #f5faf1; }
:root[data-peerlock-theme="dark"] .hub-redesign .workspace-document-card .document-card-footer { border-color: rgba(238,244,235,.14); }
:root[data-peerlock-theme="dark"] .hub-redesign .workspace-document-card .room-badge { color: #cceaa2; background: rgba(200,245,102,.11); }
:root[data-peerlock-theme="dark"] .hub-redesign .workspace-document-card .room-badge-live { color: #9fe7d8; background: rgba(79,179,156,.16); }
.hub-delete-dialog { width: min(332px,calc(100vw - 32px)); gap: 15px; border-color: rgba(237,244,234,.18); border-radius: 14px; padding: 20px; color: #f4f8f1; background: #14211b; box-shadow: 0 22px 60px rgba(0,0,0,.36); }
.hub-delete-dialog [data-slot="alert-dialog-header"] { gap: 7px; text-align: left; }
.hub-delete-dialog [data-slot="alert-dialog-title"] { color: #f6faf3; font-size: 19px; line-height: 1.1; letter-spacing: -.035em; }
.hub-delete-dialog [data-slot="alert-dialog-description"] { color: rgba(236,244,236,.68); font-size: 12px; line-height: 1.55; }
.hub-delete-dialog [data-slot="alert-dialog-footer"] { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.hub-delete-dialog [data-slot="alert-dialog-cancel"], .hub-delete-dialog .hub-delete-confirm { display: inline-flex; min-height: 40px; align-items: center; justify-content: center; border-radius: 8px; padding: 9px 10px; font-size: 11px; font-weight: 800; }
.hub-delete-dialog [data-slot="alert-dialog-cancel"] { margin: 0; border-color: rgba(237,244,234,.22); color: #edf5eb; background: transparent; }
.hub-delete-dialog .hub-delete-confirm { border: 1px solid #bf5748; color: #fff8f6; background: #b54837; }
`;

export function HubPage() {
  const [, navigate] = useLocation(); const { documents, loading, createDocument, removeDocument, profile } = useWorkspace(); const [roomCode, setRoomCode] = useState(""); const [joinError, setJoinError] = useState(""); const [swipedDocumentId, setSwipedDocumentId] = useState<string | null>(null); const [draggingDocumentId, setDraggingDocumentId] = useState<string | null>(null); const [dragOffset, setDragOffset] = useState(0); const [pendingRemoval, setPendingRemoval] = useState<{ id: string; title: string } | null>(null); const gestureRef = useRef<{ id: string; pointerId: number; startX: number; startY: number; horizontal: boolean } | null>(null); const suppressOpenRef = useRef<string | null>(null); const liveRooms = trpc.room.liveCount.useQuery(undefined, { refetchInterval: 15000 });
  const sharedDocumentCount = useMemo(() => documents.filter(document => Boolean(document.roomId)).length, [documents]);
  useEffect(() => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return; const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("hub-reveal-visible"); observer.unobserve(entry.target); } }), { threshold: .12 }); document.querySelectorAll(".hub-reveal").forEach(element => observer.observe(element)); return () => observer.disconnect(); }, []);
  const create = async () => { const document = await createDocument(); navigate(`/studio/${document.id}`); };
  const join = (event: React.FormEvent) => { event.preventDefault(); setJoinError(""); if (!/^[A-Z0-9]{8}$/i.test(roomCode)) { setJoinError("Enter the eight-character code from a real room invite."); return; } navigate(`/r/${roomCode.toUpperCase()}`); };
  const tiltHero = (event: React.PointerEvent<HTMLElement>) => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const bounds = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--hub-pointer-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 9}px`); event.currentTarget.style.setProperty("--hub-pointer-y", `${((event.clientY - bounds.top) / bounds.height - .5) * 8}px`); };
  const resetHero = (event: React.PointerEvent<HTMLElement>) => { event.currentTarget.style.setProperty("--hub-pointer-x", "0px"); event.currentTarget.style.setProperty("--hub-pointer-y", "0px"); };
  const requestRemoval = (id: string, title: string) => { setPendingRemoval({ id, title }); setSwipedDocumentId(null); };
  const beginCardSwipe = (id: string, event: React.PointerEvent<HTMLDivElement>) => { if (event.pointerType !== "touch") return; gestureRef.current = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, horizontal: false }; event.currentTarget.setPointerCapture(event.pointerId); };
  const moveCardSwipe = (id: string, event: React.PointerEvent<HTMLDivElement>) => { const gesture = gestureRef.current; if (!gesture || gesture.id !== id || gesture.pointerId !== event.pointerId) return; const deltaX = event.clientX - gesture.startX; const deltaY = event.clientY - gesture.startY; if (!gesture.horizontal && shouldBeginLeftSwipe(deltaX, deltaY)) gesture.horizontal = true; if (!gesture.horizontal) return; event.preventDefault(); suppressOpenRef.current = id; setDraggingDocumentId(id); setDragOffset(clampLeftSwipeOffset(deltaX)); };
  const finishCardSwipe = (id: string, event: React.PointerEvent<HTMLDivElement>) => { const gesture = gestureRef.current; if (!gesture || gesture.id !== id || gesture.pointerId !== event.pointerId) return; const shouldRevealDelete = shouldRevealMobileDelete(gesture.horizontal, event.clientX - gesture.startX); if (gesture.horizontal) suppressOpenRef.current = id; gestureRef.current = null; setDraggingDocumentId(null); setDragOffset(0); setSwipedDocumentId(shouldRevealDelete ? id : null); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };
  const cancelCardSwipe = (id: string, event: React.PointerEvent<HTMLDivElement>) => { const gesture = gestureRef.current; if (!gesture || gesture.id !== id || gesture.pointerId !== event.pointerId) return; gestureRef.current = null; setDraggingDocumentId(null); setDragOffset(0); setSwipedDocumentId(null); };
  const openDocument = (id: string) => { if (swipedDocumentId === id) { setSwipedDocumentId(null); return; } if (suppressOpenRef.current === id) { suppressOpenRef.current = null; return; } navigate(`/studio/${id}`); };
  const confirmRemoval = () => { if (!pendingRemoval) return; void removeDocument(pendingRemoval.id); setPendingRemoval(null); setSwipedDocumentId(null); };
  const liveCount = liveRooms.data ?? 0;

  return <ProfileGate><AppFrame><style>{hubMobileRepairStyles}</style><div className="hub-layout hub-redesign">
    <section className="hub-hero hub-reveal" onPointerMove={tiltHero} onPointerLeave={resetHero}>
      <div className="hub-hero-copy"><p className="hub-kicker"><Radio size={12} />Local-first studio <span>·</span>{liveCount} live now</p><h1>Documents<br /><span>without a cloud.</span></h1><p className="hub-hero-description">Build in private, work in your own rhythm, and invite approved peers only when an idea needs a second mind.</p><div className="hub-hero-stats"><span><b>{String(documents.length).padStart(2, "0")}</b><small>local drafts</small></span><span><b>{String(sharedDocumentCount).padStart(2, "0")}</b><small>shared rooms</small></span><span><b>0</b><small>server copies</small></span></div></div>
      <div className="hub-hero-visual" aria-hidden="true"><div className="hub-visual-grid" /><div className="hub-core"><i /><i /><i /><span><LockKeyhole size={18} /></span></div><p>Browser vault<br /><em>Encrypted peer mesh</em></p><div className="hub-visual-caption"><Sparkles size={14} />Your words stay with you.</div></div>
      <div className="hub-hero-actions"><button className="hub-action-primary" onClick={() => void create()}><FilePlus2 size={18} /><span>Start a note<small>Begin locally</small></span><ArrowUpRight size={17} /></button><button className="hub-action-secondary" onClick={() => document.getElementById("join-room")?.scrollIntoView({ behavior: "smooth", block: "center" })}><Link2 size={17} /><span>Join a room</span><ArrowUpRight size={16} /></button></div>
    </section>
    <section className="hub-library hub-reveal"><header><div><p className="eyebrow">The desk</p><h2>Open work</h2></div><p>{documents.length ? "Local drafts and approved rooms" : "Your browser is ready when you are."}</p></header>{loading ? <p className="loading">Opening local index…</p> : documents.length ? <div className="document-grid">{documents.map((document, index) => { const cardOffset = draggingDocumentId === document.id ? dragOffset : swipedDocumentId === document.id ? -94 : 0; return <article key={document.id} className="workspace-document-card hub-card-reveal" style={{ "--card-delay": `${index * 60}ms` } as React.CSSProperties}><div className="mobile-card-delete-reveal"><button onClick={() => requestRemoval(document.id, document.title)} aria-label={`Delete ${document.title}`}><Trash2 size={15} />Delete</button></div><div className="card-swipe-surface" data-dragging={draggingDocumentId === document.id} style={{ transform: `translateX(${cardOffset}px)` }} onPointerDown={event => beginCardSwipe(document.id, event)} onPointerMove={event => moveCardSwipe(document.id, event)} onPointerUp={event => finishCardSwipe(document.id, event)} onPointerCancel={event => cancelCardSwipe(document.id, event)}><button className="document-card-main" onClick={() => openDocument(document.id)}><div className="document-card-top"><span className="document-card-type">{document.roomId ? (document.roomProtected ? "Password room" : "Open room") : "Private draft"}</span><span className="document-card-date">{new Date(document.updatedAt).toLocaleDateString()}</span></div><div className="document-card-heading"><h3>{document.title}</h3><span className="document-card-open">Open <ArrowUpRight size={16} /></span></div><div className="document-card-footer"><RoomBadge connected={Boolean(document.roomId)} connectedLabel="Shared room" /><span>{document.roomId ? "Invite-controlled" : "Only this browser"}</span></div></button><button className="delete-note" onClick={() => requestRemoval(document.id, document.title)} aria-label={`Remove ${document.title}`}><Trash2 size={15} /></button></div></article>; })}</div> : <div className="empty-library hub-empty-library"><div><Sparkles size={18} /><p className="eyebrow">A clear desk</p><h3>Start with one private thought.</h3><p>It is stored in this browser first. No cloud account is needed for your words.</p></div><button onClick={() => void create()}>Create first note <ArrowUpRight size={16} /></button></div>}</section>
    <section id="join-room" className="join-room join-room-flow hub-join-terminal hub-reveal"><div className="join-room-copy"><p className="eyebrow">Verified room entry</p><h2>Bring a code.<br /><span>We’ll do the checking.</span></h2><p>We verify the room before asking for anything sensitive. A password is requested only when a protected room requires it.</p><ol className="join-room-steps"><li className="active"><span>01</span><b>Verify code</b><small>Check the room</small></li><li><span>02</span><b>Check protection</b><small>Ask only if needed</small></li><li><span>03</span><b>Request access</b><small>Owner decides</small></li></ol></div><form onSubmit={join}><label htmlFor="room-code">Room code<input id="room-code" value={roomCode} onChange={event => { setRoomCode(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase()); setJoinError(""); }} maxLength={8} inputMode="text" autoCapitalize="characters" autoComplete="off" placeholder="AB12CD34" aria-describedby="room-code-help" /></label><p id="room-code-help" className="join-room-help"><ShieldCheck size={15} />Password checks happen only after the room code is verified.</p>{joinError && <p className="join-error" role="alert">{joinError}</p>}<button type="submit" disabled={!profile}>Continue securely <ArrowUpRight size={16} /></button></form></section>
  </div><AlertDialog open={Boolean(pendingRemoval)} onOpenChange={open => { if (!open) setPendingRemoval(null); }}><AlertDialogContent className="hub-delete-dialog"><AlertDialogHeader><AlertDialogTitle>Delete this item?</AlertDialogTitle><AlertDialogDescription>{pendingRemoval ? `Remove “${pendingRemoval.title}” from this browser only? Other approved peers keep their own local copies.` : ""}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep item</AlertDialogCancel><AlertDialogAction className="hub-delete-confirm" onClick={confirmRemoval}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></AppFrame></ProfileGate>;
}
