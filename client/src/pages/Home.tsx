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

  return <AppShell><section className="vault-index">
    {inviteError && <div className="vault-alert"><LockKeyhole className="h-4 w-4" />{inviteError}</div>}
    <header className="vault-hero"><div className="vault-hero-meta"><span>PRIVATE DOCUMENT VAULT</span><span>{String(documents.length).padStart(2, "0")} DOCUMENTS</span></div><h1><span>YOUR</span><em>WORDS.</em><b>YOUR</b><strong>NODE.</strong></h1><div className="vault-hero-bottom"><p>Compose in a private local replica. Invite peers only when the document is ready to leave your device—directly, encrypted, and without a content server in between.</p><RoomDialogs /></div><div className="vault-orbit" aria-hidden="true"><span /><i /><b /></div></header>
    <section className="vault-ledger"><div className="vault-ledger-head"><div><span className="vault-section-index">01 / DOCUMENTS</span><h2>Workspace ledger</h2></div><button onClick={createLocalWorkspace} className="vault-create"><FilePlus2 className="h-4 w-4" />Create local document</button></div>
      {loading ? <div className="vault-loading">SYNCING LOCAL INDEX<span>.</span><span>.</span><span>.</span></div> : documents.length === 0 ? <div className="vault-empty"><span className="vault-empty-icon"><FileText className="h-5 w-5" /></span><h3>The vault is empty.</h3><p>Start with a private local document. Nothing is uploaded simply because you began writing.</p><button onClick={createLocalWorkspace}>Create your first document <ArrowUpRight className="h-4 w-4" /></button></div> : <div className="vault-list">{documents.map((document, index) => { const mode = documentMode(document.roomCode); return <article className="vault-record" key={document.id}><span className="vault-record-number">{String(index + 1).padStart(2, "0")}</span><button onClick={() => setLocation(`/editor/${document.id}`)} className="vault-record-main"><span className="vault-record-title">{document.title}</span><span className="vault-record-sub">Edited {formatDistanceToNowStrict(document.updatedAt, { addSuffix: true })}</span></button><span className="vault-record-mode"><mode.icon className="h-3.5 w-3.5" />{mode.label}</span><button onClick={() => setLocation(`/editor/${document.id}`)} className="vault-record-open">OPEN <ArrowUpRight className="h-3.5 w-3.5" /></button><button onClick={() => { if (confirm(`Delete “${document.title}” from this device?`)) void deleteDocument(document.id); }} className="vault-record-delete" aria-label={`Delete ${document.title}`}><Trash2 className="h-3.5 w-3.5" /></button></article>; })}</div>}
    </section>
    <footer className="vault-footer"><span><i />PERSISTED IN THIS BROWSER</span><span>PEERLOCK / LOCAL-FIRST COLLABORATION</span><span>{documents.length ? "READY FOR DIRECT PEER SYNC" : "NO CONTENT LEAVES THIS DEVICE"}</span></footer>
  </section></AppShell>;
}
