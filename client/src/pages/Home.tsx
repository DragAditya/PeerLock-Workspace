import { AppShell } from "@/components/AppShell";
import { RoomDialogs } from "@/components/RoomDialogs";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { readInviteFromLocation } from "@/lib/room";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowUpRight, FilePlus2, FileText, LockKeyhole, RadioTower, Trash2, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";

function documentMode(roomCode?: string) {
  return roomCode ? { label: `LIVE / ${roomCode}`, icon: RadioTower } : { label: "LOCAL / ONLY", icon: Wifi };
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [isInviteRoute] = useRoute("/room/:roomCode");
  const [isShortInviteRoute] = useRoute("/r/:roomCode");
  const { documents, loading, createDocument, createOrOpenRoom, deleteDocument } = useWorkspace();
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (!isInviteRoute && !isShortInviteRoute) return;
    const invite = readInviteFromLocation();
    if (!invite.roomCode || !invite.roomSecret) { setInviteError("This secure room needs the full invite address, including its private fragment."); return; }
    let cancelled = false;
    void createOrOpenRoom(invite.roomCode, invite.roomSecret).then(document => { if (!cancelled) setLocation(`/editor/${document.id}`); });
    return () => { cancelled = true; };
  }, [createOrOpenRoom, isInviteRoute, isShortInviteRoute, setLocation]);

  const createLocalWorkspace = async () => { const document = await createDocument(); setLocation(`/editor/${document.id}`); };

  return <AppShell><section className="relay-vault">
    {inviteError && <div className="relay-alert"><LockKeyhole className="h-4 w-4" />{inviteError}</div>}
    <header className="relay-vault-hero"><div className="relay-hero-kicker"><span>01 / PRIVATE WRITING TERRITORY</span><span>{String(documents.length).padStart(2, "0")} LOCAL FILES</span></div><div className="relay-hero-wordmark"><p>THE</p><h1>RELAY<br /><em>ROOM</em></h1><div className="relay-hero-signal" aria-hidden="true"><i /><i /><i /><i /></div></div><div className="relay-hero-foot"><p>A shared writing workspace that starts on your device. Make a room only when you are ready to sync directly with people you trust.</p><div><button onClick={createLocalWorkspace} className="relay-hero-create"><FilePlus2 className="h-4 w-4" /><span>Start a private draft</span><ArrowUpRight className="h-4 w-4" /></button><RoomDialogs /></div></div><div className="relay-hero-grid" aria-hidden="true"><i /><i /><i /><i /><i /></div></header>
    <section className="relay-document-section"><div className="relay-document-heading"><div><span>02 / ON THIS DEVICE</span><h2>Your active<br /><em>material.</em></h2></div><p>Every document is held by the browser you are using. Peer mode adds encrypted direct synchronization—never a cloud content database.</p></div>
      {loading ? <div className="relay-loading">INDEXING YOUR LOCAL MATERIAL <span>•</span><span>•</span><span>•</span></div> : documents.length === 0 ? <div className="relay-empty"><div><FileText className="h-5 w-5" /><span>NO MATERIAL YET</span></div><h3>Blank is a good place<br />to begin.</h3><p>Create a first local document and it stays in this browser until you decide to share a private room.</p><button onClick={createLocalWorkspace}>Make a local draft <ArrowUpRight className="h-4 w-4" /></button></div> : <div className="relay-document-list">{documents.map((document, index) => { const mode = documentMode(document.roomCode); return <article className="relay-document-row" key={document.id}><span className="relay-document-index">{String(index + 1).padStart(2, "0")}</span><button onClick={() => setLocation(`/editor/${document.id}`)} className="relay-document-main"><b>{document.title}</b><small>Edited {formatDistanceToNowStrict(document.updatedAt, { addSuffix: true })}</small></button><span className="relay-document-mode"><mode.icon className="h-3.5 w-3.5" />{mode.label}</span><button onClick={() => setLocation(`/editor/${document.id}`)} className="relay-document-open"><span>ENTER</span><ArrowUpRight className="h-4 w-4" /></button><button onClick={() => { if (confirm(`Delete “${document.title}” from this device?`)) void deleteDocument(document.id); }} className="relay-document-delete" aria-label={`Delete ${document.title}`}><Trash2 className="h-3.5 w-3.5" /></button></article>; })}</div>}
    </section>
    <footer className="relay-vault-proof"><span><i />BROWSER-PERSISTED</span><span>PEERLOCK / NO CENTRAL REPLICA</span><span>{documents.length ? "DIRECT MESH AVAILABLE" : "YOUR FIRST WORD STAYS LOCAL"}</span></footer>
  </section></AppShell>;
}
