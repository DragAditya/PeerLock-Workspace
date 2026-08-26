import { useWorkspace } from "@/app/WorkspaceProvider";
import { BookOpen, FolderOpen, Search, Settings, ShieldCheck, UserRound, Users } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const links = [{ label: "Workspace", href: "/", icon: FolderOpen }, { label: "Learning kit", href: "/academy", icon: BookOpen }];
const peerLockMark = "/brand/peerlock-mark.png";
const PeerCommandPalette = lazy(() => import("@/components/PeerCommandPalette").then(module => ({ default: module.PeerCommandPalette })));
const mobileNavigationStyles = `
@media (max-width: 850px) {
  .app-frame .app-header-actions { display: flex !important; align-items: center !important; flex: 0 0 auto !important; gap: 7px !important; }
  .app-frame .app-header-actions > :is(.header-admin, .header-command, .header-learning, .header-account, .header-settings) { box-sizing: border-box; display: grid !important; flex: 0 0 40px !important; width: 40px !important; min-width: 40px !important; height: 40px !important; min-height: 40px !important; place-items: center !important; gap: 0 !important; border: 1px solid var(--pl-border) !important; border-radius: 10px !important; padding: 0 !important; color: var(--pl-text) !important; background: var(--pl-surface-raised) !important; box-shadow: none !important; }
  .app-frame .app-header-actions > :is(.header-admin, .header-command, .header-learning, .header-account, .header-settings) > span { display: none !important; }
  .app-frame .app-header-actions > .header-command > kbd { display: none !important; }
  .app-frame .app-header-actions > :is(.header-admin, .header-command, .header-learning, .header-account, .header-settings).active { border-color: color-mix(in srgb, var(--pl-signal) 58%, var(--pl-border)) !important; color: var(--pl-text) !important; background: color-mix(in srgb, var(--pl-signal) 15%, var(--pl-surface-raised)) !important; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pl-signal) 14%, transparent) !important; }
  .app-frame .app-header-actions .header-account .header-avatar { width: 23px !important; height: 23px !important; }
}
@media (max-width: 540px) {
  .app-frame .app-header-actions { gap: 5px !important; }
  .app-frame .app-header-actions > :is(.header-admin, .header-command, .header-learning, .header-account, .header-settings) { flex-basis: 38px !important; width: 38px !important; min-width: 38px !important; height: 38px !important; min-height: 38px !important; border-radius: 9px !important; }
}
`;

export function AppFrame({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation(); const { profile, createDocument } = useWorkspace(); const account = trpc.auth.account.useQuery(undefined, { retry: false }); const [commandOpen, setCommandOpen] = useState(false);
  const toggleSettings = () => { if (location.startsWith("/settings")) { const returnTo = sessionStorage.getItem("peerlock-settings-return") || "/"; sessionStorage.removeItem("peerlock-settings-return"); navigate(returnTo); return; } sessionStorage.setItem("peerlock-settings-return", location); navigate("/settings"); };
  const createFromCommand = async () => { const document = await createDocument(); navigate(`/studio/${document.id}`); };
  return <div className="app-frame"><header className="app-header"><button className="app-logo" onClick={() => navigate("/")} aria-label="Go to PeerLock workspace"><span className="app-logo-mark"><img src={peerLockMark} alt="" /></span><b>PEERLOCK</b></button><nav>{links.map(link => <button className={location === link.href || (link.href !== "/" && location.startsWith(link.href)) ? "active" : ""} key={link.href} onClick={() => link.href === "/settings" ? toggleSettings() : navigate(link.href)}><link.icon size={16} />{link.label}</button>)}</nav><div className="app-header-actions">{account.data?.isSuperAdmin && <button className={`header-admin ${location.startsWith("/admin") ? "active" : ""}`} onClick={() => navigate("/admin")} aria-label="Open Control Center"><ShieldCheck size={16} /><span>Control center</span></button>}<button className="header-command" type="button" onClick={() => setCommandOpen(true)} aria-label="Open command palette"><Search size={16} /><span>Command</span><kbd>⌘K</kbd></button><button className={`header-learning ${location.startsWith("/academy") ? "active" : ""}`} onClick={() => navigate("/academy")} aria-label="Open Learning Kit"><BookOpen size={16} /><span>Learning kit</span></button><button className={`header-account ${location.startsWith("/account") ? "active" : ""}`} onClick={() => navigate("/account/sign-in")} aria-label="Open account">{account.data?.avatarUrl ? <img className="header-avatar" src={account.data.avatarUrl} alt="" /> : <UserRound size={16} />}<span>{account.data?.username ?? "Account"}</span></button><button className={`header-settings ${location.startsWith("/settings") ? "active" : ""}`} onClick={toggleSettings} aria-label={location.startsWith("/settings") ? "Close settings" : "Open settings"}><Settings size={16} /><span>Settings</span></button><span className="presence"><i style={{ backgroundColor: profile?.color }} />{profile?.name}</span></div></header><main>{children}</main>{commandOpen ? <Suspense fallback={null}><PeerCommandPalette open={commandOpen} onOpenChange={setCommandOpen} isAdmin={Boolean(account.data?.isSuperAdmin)} onNavigate={navigate} onCreateDocument={createFromCommand} onToggleSettings={toggleSettings} /></Suspense> : null}<style>{mobileNavigationStyles}</style></div>;
}

export function RoomBadge({ connected, connectedLabel = "Room connected", disconnectedLabel = "Local only" }: { connected: boolean; connectedLabel?: string; disconnectedLabel?: string }) { return <span className={`room-badge ${connected ? "room-badge-live" : ""}`}><Users size={13} />{connected ? connectedLabel : disconnectedLabel}</span>; }
