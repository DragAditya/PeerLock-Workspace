import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { BookOpen, FilePlus2, FileText, GraduationCap, LockKeyhole, Moon, PanelLeftClose, Plus, Settings2, ShieldCheck, Sun, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { ProfileDialog } from "./ProfileDialog";
import { PeerlockMark } from "./PeerlockMark";
import { privacyCopy } from "@/lib/privacy";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { label: "Workspaces", path: "/", icon: FileText },
  { label: "MCA report", path: "/report", icon: BookOpen },
  { label: "Present & viva", path: "/study", icon: GraduationCap },
  { label: "Settings", path: "/settings", icon: Settings2 },
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
  const { theme, toggleTheme } = useTheme();

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
    <div className={`app-shell theme-${theme} min-h-screen`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="peer-ambient peer-ambient-one" />
        <div className="peer-ambient peer-ambient-two" />
      </div>

      <aside className={cn(
        "peer-sidebar fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col px-3 pb-4 pt-5",
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
          <button className="peer-icon-button grid h-8 w-8 place-items-center lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <button onClick={handleCreateDocument} className="peer-primary-action mb-6 flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New workspace
        </button>

        <nav className="space-y-1" aria-label="Primary navigation">
          {navItems.map(item => {
            const active = item.path === "/" ? location === "/" : location.startsWith(item.path);
            return (
              <button key={item.path} onClick={() => navigate(item.path)} className={cn(
                "peer-nav-button flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm",
                active && "peer-nav-button-active",
              )}>
                <item.icon className={cn("h-4 w-4", active && "text-[#0F766E]")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="peer-section-label text-[10px] font-semibold uppercase tracking-[0.14em]">Local documents</span>
            <span className="peer-count rounded-md px-1.5 py-0.5 text-[10px]">{documents.length}</span>
          </div>
          <div className="max-h-[calc(100vh-410px)] space-y-1 overflow-y-auto pr-1">
            {documents.length === 0 ? (
              <div className="peer-muted px-3 py-4 text-xs leading-5">Your documents stay in this browser until you choose to share a room.</div>
            ) : documents.slice(0, 8).map(document => (
              <button key={document.id} onClick={() => navigate(`/editor/${document.id}`)} className={cn(
                "peer-doc-row group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left",
                location === `/editor/${document.id}` && "peer-doc-row-active",
              )}>
                <FileText className="peer-doc-icon h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="peer-doc-title block truncate text-xs font-medium">{document.title}</span>
                  <span className="peer-muted block truncate pt-0.5 text-[10px]">{document.roomCode ? `room ${document.roomCode}` : formatRelativeTime(document.updatedAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="peer-privacy-card mt-auto rounded-2xl p-3.5">
          <div className="flex gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0F9D8B]" />
            <div>
              <p className="peer-privacy-title text-xs font-semibold">Your data stays yours</p>
              <p className="peer-privacy-copy mt-1 text-[11px] leading-4">This app never uploads document content to its own server.</p>
            </div>
          </div>
          <ProfileDialog />
        </div>
      </aside>

      {sidebarOpen && <button className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}

      <main className="relative min-h-screen lg:pl-[276px]">
        <header className="peer-topbar sticky top-0 z-30 flex h-16 items-center gap-3 px-4 sm:px-7 lg:px-9">
          <button className="peer-icon-button grid h-9 w-9 place-items-center lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <PanelLeftClose className="h-4 w-4" />
          </button>
          <div className="peer-topbar-message flex min-w-0 items-center gap-2 text-xs">
            <span className="hidden h-2 w-2 rounded-full bg-[#20B18B] shadow-[0_0_11px_rgba(32,177,139,0.65)] sm:block" />
            <span className="truncate"><strong className="font-semibold">Private by design.</strong> {privacyCopy.header}</span>
          </div>
          <div className="peer-vault-label ml-auto hidden items-center gap-2 text-[11px] sm:flex">
            <FilePlus2 className="h-3.5 w-3.5" />
            IndexedDB local vault
          </div>
          <button onClick={toggleTheme} className="peer-theme-toggle grid h-9 w-9 place-items-center rounded-xl" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </header>
        <div className="px-4 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
