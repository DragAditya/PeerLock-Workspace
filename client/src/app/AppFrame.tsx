import { useWorkspace } from "@/app/WorkspaceProvider";
import { BookOpen, FolderOpen, Settings, ShieldCheck, UserRound, Users } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const links = [{ label: "Workspace", href: "/", icon: FolderOpen }, { label: "Learning kit", href: "/academy", icon: BookOpen }, { label: "Preferences", href: "/settings", icon: Settings }];
const peerLockMark = "/brand/peerlock-mark.png";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation(); const { profile } = useWorkspace(); const account = trpc.auth.account.useQuery(undefined, { retry: false });
  const toggleSettings = () => { if (location.startsWith("/settings")) { const returnTo = sessionStorage.getItem("peerlock-settings-return") || "/"; sessionStorage.removeItem("peerlock-settings-return"); navigate(returnTo); return; } sessionStorage.setItem("peerlock-settings-return", location); navigate("/settings"); };
  return <div className="app-frame"><header className="app-header"><button className="app-logo" onClick={() => navigate("/")} aria-label="Go to PeerLock workspace"><span className="app-logo-mark"><img src={peerLockMark} alt="" /></span><b>PEERLOCK</b></button><nav>{links.map(link => <button className={location === link.href || (link.href !== "/" && location.startsWith(link.href)) ? "active" : ""} key={link.href} onClick={() => link.href === "/settings" ? toggleSettings() : navigate(link.href)}><link.icon size={16} />{link.label}</button>)}</nav><div className="app-header-actions">{account.data?.isSuperAdmin && <button className="header-admin" onClick={() => navigate("/admin")}><ShieldCheck size={16} /><span>Control center</span></button>}<button className={`header-learning ${location.startsWith("/academy") ? "active" : ""}`} onClick={() => navigate("/academy")} aria-label="Open Learning Kit"><BookOpen size={16} /><span>Learning kit</span></button><button className="header-account" onClick={() => navigate("/account/sign-in")}>{profile?.avatarDataUrl ? <img className="header-avatar" src={profile.avatarDataUrl} alt="" /> : <UserRound size={16} />}<span>{account.data?.username ?? "Account"}</span></button><button className="header-settings" onClick={toggleSettings} aria-label={location.startsWith("/settings") ? "Close settings" : "Open settings"}><Settings size={16} /><span>Settings</span></button><span className="presence"><i style={{ backgroundColor: profile?.color }} />{profile?.name}</span></div></header><main>{children}</main></div>;
}

export function RoomBadge({ connected, connectedLabel = "Room connected", disconnectedLabel = "Local only" }: { connected: boolean; connectedLabel?: string; disconnectedLabel?: string }) { return <span className={`room-badge ${connected ? "room-badge-live" : ""}`}><Users size={13} />{connected ? connectedLabel : disconnectedLabel}</span>; }
