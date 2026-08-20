import type { Editor } from "@tiptap/core";
import { AppShell } from "@/components/AppShell";
import { CollaborativeEditor } from "@/components/CollaborativeEditor";
import { ConnectionGraph } from "@/components/ConnectionGraph";
import { RoomChat } from "@/components/RoomChat";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCollaborationDocument } from "@/hooks/useCollaborationDocument";
import { downloadTextFile, editorJsonToMarkdown, editorJsonToPlainText } from "@/lib/export";
import { autoFormatEditor } from "@/lib/autoFormat";
import { buildInviteUrl, createRoomCode, createRoomSecret } from "@/lib/room";
import { privacyCopy } from "@/lib/privacy";
import type { ConnectionState, LocalDocument } from "@/lib/workspace";
import { Check, ChevronLeft, Copy, Download, FileText, Globe2, Loader2, Pencil, ShieldCheck, Users, WifiOff, Wifi, WandSparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";

function connectionDetails(state: ConnectionState, isCollaborative: boolean) {
  if (!isCollaborative) return { label: "Local-only", text: "This document is persisted only in this browser. Start a private room to collaborate directly.", icon: FileText, tone: "text-[#9FAABD]" };
  if (state === "loading-local") return { label: "Restoring", text: "Loading your local replica before peer synchronization begins.", icon: Loader2, tone: "text-[#F4C477]" };
  if (state === "offline") return { label: "Offline", text: "Edits remain safely in IndexedDB and will sync after you reconnect to room peers.", icon: WifiOff, tone: "text-[#F4C477]" };
  if (state === "error") return { label: "Local replica active", text: "Peer sync could not start. Your document has not been sent to an application server.", icon: ShieldCheck, tone: "text-[#FF9EAE]" };
  if (state === "synced") return { label: "Encrypted peers active", text: privacyCopy.directSync, icon: ShieldCheck, tone: "text-[#78E9C7]" };
  return { label: "Ready for encrypted peers", text: "Share the complete invite link; the private key never appears in the request sent to this app.", icon: Globe2, tone: "text-[#BAAEFF]" };
}

function getFilename(title: string, extension: string) {
  const stem = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "peerlock-document";
  return `${stem}.${extension}`;
}

export default function EditorPage() {
  const [, params] = useRoute("/editor/:id");
  const [, setLocation] = useLocation();
  const { documents, profile, renameDocument, refreshDocuments, attachRoom } = useWorkspace();
  const document = documents.find(item => item.id === params?.id);
  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [formatted, setFormatted] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => setTitle(document?.title ?? ""), [document?.id, document?.title]);
  const onActivity = useCallback(() => { void refreshDocuments(); }, [refreshDocuments]);
  const collaboration = useCollaborationDocument({ document: document ?? ({ id: "missing", title: "", createdAt: 0, updatedAt: 0 } as LocalDocument), profile, onActivity });

  const rename = async () => {
    if (!document) return;
    const updated = await renameDocument(document.id, title);
    if (updated) setTitle(updated.title);
  };

  const copyInvite = async () => {
    if (!document?.roomCode || !document.roomSecret) return;
    await navigator.clipboard.writeText(buildInviteUrl(document.roomCode, document.roomSecret));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const startPrivateRoom = async () => {
    if (!document || document.roomCode) return;
    await attachRoom(document.id, createRoomCode(), createRoomSecret());
  };

  const exportDocument = (kind: "txt" | "md") => {
    if (!editorRef.current) return;
    const json = editorRef.current.getJSON();
    const content = kind === "md" ? editorJsonToMarkdown(json) : editorJsonToPlainText(json);
    downloadTextFile(getFilename(document?.title ?? "peerlock-document", kind), content, kind === "md" ? "text/markdown" : "text/plain");
  };

  const autoFormat = () => {
    if (!editorRef.current) return;
    if (!window.confirm("Auto-format will normalize the current document into headings, lists, quotes, and code blocks. Continue?")) return;
    autoFormatEditor(editorRef.current);
    setFormatted(true);
    window.setTimeout(() => setFormatted(false), 2600);
  };

  if (!document) {
    return <AppShell><div className="grid min-h-[60vh] place-items-center"><div className="text-center"><FileText className="mx-auto h-7 w-7 text-[#7FE6CA]" /><h1 className="mt-4 text-xl font-semibold text-white">Document unavailable</h1><p className="mt-2 text-sm text-[#8794A9]">It may have been removed from this browser.</p><button className="mt-5 text-sm font-semibold text-[#7FE6CA]" onClick={() => setLocation("/")}>Return to local documents</button></div></div></AppShell>;
  }

  const details = connectionDetails(collaboration.connectionState, collaboration.isCollaborative);
  const StatusIcon = details.icon;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1480px]">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button onClick={() => setLocation("/")} className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-[#8694AA] hover:bg-white/[0.06] hover:text-white"><ChevronLeft className="h-3.5 w-3.5" />All documents</button>
          <span className="hidden h-4 w-px bg-white/[0.1] sm:block" />
          <div className="min-w-0 flex-1">
            <input value={title} onChange={event => setTitle(event.target.value)} onBlur={() => void rename()} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} className="w-full max-w-xl bg-transparent text-lg font-semibold tracking-[-0.025em] text-white outline-none placeholder:text-[#758299]" aria-label="Document title" />
          </div>
          <button onClick={() => void rename()} className="grid h-8 w-8 place-items-center rounded-lg text-[#7D8AA0] hover:bg-white/[0.06] hover:text-[#B9C4D4]" aria-label="Save title"><Pencil className="h-3.5 w-3.5" /></button>
          <div className="hidden rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 text-[11px] text-[#95A1B7] sm:block">{document.roomCode ? `Room ${document.roomCode}` : "Local document"}</div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#111722]/68 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] ${details.tone}`}><StatusIcon className={`h-4 w-4 ${collaboration.connectionState === "loading-local" ? "animate-spin" : ""}`} /></span><div className="min-w-0"><p className="text-xs font-semibold text-[#E4EAF5]">{details.label}</p><p className="mt-0.5 max-w-2xl truncate text-[11px] text-[#8190A6]">{details.text}</p></div></div>
              <div className="flex items-center gap-2">
                {document.roomCode ? <button onClick={copyInvite} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#7FE6CA]/20 bg-[#7FE6CA]/[0.06] px-2.5 text-[11px] font-semibold text-[#A8F1DC] hover:bg-[#7FE6CA]/[0.13]">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy invite"}</button> : <button onClick={() => void startPrivateRoom()} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#B8AFFF]/20 bg-[#B8AFFF]/[0.07] px-2.5 text-[11px] font-semibold text-[#D0C9FF] hover:bg-[#B8AFFF]/[0.14]"><Wifi className="h-3.5 w-3.5" />Share as room</button>}
                <button onClick={autoFormat} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#F4C477]/30 bg-[#F4C477]/[0.08] px-2.5 text-[11px] font-semibold text-[#F7D79D] hover:bg-[#F4C477]/[0.16]"><WandSparkles className="h-3.5 w-3.5" />{formatted ? "Formatted" : "Auto-format"}</button>
                <div className="group relative"><button className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.035] px-2.5 text-[11px] font-semibold text-[#C4CDDB] hover:bg-white/[0.08]"><Download className="h-3.5 w-3.5" />Export</button><div className="invisible absolute right-0 top-9 z-20 w-36 rounded-xl border border-white/[0.1] bg-[#18202E] p-1 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"><button onClick={() => exportDocument("txt")} className="w-full rounded-lg px-3 py-2 text-left text-xs text-[#D8E0EC] hover:bg-white/[0.08]">Plain text (.txt)</button><button onClick={() => exportDocument("md")} className="w-full rounded-lg px-3 py-2 text-left text-xs text-[#D8E0EC] hover:bg-white/[0.08]">Markdown (.md)</button></div></div>
              </div>
            </div>
            {collaboration.ydoc ? <CollaborativeEditor key={document.id} ydoc={collaboration.ydoc} provider={collaboration.provider} profile={profile} onReady={editor => { editorRef.current = editor; }} /> : <div className="grid min-h-[500px] place-items-center rounded-2xl border border-white/[0.08] bg-[#111722]/70 text-sm text-[#8190A6]"><Loader2 className="mr-2 h-4 w-4 animate-spin text-[#7FE6CA]" />Opening local document…</div>}
          </div>

          <aside className="space-y-4">
            <ConnectionGraph peers={collaboration.peers} connectionState={collaboration.connectionState} directPeerCount={collaboration.directPeerCount} roomCapacity={collaboration.roomCapacity} />
            {collaboration.ydoc && <RoomChat ydoc={collaboration.ydoc} profile={profile} peers={collaboration.peers} enabled={collaboration.isCollaborative} />}
            <section className="rounded-2xl border border-white/[0.09] bg-[#111722]/84 p-4">
              <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-[#E7ECF6]">Presence</h3><p className="mt-1 text-[11px] text-[#7B889E]">Awareness is ephemeral</p></div><span className="flex items-center gap-1 text-[11px] text-[#7FE6CA]"><Users className="h-3.5 w-3.5" />{collaboration.peers.length}/10</span></div>
              <div className="mt-3 space-y-2.5">{collaboration.peers.map(peer => <div key={peer.clientId} className="flex items-center gap-2.5"><span className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-[#091018]" style={{ backgroundColor: peer.color }}>{peer.name.slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-xs font-medium text-[#D7DEEA]">{peer.name}{peer.isLocal ? " (you)" : ""}</span><span className={`h-1.5 w-1.5 rounded-full ${peer.isDirect ? "bg-[#78E7C6]" : "bg-[#F4C477]"}`} /></div>)}</div>
              {collaboration.roomCapacity !== "within-limit" && <p className={`mt-3 rounded-lg px-2.5 py-2 text-[10px] leading-4 ${collaboration.roomCapacity === "above-limit" ? "bg-[#FF9EAE]/10 text-[#FFB1BE]" : "bg-[#F4C477]/10 text-[#F7D79D]"}`}>{collaboration.roomCapacity === "above-limit" ? "This room exceeds the supported 10-participant scope. A serverless mesh cannot authoritatively reject extra peers; use a smaller room for predictable performance." : "This room has reached its supported 10-participant capacity."}</p>}
            </section>
            <section className="rounded-2xl border border-[#7FE6CA]/13 bg-[#63E8C4]/[0.045] p-4"><div className="flex gap-2.5"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7FE6CA]" /><div><h3 className="text-xs font-semibold text-[#D7F7ED]">Privacy scope</h3><p className="mt-1.5 text-[11px] leading-5 text-[#A2C5BB]">{privacyCopy.preciseScope}</p></div></div></section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
