import type { Editor } from "@tiptap/core";
import { AppShell } from "@/components/AppShell";
import { CollaborativeEditor } from "@/components/CollaborativeEditor";
import { ConnectionGraph } from "@/components/ConnectionGraph";
import { RoomChat } from "@/components/RoomChat";
import { AiFormatDialog } from "@/components/AiFormatDialog";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCollaborationDocument } from "@/hooks/useCollaborationDocument";
import { downloadTextFile, editorJsonToMarkdown, editorJsonToPlainText } from "@/lib/export";
import { autoFormatEditor, formatTechnicalText } from "@/lib/autoFormat";
import { buildInviteUrl, createRoomCode, createRoomSecret } from "@/lib/room";
import { privacyCopy } from "@/lib/privacy";
import { isExternalAiAllowed } from "@/lib/workspace";
import { calculateTextStats, calculateWritingProgress, describeMeshActivity } from "@/lib/documentIntelligence";
import type { ConnectionState, LocalDocument } from "@/lib/workspace";
import { Activity, BarChart3, Check, ChevronLeft, ChevronRight, CircleDot, Copy, Download, FileText, Focus, Globe2, History, ListTree, Loader2, LockKeyhole, PanelRightOpen, Pencil, ShieldCheck, ShieldOff, Sparkles, Target, Users, WifiOff, Wifi, WandSparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation, useRoute } from "wouter";

type ActivityTone = "mint" | "violet" | "gold" | "muted";
type ActivityEntry = { id: string; label: string; meta: string; tone: ActivityTone };
type OutlineItem = { id: string; level: number; position: number; text: string };

function connectionDetails(state: ConnectionState, isCollaborative: boolean) {
  if (!isCollaborative) return { label: "Local-only replica", text: "This document is persisted only in this browser. Start a private room to collaborate directly.", icon: FileText, tone: "text-[#9FAABD]" };
  if (state === "loading-local") return { label: "Restoring replica", text: "Loading your local replica before peer synchronization begins.", icon: Loader2, tone: "text-[#F4C477]" };
  if (state === "offline") return { label: "Offline-safe editing", text: "Edits remain in IndexedDB and will sync after you reconnect to room peers.", icon: WifiOff, tone: "text-[#F4C477]" };
  if (state === "error") return { label: "Local replica active", text: "Peer sync could not start. Your document has not been sent to an application server.", icon: ShieldCheck, tone: "text-[#FF9EAE]" };
  if (state === "synced") return { label: "Encrypted peers active", text: privacyCopy.directSync, icon: ShieldCheck, tone: "text-[#78E9C7]" };
  return { label: "Ready for encrypted peers", text: "Share the complete invite link; the private key never appears in the request sent to this app.", icon: Globe2, tone: "text-[#BAAEFF]" };
}

function getFilename(title: string, extension: string) {
  const stem = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "peerlock-document";
  return `${stem}.${extension}`;
}

function activityTimestamp() { return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date()); }
function peerInitial(name: string) { return name.trim().slice(0, 1).toUpperCase() || "P"; }

