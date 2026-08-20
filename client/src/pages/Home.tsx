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
  const { documents, loading, createDocument, createOrOpenRoom, deleteDocument } = useWorkspace();
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (!isInviteRoute) return;
    const invite = readInviteFromLocation();
    if (!invite.roomCode || !invite.roomSecret) {
      setInviteError("This private room needs its full invite link, including the #key fragment.");
      return;
    }
    let cancelled = false;
    void createOrOpenRoom(invite.roomCode, invite.roomSecret).then(document => {
      if (!cancelled) setLocation(`/editor/${document.id}`);
    });
    return () => { cancelled = true; };
  }, [createOrOpenRoom, isInviteRoute, setLocation]);

  const createLocalWorkspace = async () => {
    const document = await createDocument();
    setLocation(`/editor/${document.id}`);
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl">
        {inviteError && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#F4B860]/25 bg-[#F4B860]/[0.08] px-4 py-3 text-xs leading-5 text-[#EBC98C]"><LockKeyhole className="h-4 w-4 shrink-0" />{inviteError}</div>}
        <div className="grid items-end gap-7 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7FE6CA]">Your private workspace</p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-[40px]">Write locally. <span className="text-[#77E6C5]">Collaborate directly.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#96A2B8]">Create a private document in this browser, or open an encrypted peer room. There is no document cloud to trust.</p>
            <div className="mt-6"><RoomDialogs /></div>
          </div>
          <div className="space-y-3">
            <PrivateMeshVisual />
            <div className="grid grid-cols-3 gap-3">{[
              { value: documents.length, label: "local docs", icon: FileText, color: "text-[#7FE6CA]" },
              { value: "10", label: "peers max", icon: RadioTower, color: "text-[#B6ACFF]" },
              { value: "0", label: "cloud copies", icon: CloudOff, color: "text-[#F6BF73]" },
            ].map(item => <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-[#111722]/70 px-4 py-4"><item.icon className={`h-4 w-4 ${item.color}`} /><p className="mt-5 text-xl font-semibold tracking-[-0.04em] text-white">{item.value}</p><p className="mt-1 text-[11px] text-[#79869D]">{item.label}</p></div>)}</div>
          </div>
        </div>

        <section className="mt-10 overflow-hidden rounded-3xl border border-white/[0.09] bg-[#101620]/80">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <div><h2 className="text-sm font-semibold text-[#ECF0F8]">Local documents</h2><p className="mt-1 text-xs text-[#7C899F]">{privacyCopy.localVault}</p></div>
            <button onClick={createLocalWorkspace} className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.11] bg-white/[0.03] px-3 text-xs font-semibold text-[#DBE3EF] hover:bg-white/[0.08]"><LockKeyhole className="h-3.5 w-3.5 text-[#7FE6CA]" />New local doc</button>
          </div>
          {loading ? <div className="grid min-h-60 place-items-center text-sm text-[#8290A6]">Opening local vault…</div> : documents.length === 0 ? (
            <div className="grid min-h-64 place-items-center px-5 text-center">
              <div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-[#7FE6CA]"><FileText className="h-5 w-5" /></span><h3 className="mt-4 text-base font-semibold text-white">Nothing stored remotely. Nothing stored yet.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7C899F]">Start a local document, then choose whether to share it with a private peer room.</p><button onClick={createLocalWorkspace} className="mt-5 text-sm font-semibold text-[#7FE6CA] hover:text-white">Create your first workspace <ArrowUpRight className="inline h-4 w-4" /></button></div>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {documents.map(document => <div key={document.id} className="group flex items-center gap-4 px-5 py-4 sm:px-6">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-[#9FAABD]"><FileText className="h-4 w-4" /></span>
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
