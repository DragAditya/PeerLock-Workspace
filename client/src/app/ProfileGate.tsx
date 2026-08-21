import { Loader2, LockKeyhole, MailCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useWorkspace } from "@/app/WorkspaceProvider";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { profile, setProfile } = useWorkspace();
  const [, navigate] = useLocation();
  const account = trpc.auth.account.useQuery(undefined, { retry: false });
  useEffect(() => {
    if (!account.data || profile?.id === account.data.id) return;
    setProfile({ id: account.data.id, name: account.data.username, color: "#0f766e" });
  }, [account.data?.id, account.data?.username, profile?.id]);
  if (account.isLoading || (account.data && profile?.id !== account.data.id)) return <div className="profile-gate account-gate"><section><Loader2 className="spin" size={22} /><p className="eyebrow">PEERLOCK / ACCOUNT CHECK</p><h1>Securing your workspace.</h1><p className="gate-copy">Loading your verified account identity for private collaboration.</p></section></div>;
  if (!account.data) return <div className="profile-gate account-gate"><section><LockKeyhole size={25} /><p className="eyebrow">PEERLOCK / ACCOUNT REQUIRED</p><h1>Sign in to enter.</h1><p className="gate-copy">Peerlock now requires a protected account. Your documents remain on this browser and are never uploaded to the account database.</p><button onClick={() => navigate("/account/sign-in")}>Sign in or create account <span>→</span></button></section><aside><p>ACCOUNT-ONLY</p><div className="gate-diagram"><i /><i /><i /></div><strong>Private by design.<br />Protected by account.</strong><span>Every collaborator uses a verified identity.</span></aside></div>;
  if (!account.data.emailVerifiedAt) return <div className="profile-gate account-gate"><section><MailCheck size={25} /><p className="eyebrow">PEERLOCK / VERIFY EMAIL</p><h1>Confirm your code.</h1><p className="gate-copy">Enter the six-digit code sent to {account.data.email} before opening documents or entering rooms.</p><button onClick={() => navigate("/account/sign-in")}>Verify email <span>→</span></button></section><aside><p>ACCOUNT-ONLY</p><div className="gate-diagram"><i /><i /><i /></div><strong>One account.<br />One trusted identity.</strong><span>Room approval and collaboration use your verified account name.</span></aside></div>;
  return <>{children}</>;
}