export default function EditorPage() {
  const [, params] = useRoute("/editor/:id");
  const [, setLocation] = useLocation();
  const { documents, profile, renameDocument, refreshDocuments, attachRoom, setDocumentExternalAiEnabled } = useWorkspace();
  const document = documents.find(item => item.id === params?.id);
  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [formatted, setFormatted] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [editorRevision, setEditorRevision] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [mobilePanelsOpen, setMobilePanelsOpen] = useState(false);
  const [writingTarget, setWritingTarget] = useState(800);
  const [activityFeed, setActivityFeed] = useState<ActivityEntry[]>([]);
  const editorRef = useRef<Editor | null>(null);
  const lastActivityAt = useRef(0);

  useEffect(() => setTitle(document?.title ?? ""), [document?.id, document?.title]);
  useEffect(() => { editorRef.current = null; setEditorInstance(null); setEditorRevision(0); setActivityFeed([{ id: `mounted-${document?.id ?? "missing"}`, label: "Local replica initialized", meta: "Browser-only workspace", tone: "mint" }]); }, [document?.id]);

  const onActivity = useCallback(() => { void refreshDocuments(); }, [refreshDocuments]);
  const collaboration = useCollaborationDocument({ document: document ?? ({ id: "missing", title: "", createdAt: 0, updatedAt: 0 } as LocalDocument), profile, onActivity });
  const pushActivity = useCallback((label: string, tone: ActivityTone, meta = activityTimestamp()) => { setActivityFeed(current => [{ id: `${Date.now()}-${Math.random()}`, label, meta, tone }, ...current].slice(0, 5)); }, []);

  useEffect(() => {
    const peerCount = collaboration.peers.filter(peer => !peer.isLocal).length;
    const label = describeMeshActivity(peerCount, collaboration.isCollaborative);
    pushActivity(label, peerCount ? "violet" : "muted", collaboration.isCollaborative ? activityTimestamp() : "Local only");
  }, [collaboration.directPeerCount, collaboration.isCollaborative, collaboration.peers.length, pushActivity]);

  const registerEditorUpdate = useCallback(() => {
    setEditorRevision(current => current + 1);
    if (Date.now() - lastActivityAt.current > 12000) { lastActivityAt.current = Date.now(); pushActivity("Writing activity captured locally", "mint"); }
  }, [pushActivity]);

  useEffect(() => {
    if (!editorInstance) return;
    const onUpdate = () => registerEditorUpdate();
    editorInstance.on("update", onUpdate);
    registerEditorUpdate();
    return () => { editorInstance.off("update", onUpdate); };
  }, [editorInstance, registerEditorUpdate]);

  const insights = useMemo(() => {
    if (!editorInstance) return { words: 0, characters: 0, paragraphs: 0, readingMinutes: 0, outline: [] as OutlineItem[] };
    const stats = calculateTextStats(editorInstance.getText());
    const outline: OutlineItem[] = [];
    let paragraphs = 0;
    editorInstance.state.doc.descendants((node, position) => {
      if (node.type.name === "paragraph" && node.textContent.trim()) paragraphs += 1;
      if (node.type.name === "heading" && node.textContent.trim()) outline.push({ id: `heading-${position}`, position, level: Number(node.attrs.level ?? 1), text: node.textContent.trim() });
    });
    return { ...stats, paragraphs, outline };
  }, [editorInstance, editorRevision]);

  const writingProgress = calculateWritingProgress(insights.words, writingTarget);
  const remainingWords = Math.max(0, writingTarget - insights.words);
  const rename = async () => { if (!document) return; const updated = await renameDocument(document.id, title); if (updated) setTitle(updated.title); };
  const copyInvite = async () => { if (!document?.roomCode || !document.roomSecret) return; await navigator.clipboard.writeText(buildInviteUrl(document.roomCode, document.roomSecret)); setCopied(true); pushActivity("Private invite copied", "violet", "Secret remains in URL fragment"); window.setTimeout(() => setCopied(false), 1800); };
  const startPrivateRoom = async () => { if (!document || document.roomCode) return; await attachRoom(document.id, createRoomCode(), createRoomSecret()); pushActivity("Private collaboration room created", "violet", "Encrypted peer mesh ready"); };
  const exportDocument = (kind: "txt" | "md") => { if (!editorRef.current) return; const json = editorRef.current.getJSON(); const content = kind === "md" ? editorJsonToMarkdown(json) : editorJsonToPlainText(json); downloadTextFile(getFilename(document?.title ?? "peerlock-document", kind), content, kind === "md" ? "text/markdown" : "text/plain"); };
  const autoFormat = () => { if (!editorRef.current) return; if (!window.confirm("Auto-format will normalize the current document into headings, lists, quotes, and code blocks. Continue?")) return; autoFormatEditor(editorRef.current); setFormatted(true); pushActivity("Browser-only formatting completed", "gold", "No text sent to a server"); window.setTimeout(() => setFormatted(false), 2600); };
  const applyAiFormatting = (markdown: string) => { if (!editorRef.current) return; editorRef.current.commands.setContent(formatTechnicalText(markdown)); setFormatted(true); pushActivity("Approved AI formatting applied", "violet", "Preview accepted by you"); window.setTimeout(() => setFormatted(false), 2600); };
  const jumpToHeading = (item: OutlineItem) => { if (!editorRef.current) return; editorRef.current.chain().focus().setTextSelection(item.position).scrollIntoView().run(); setMobilePanelsOpen(false); };
  const aiAllowed = document ? isExternalAiAllowed(document) : false;
  const toggleAiPrivacy = () => { if (document) void setDocumentExternalAiEnabled(document.id, !aiAllowed); };

  if (!document) return <AppShell><div className="grid min-h-[60vh] place-items-center"><div className="text-center"><FileText className="mx-auto h-7 w-7 text-[#7FE6CA]" /><h1 className="mt-4 text-xl font-semibold text-white">Document unavailable</h1><p className="mt-2 text-sm text-[#8794A9]">It may have been removed from this browser.</p><button className="mt-5 text-sm font-semibold text-[#7FE6CA]" onClick={() => setLocation("/")}>Return to local documents</button></div></div></AppShell>;

  const details = connectionDetails(collaboration.connectionState, collaboration.isCollaborative);
  const StatusIcon = details.icon;

  return <AppShell>
    <div className={`editor-deck ultra-editor-deck relay-editor mx-auto max-w-[1540px] ${focusMode ? "editor-deck-focus" : ""}`}>
      <header className="editor-command-head ultra-editor-head mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setLocation("/")} className="editor-back flex h-8 items-center gap-1 px-2 text-xs"><ChevronLeft className="h-3.5 w-3.5" />VAULT</button><span className="editor-head-rule hidden h-4 w-px sm:block" />
          <div className="min-w-0 flex-1"><input value={title} onChange={event => setTitle(event.target.value)} onBlur={() => void rename()} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} className="editor-title-input w-full max-w-xl bg-transparent outline-none" aria-label="Document title" /></div>
          <button onClick={() => void rename()} className="editor-icon-action grid h-8 w-8 place-items-center" aria-label="Save title"><Pencil className="h-3.5 w-3.5" /></button><div className="editor-document-tag hidden px-2.5 py-1.5 text-[10px] sm:block">{document.roomCode ? `ROOM / ${document.roomCode}` : "LOCAL / ONLY"}</div>
          <button onClick={() => setFocusMode(current => !current)} className={`ultra-focus-toggle ${focusMode ? "ultra-focus-toggle-active" : ""}`} title={focusMode ? "Leave focus mode" : "Enter focus mode"}><Focus className="h-3.5 w-3.5" /><span>{focusMode ? "Exit focus" : "Focus"}</span></button>
        </div>
        <div className="ultra-document-subline"><span><CircleDot className={`h-2.5 w-2.5 ${collaboration.persistenceReady ? "text-[#76E4C5]" : "text-[#F4C477]"}`} />{collaboration.persistenceReady ? "IndexedDB replica ready" : "Restoring IndexedDB replica"}</span><span className="hidden sm:flex"><LockKeyhole className="h-2.5 w-2.5" />Document content stays out of Peerlock’s server</span><span className="hidden md:flex"><History className="h-2.5 w-2.5" />Continuous CRDT merge</span></div>
      </header>
      <section className="ultra-command-strip" aria-label="Document command strip">
        <div className="ultra-signal-summary"><span className={`grid h-9 w-9 shrink-0 place-items-center ${details.tone}`}><StatusIcon className={`h-4 w-4 ${collaboration.connectionState === "loading-local" ? "animate-spin" : ""}`} /></span><div className="min-w-0"><p>{details.label}</p><small>{details.text}</small></div></div>
        <div className="ultra-document-metrics" aria-label="Browser-local document statistics"><div><span>WORDS</span><b>{insights.words.toLocaleString()}</b></div><div><span>READ</span><b>{insights.readingMinutes ? `${insights.readingMinutes}m` : "—"}</b></div><div className="hidden sm:block"><span>PARAS</span><b>{insights.paragraphs}</b></div><div className="hidden md:block"><span>CHARS</span><b>{insights.characters.toLocaleString()}</b></div></div>
        <div className="ultra-quick-actions">
          {document.roomCode ? <button onClick={copyInvite} className="ultra-action ultra-action-mint">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}<span>{copied ? "Invite copied" : "Invite"}</span></button> : <button onClick={() => void startPrivateRoom()} className="ultra-action ultra-action-violet"><Wifi className="h-3.5 w-3.5" /><span>Start room</span></button>}
          <button onClick={autoFormat} className="ultra-action ultra-action-gold"><WandSparkles className="h-3.5 w-3.5" /><span>{formatted ? "Formatted" : "Auto-format"}</span></button><button onClick={() => setAiDialogOpen(true)} className={`ultra-action ${aiAllowed ? "ultra-action-violet" : "ultra-action-mint"}`}><Sparkles className="h-3.5 w-3.5" /><span>{aiAllowed ? "AI format" : "AI protected"}</span></button><button onClick={toggleAiPrivacy} title={aiAllowed ? "Disable external AI for this document" : "Allow external AI for this document"} className={`ultra-square-action ${aiAllowed ? "" : "ultra-square-action-safe"}`}>{aiAllowed ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}</button>
          <div className="group relative"><button className="ultra-action ultra-action-neutral"><Download className="h-3.5 w-3.5" /><span>Export</span></button><div className="ultra-export-menu invisible absolute right-0 top-10 z-30 w-40 opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"><button onClick={() => exportDocument("txt")}>Plain text (.txt)</button><button onClick={() => exportDocument("md")}>Markdown (.md)</button></div></div>
        </div>
      </section>
      <div className="editor-grid ultra-editor-grid grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="ultra-writing-column min-w-0 space-y-4">
          <section className="ultra-progress-board" aria-label="Writing progress"><div className="ultra-progress-copy"><span><Target className="h-3.5 w-3.5" /> WRITING VECTOR</span><p>{insights.words ? `${remainingWords ? `${remainingWords.toLocaleString()} words to your target` : "Target reached — keep the signal moving"}` : "Start writing to activate your local document telemetry."}</p></div><button onClick={() => setWritingTarget(current => current === 800 ? 1500 : current === 1500 ? 2500 : 800)} className="ultra-progress-target">TARGET / {writingTarget.toLocaleString()}</button><div className="ultra-progress-track" aria-label={`${writingProgress}% of writing target`}><i style={{ width: `${writingProgress}%` }} /></div><b className="ultra-progress-percent">{writingProgress}%</b></section>
          {collaboration.ydoc ? <div className="editor-writing-surface ultra-writing-surface"><CollaborativeEditor key={document.id} ydoc={collaboration.ydoc} provider={collaboration.provider} profile={profile} onReady={editor => { editorRef.current = editor; setEditorInstance(editor); }} /></div> : <div className="editor-loading grid min-h-[500px] place-items-center text-sm"><Loader2 className="mr-2 h-4 w-4 animate-spin text-[#7FE6CA]" />Opening local document…</div>}
        </main>
        <aside className={`editor-modules ultra-sidebar space-y-4 ${mobilePanelsOpen ? "ultra-sidebar-open" : ""}`}>
          <div className="ultra-mobile-panel-head"><span>WORKSPACE PANELS</span><button onClick={() => setMobilePanelsOpen(false)} aria-label="Close workspace panels"><X className="h-4 w-4" /></button></div>
          <section className="editor-module ultra-peer-rail"><div className="ultra-module-head"><div><span>ACTIVE MESH</span><h3>Peer signals</h3></div><b><Users className="h-3.5 w-3.5" />{collaboration.peers.length}/10</b></div><div className="ultra-peer-stack">{collaboration.peers.slice(0, 8).map(peer => <div key={peer.clientId} className="ultra-peer-avatar" title={`${peer.name}${peer.isLocal ? " (you)" : ""}`} style={{ "--peer-colour": peer.color } as CSSProperties}><span>{peerInitial(peer.name)}</span><i className={peer.isDirect ? "" : "ultra-peer-pending"} /></div>)}{collaboration.peers.length > 8 && <div className="ultra-peer-overflow">+{collaboration.peers.length - 8}</div>}</div><div className="ultra-peer-summary"><span>{collaboration.directPeerCount} direct channel{collaboration.directPeerCount === 1 ? "" : "s"}</span><span>{collaboration.isCollaborative ? "Encrypted room" : "Private local file"}</span></div>{collaboration.roomCapacity !== "within-limit" && <p className={`ultra-capacity-warning ${collaboration.roomCapacity === "above-limit" ? "ultra-capacity-alert" : ""}`}>{collaboration.roomCapacity === "above-limit" ? "This room exceeds the supported ten-participant scope. Use a smaller mesh for predictable performance." : "This room has reached its supported ten-participant capacity."}</p>}</section>
          <section className="editor-module ultra-outline-module"><div className="ultra-module-head"><div><span>DOCUMENT MAP</span><h3>Outline</h3></div><ListTree className="h-4 w-4 text-[#B9B0FF]" /></div>{insights.outline.length ? <nav className="ultra-outline-list" aria-label="Document outline">{insights.outline.map(item => <button key={item.id} onClick={() => jumpToHeading(item)} style={{ "--outline-level": Math.min(item.level, 4) } as CSSProperties}><ChevronRight className="h-3 w-3" /><span>{item.text}</span></button>)}</nav> : <p className="ultra-empty-copy">Use Heading 1 or Heading 2 in the editor to build a local navigation map.</p>}</section>
          <section className="editor-module ultra-insight-module"><div className="ultra-module-head"><div><span>LOCAL INTELLIGENCE</span><h3>Document pulse</h3></div><BarChart3 className="h-4 w-4 text-[#79E4C7]" /></div><div className="ultra-insight-grid"><div><small>WORDS</small><b>{insights.words.toLocaleString()}</b></div><div><small>READ TIME</small><b>{insights.readingMinutes ? `${insights.readingMinutes} min` : "—"}</b></div><div><small>PARAGRAPHS</small><b>{insights.paragraphs}</b></div><div><small>CHARACTERS</small><b>{insights.characters.toLocaleString()}</b></div></div><p><Activity className="h-3.5 w-3.5" /> Computed inside this browser. Never added to a server-side document record.</p></section>
          <section className="editor-module ultra-activity-module"><div className="ultra-module-head"><div><span>ROOM ACTIVITY</span><h3>Live context</h3></div><History className="h-4 w-4 text-[#F4C477]" /></div><div className="ultra-activity-list">{activityFeed.map(item => <div key={item.id} className={`ultra-activity-row ultra-activity-${item.tone}`}><i /><div><p>{item.label}</p><small>{item.meta}</small></div></div>)}</div></section>
          <ConnectionGraph peers={collaboration.peers} connectionState={collaboration.connectionState} directPeerCount={collaboration.directPeerCount} roomCapacity={collaboration.roomCapacity} />
          {collaboration.ydoc && <RoomChat ydoc={collaboration.ydoc} profile={profile} peers={collaboration.peers} enabled={collaboration.isCollaborative} />}
          <section className="editor-privacy-module ultra-privacy-module"><div className="flex gap-2.5"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7FE6CA]" /><div><h3 className="text-xs font-semibold text-[#D7F7ED]">Privacy scope</h3><p>{privacyCopy.preciseScope}</p></div></div></section>
        </aside>
      </div>
    </div>
    <div className="ultra-mobile-dock xl:hidden"><button onClick={() => setFocusMode(current => !current)} className={focusMode ? "ultra-mobile-dock-active" : ""}><Focus className="h-4 w-4" /><span>{focusMode ? "Exit focus" : "Focus"}</span></button><button onClick={document.roomCode ? copyInvite : () => void startPrivateRoom()}>{document.roomCode ? <Copy className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}<span>{document.roomCode ? "Invite" : "Room"}</span></button><button onClick={() => setMobilePanelsOpen(true)}><PanelRightOpen className="h-4 w-4" /><span>Panels</span></button></div>
    <AiFormatDialog open={aiDialogOpen} onOpenChange={setAiDialogOpen} documentText={editorRef.current?.getText() ?? ""} aiAllowed={aiAllowed} onApply={applyAiFormatting} onUseLocalFallback={autoFormat} />
  </AppShell>;
}
