import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { BookOpen, FileText, GraduationCap, LockKeyhole, Menu, Plus, Settings2, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { ProfileDialog } from "./ProfileDialog";

const navigation = [
  { label: "Vault", path: "/", icon: FileText, key: "01" },
  { label: "Research", path: "/report", icon: BookOpen, key: "02" },
  { label: "Briefing", path: "/study", icon: GraduationCap, key: "03" },
  { label: "Control", path: "/settings", icon: Settings2, key: "04" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { createDocument, profile } = useWorkspace();

  const createWorkspace = async () => {
    const document = await createDocument();
    setLocation(`/editor/${document.id}`);
    setMenuOpen(false);
  };

  const navigate = (path: string) => {
    setLocation(path);
    setMenuOpen(false);
  };

  return <div className="command-shell min-h-screen"><div className="command-noise" aria-hidden="true" /><div className="command-glow command-glow-one" aria-hidden="true" /><div className="command-glow command-glow-two" aria-hidden="true" />
    <aside className={cn("command-rail", menuOpen ? "command-rail-open" : "")}>
      <div className="command-brand"><button onClick={() => navigate("/")} aria-label="Peerlock vault" className="command-brand-mark"><LockKeyhole className="h-4 w-4" /></button><span className="command-brand-type"><b>PEER</b>LOCK</span><button onClick={() => setMenuOpen(false)} className="command-close lg:hidden" aria-label="Close navigation"><X className="h-4 w-4" /></button></div>
      <div className="command-rule" />
      <nav className="command-nav" aria-label="Workspace navigation">{navigation.map(item => { const active = item.path === "/" ? location === "/" : location.startsWith(item.path); return <button key={item.path} onClick={() => navigate(item.path)} className={cn("command-nav-item", active && "command-nav-active")}><span className="command-nav-key">{item.key}</span><item.icon className="h-4 w-4" /><span>{item.label}</span></button>; })}</nav>
      <div className="command-rail-bottom"><button onClick={createWorkspace} className="command-new"><Plus className="h-4 w-4" /> <span>New document</span></button><div className="command-presence"><span className="command-presence-dot" style={{ backgroundColor: profile.color }} /><span className="truncate">{profile.name}</span><ProfileDialog /></div></div>
    </aside>
    {menuOpen && <button className="command-backdrop lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close workspace navigation" />}
    <main className="command-main"><header className="command-topbar"><button className="command-menu lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open workspace navigation"><Menu className="h-5 w-5" /></button><div className="command-top-status"><span className="command-status-light" /><span>LOCAL NODE ONLINE</span><i>•</i><span>NO CLOUD REPLICA</span></div><div className="command-top-privacy"><ShieldCheck className="h-3.5 w-3.5" /><span>ENCRYPTED WORKSPACE</span></div></header><div className="command-content">{children}</div></main>
  </div>;
}
