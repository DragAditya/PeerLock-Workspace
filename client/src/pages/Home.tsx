import { AppShell } from "@/components/AppShell";
import { RoomDialogs } from "@/components/RoomDialogs";
import { PrivateMeshVisual } from "@/components/PrivateMeshVisual";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { readInviteFromLocation } from "@/lib/room";
import { privacyCopy } from "@/lib/privacy";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowUpRight, CloudOff, FileText, LockKeyhole, MoreHorizontal, RadioTower, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isInviteRoute] = useRoute("/room/:roomCode");
  const [isShortInviteRoute] = useRoute("/r/:roomCode");
  const { documents, loading, createDocument, createOrOpenRoom, deleteDocument } = useWorkspace();
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (!isInviteRoute && !isShortInviteRoute) return;
    const invite = readInviteFromLocation();
    if (!invite.roomCode || !invite.roomSecret) {
      setInviteError("This private room needs its complete compact invite link, including the secret after #.");
      return;
    }
    let cancelled = false;
    void createOrOpenRoom(invite.roomCode, invite.roomSecret).then(document => {
      if (!cancelled) setLocation(`/editor/${document.id}`);
    });
    return () => { cancelled = true; };
  }, [createOrOpenRoom, isInviteRoute, isShortInviteRoute, setLocation]);

  const createLocalWorkspace = async () => {
    const document = await createDocument();
    setLocation(`/editor/${document.id}`);
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl">
        {inviteError && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#F4B860]/25 bg-[#F4B860]/[0.08] px-4 py-3 text-xs leading-5 text-[#EBC98C]"><LockKeyhole className="h-4 w-4 shrink-0" />{inviteError}</div>}
        <div className="dashboard-hero grid items-end gap-7 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="dashboard-hero-copy">
            <p className="glass-kicker mb-4">Private collaboration, made tangible</p>
            <h1 className="dashboard-title max-w-2xl text-4xl font-semibold tracking-[-0.065em] sm:text-[52px]">Write on your device. <span>Meet directly.</span></h1>
            <p className="dashboard-lede mt-5 max-w-xl text-[15px] leading-7">A local-first workspace for documents that should never become another cloud record. Create privately, then choose exactly when to open a peer room.</p>
            <div className="mt-7"><RoomDialogs /></div>
          </div>
          <div className="dashboard-visual space-y-3">
            <PrivateMeshVisual />
            <div className="grid grid-cols-3 gap-3">{[
              { value: documents.length, label: "local docs", icon: FileText, color: "text-[#7FE6CA]" },
              { value: "10", label: "peers max", icon: RadioTower, color: "text-[#B6ACFF]" },
              { value: "0", label: "cloud copies", icon: CloudOff, color: "text-[#F6BF73]" },
            ].map(item => <div key={item.label} className="glass-stat px-4 py-4"><item.icon className={`h-4 w-4 ${item.color}`} /><p className="mt-5 text-xl font-semibold tracking-[-0.04em] text-white">{item.value}</p><p className="mt-1 text-[11px] text-[#79869D]">{item.label}</p></div>)}</div>
          </div>
        </div>

        <section className="glass-panel mt-11 overflow-hidden rounded-[24px]">
          <div className="glass-panel-header flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
            <div><h2 className="text-sm font-semibold text-[#ECF0F8]">Local documents</h2><p className="mt-1 text-xs text-[#7C899F]">{privacyCopy.localVault}</p></div>
            <button onClick={createLocalWorkspace} className="glass-secondary-action flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold"><LockKeyhole className="h-3.5 w-3.5" />New local doc</button>
          </div>
          {loading ? <div className="grid min-h-60 place-items-center text-sm text-[#8290A6]">Opening local vault…</div> : documents.length === 0 ? (
            <div className="grid min-h-64 place-items-center px-5 text-center">
              <div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-[#7FE6CA]"><FileText className="h-5 w-5" /></span><h3 className="mt-4 text-base font-semibold text-white">Nothing stored remotely. Nothing stored yet.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7C899F]">Start a local document, then choose whether to share it with a private peer room.</p><button onClick={createLocalWorkspace} className="mt-5 text-sm font-semibold text-[#7FE6CA] hover:text-white">Create your first workspace <ArrowUpRight className="inline h-4 w-4" /></button></div>
            </div>
          ) : (
            <div className="glass-document-list">
              {documents.map(document => <div key={document.id} className="glass-document-row group flex items-center gap-4 px-5 py-4 sm:px-6">
                <span className="glass-document-icon grid h-9 w-9 shrink-0 place-items-center rounded-xl"><FileText className="h-4 w-4" /></span>
                <button className="min-w-0 flex-1 text-left" onClick={() => setLocation(`/editor/${document.id}`)}><span className="block truncate text-sm font-semibold text-[#E8EDF6] group-hover:text-[#87E9CC]">{document.title}</span><span className="mt-1 block text-[11px] text-[#748198]">{document.roomCode ? `Private room ${document.roomCode}` : "Local-only document"} · edited {formatDistanceToNowStrict(document.updatedAt, { addSuffix: true })}</span></button>
                <button onClick={() => setLocation(`/editor/${document.id}`)} className="hidden h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-[#AAB4C5] hover:bg-white/[0.07] hover:text-white sm:flex">Open <ArrowUpRight className="h-3.5 w-3.5" /></button>
                <button onClick={() => { if (confirm(`Delete “${document.title}” from this browser?`)) void deleteDocument(document.id); }} className="grid h-8 w-8 place-items-center rounded-lg text-[#6F7C91] opacity-100 hover:bg-[#FF98AA]/10 hover:text-[#FF9AAD] sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Delete ${document.title}`}><Trash2 className="h-3.5 w-3.5" /></button>
                <MoreHorizontal className="hidden h-4 w-4 text-[#617087] sm:block" />
              </div>)}
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
