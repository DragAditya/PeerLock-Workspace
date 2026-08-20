import { useWorkspace } from "@/app/WorkspaceProvider";
import { BookOpen, FolderOpen, Plus, Settings, Users } from "lucide-react";
import { useLocation } from "wouter";

const links = [{ label: "Workspace", href: "/", icon: FolderOpen }, { label: "Learning kit", href: "/academy", icon: BookOpen }, { label: "Preferences", href: "/settings", icon: Settings }];

export function AppFrame({ children, create }: { children: React.ReactNode; create?: () => void }) {
  const [location, navigate] = useLocation();
  const { profile } = useWorkspace();
  return <div className="app-frame"><header className="app-header"><button className="app-logo" onClick={() => navigate("/")} aria-label="Go to workspace"><span>PL</span><b>Peerlock</b></button><nav>{links.map(link => <button className={location === link.href || (link.href !== "/" && location.startsWith(link.href)) ? "active" : ""} key={link.href} onClick={() => navigate(link.href)}><link.icon size={16} />{link.label}</button>)}</nav><div className="app-header-actions">{create && <button className="new-note" onClick={create}><Plus size={16} />New note</button>}<span className="presence"><i style={{ backgroundColor: profile?.color }} />{profile?.name}</span></div></header><main>{children}</main></div>;
}

export function RoomBadge({ connected }: { connected: boolean }) { return <span className={`room-badge ${connected ? "room-badge-live" : ""}`}><Users size={13} />{connected ? "Room connected" : "Local only"}</span>; }
