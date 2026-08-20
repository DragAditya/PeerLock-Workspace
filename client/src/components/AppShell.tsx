import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { BookOpen, FilePlus2, FileText, GraduationCap, LockKeyhole, PanelLeftClose, Plus, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { ProfileDialog } from "./ProfileDialog";
import { PeerlockMark } from "./PeerlockMark";
import { privacyCopy } from "@/lib/privacy";

const navItems = [
  { label: "Workspaces", path: "/", icon: FileText },
  { label: "MCA report", path: "/report", icon: BookOpen },
  { label: "Present & viva", path: "/study", icon: GraduationCap },
];

function formatRelativeTime(timestamp: number) {
  const difference = Date.now() - timestamp;
  if (difference < 60_000) return "edited now";
  if (difference < 3_600_000) return `edited ${Math.max(1, Math.floor(difference / 60_000))}m ago`;
  if (difference < 86_400_000) return `edited ${Math.floor(difference / 3_600_000)}h ago`;
  return `edited ${Math.floor(difference / 86_400_000)}d ago`;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { documents, createDocument } = useWorkspace();

  const handleCreateDocument = async () => {
    const document = await createDocument();
    setLocation(`/editor/${document.id}`);
    setSidebarOpen(false);
  };

  const navigate = (path: string) => {
    setLocation(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#090C14] text-[#F5F7FB]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-48 top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,_rgba(77,232,191,0.11),_transparent_66%)]" />
        <div className="absolute -right-52 top-32 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,_rgba(135,113,255,0.11),_transparent_66%)]" />
      </div>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col border-r border-white/[0.07] bg-[#0E121D]/95 px-3 pb-4 pt-5 backdrop-blur-xl transition-transform duration-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}>
        <div className="mb-7 flex items-center justify-between px-3">
          <button onClick={() => navigate("/")} className="group flex items-center gap-3 text-left" aria-label="Go to workspaces">
            <span className="shadow-[0_0_25px_rgba(116,233,200,0.16)]"><PeerlockMark size={36} /></span>
            <span>
              <span className="block text-sm font-semibold tracking-[-0.02em] text-white">Peerlock</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[#7FE6CA]">local-first workspace</span>
            </span>
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-lg text-[#8A94A8] hover:bg-white/[0.07] hover:text-white lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <button onClick={handleCreateDocument} className="mb-6 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#E5FFF5] text-sm font-semibold text-[#0A372E] shadow-[0_10px_24px_rgba(94,231,194,0.13)] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New workspace
        </button>

        <nav className="space-y-1" aria-label="Primary navigation">
          {navItems.map(item => {
            const active = item.path === "/" ? location === "/" : location.startsWith(item.path);
            return (
              <button key={item.path} onClick={() => navigate(item.path)} className={cn(
                "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition",
                active ? "bg-white/[0.09] font-medium text-white" : "text-[#929CB1] hover:bg-white/[0.05] hover:text-[#E8EDF8]",
              )}>
                <item.icon className={cn("h-4 w-4", active ? "text-[#7DE8C7]" : "")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#657087]">Local documents</span>
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#929CB1]">{documents.length}</span>
          </div>
          <div className="max-h-[calc(100vh-410px)] space-y-1 overflow-y-auto pr-1">
            {documents.length === 0 ? (
              <div className="px-3 py-4 text-xs leading-5 text-[#68738A]">Your documents stay in this browser until you choose to share a room.</div>
            ) : documents.slice(0, 8).map(document => (
              <button key={document.id} onClick={() => navigate(`/editor/${document.id}`)} className={cn(
                "group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/[0.05]",
                location === `/editor/${document.id}` && "bg-white/[0.08]",
              )}>
                <FileText className="h-3.5 w-3.5 shrink-0 text-[#74839B] group-hover:text-[#7FE6CA]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-[#D5DBE7]">{document.title}</span>
                  <span className="block truncate pt-0.5 text-[10px] text-[#69758C]">{document.roomCode ? `room ${document.roomCode}` : formatRelativeTime(document.updatedAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto rounded-2xl border border-[#7FE6CA]/15 bg-[#5DE7C2]/[0.055] p-3.5">
          <div className="flex gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#79E6C5]" />
            <div>
              <p className="text-xs font-semibold text-[#DDFBF1]">Your data stays yours</p>
              <p className="mt-1 text-[11px] leading-4 text-[#A3BEB8]">This app never uploads document content to its own server.</p>
            </div>
          </div>
          <ProfileDialog />
        </div>
      </aside>

      {sidebarOpen && <button className="fixed inset-0 z-40 bg-black/55 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}

      <main className="relative min-h-screen lg:pl-[276px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-[#090C14]/80 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <button className="grid h-9 w-9 place-items-center rounded-xl text-[#9AA5B9] hover:bg-white/[0.06] hover:text-white lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <PanelLeftClose className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 items-center gap-2 text-xs text-[#8290A7]">
            <span className="hidden h-2 w-2 rounded-full bg-[#78E7C6] shadow-[0_0_11px_rgba(120,231,198,0.9)] sm:block" />
            <span className="truncate"><strong className="font-semibold text-[#CDE6DE]">Private by design.</strong> {privacyCopy.header}</span>
          </div>
          <div className="ml-auto hidden items-center gap-2 text-[11px] text-[#7F8CA2] sm:flex">
            <FilePlus2 className="h-3.5 w-3.5" />
            IndexedDB local vault
          </div>
        </header>
        <div className="px-4 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
