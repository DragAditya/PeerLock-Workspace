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

  return <div className="relay-shell min-h-screen"><div className="relay-grain" aria-hidden="true" /><div className="relay-orb relay-orb-one" aria-hidden="true" /><div className="relay-orb relay-orb-two" aria-hidden="true" />
    <aside className={cn("relay-nav", menuOpen && "relay-nav-open")}>
      <div className="relay-brand"><button onClick={() => navigate("/")} aria-label="Peerlock vault" className="relay-brand-mark"><LockKeyhole className="h-4 w-4" /></button><span><b>peer</b><i>lock</i><small>private relay</small></span><button onClick={() => setMenuOpen(false)} className="relay-nav-close lg:hidden" aria-label="Close navigation"><X className="h-4 w-4" /></button></div>
      <p className="relay-nav-statement">A writing room<br />that belongs to<br /><em>your devices.</em></p>
      <nav className="relay-nav-links" aria-label="Workspace navigation">{navigation.map(item => { const active = item.path === "/" ? location === "/" : location.startsWith(item.path); return <button key={item.path} onClick={() => navigate(item.path)} className={cn(active && "relay-nav-active")}><span>{item.key}</span><item.icon className="h-4 w-4" /><b>{item.label}</b><i>↗</i></button>; })}</nav>
      <div className="relay-nav-bottom"><button onClick={createWorkspace} className="relay-new"><Plus className="h-4 w-4" /><span>Begin a document</span><i>↗</i></button><div className="relay-profile"><span style={{ backgroundColor: profile.color }}>{profile.name.slice(0, 1).toUpperCase()}</span><div><small>YOUR SIGNAL</small><b>{profile.name}</b></div><ProfileDialog /></div></div>
    </aside>
    {menuOpen && <button className="relay-backdrop lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close workspace navigation" />}
    <main className="relay-main"><header className="relay-topbar"><button className="relay-menu lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open workspace navigation"><Menu className="h-5 w-5" /></button><div className="relay-system-line"><span /><b>LOCAL REPLICA</b><i>↗</i><b>PEER-SYNC READY</b></div><div className="relay-encryption"><ShieldCheck className="h-3.5 w-3.5" /><span>NO CENTRAL CONTENT STORE</span></div></header><div className="relay-content">{children}</div></main>
  </div>;
}
