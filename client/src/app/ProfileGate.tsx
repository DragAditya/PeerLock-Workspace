import { LockKeyhole, MailCheck } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useWorkspace } from "@/app/WorkspaceProvider";

const peerLockMark = "/brand/peerlock-mark.png";
type GatePanelProps = { eyebrow: string; title: ReactNode; detail: string };

function GateBrand() { return <div className="gate-brand"><span><img src={peerLockMark} alt="" /></span><b>PEERLOCK</b><i>SECURE ACCOUNT</i></div>; }
function PrivacyPanel({ eyebrow, title, detail }: GatePanelProps) { return <aside className="gate-privacy-panel"><p>{eyebrow}</p><div className="gate-diagram" aria-hidden="true"><i /><i /><i /></div><strong>{title}</strong><span>{detail}</span></aside>; }

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { profile, setProfile } = useWorkspace(); const [, navigate] = useLocation(); const account = trpc.auth.account.useQuery(undefined, { retry: false });
  useEffect(() => { if (!account.data || profile?.id === account.data.id) return; setProfile({ ...profile, id: account.data.id, name: account.data.username, color: profile?.color ?? "#0f766e" }); }, [account.data?.id, account.data?.username, profile?.id, profile?.color, profile?.theme, profile?.avatarDataUrl]);
  if (account.isLoading || (account.data && profile?.id !== account.data.id)) return <main className="account-gate-loader"><GateBrand /><section><div className="gate-loader-mark" role="status" aria-live="polite"><span><img src={peerLockMark} alt="" /></span><i aria-hidden="true" /><em className="sr-only">Checking your verified PeerLock account</em></div><p className="eyebrow">PEERLOCK / ACCOUNT CHECK</p><h1>Securing your<br /><strong>workspace.</strong></h1><p>Checking your verified account identity before opening your private collaboration space.</p><div className="gate-loader-progress"><span /><small>Verifying encrypted account session</small></div></section><footer><LockKeyhole size={15} />Your documents remain browser-local throughout this check.</footer></main>;
  if (!account.data) return <div className="profile-gate account-gate"><section className="gate-content"><GateBrand /><div className="gate-icon"><LockKeyhole size={23} /></div><p className="eyebrow">PEERLOCK / ACCOUNT REQUIRED</p><h1>Sign in to enter.</h1><p className="gate-copy">Peerlock requires a protected account. Your documents remain on this browser and are never uploaded to the account database.</p><button className="gate-primary-action" onClick={() => navigate("/account/sign-in")}>Sign in or create account <span aria-hidden="true">→</span></button><small className="gate-assurance">A verified account protects room approval and collaborator identity—not your document content.</small></section><PrivacyPanel eyebrow="ACCOUNT-ONLY" title={<>Private by design.<br />Protected by account.</>} detail="Every collaborator uses a verified identity." /></div>;
  if (!account.data.emailVerifiedAt) return <div className="profile-gate account-gate"><section className="gate-content"><GateBrand /><div className="gate-icon"><MailCheck size={23} /></div><p className="eyebrow">PEERLOCK / VERIFY EMAIL</p><h1>Confirm your code.</h1><p className="gate-copy">Enter the six-digit code sent to {account.data.email} before opening documents or entering rooms.</p><button className="gate-primary-action" onClick={() => navigate("/account/sign-in")}>Verify email <span aria-hidden="true">→</span></button><small className="gate-assurance">Verification confirms who can request entry to a room. Your local documents stay in this browser.</small></section><PrivacyPanel eyebrow="ACCOUNT-ONLY" title={<>One account.<br />One trusted identity.</>} detail="Room approval and collaboration use your verified account name." /></div>;
  return <>{children}</>;
}
