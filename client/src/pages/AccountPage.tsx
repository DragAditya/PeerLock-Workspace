import { CheckCircle2, ChevronLeft, KeyRound, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useWorkspace } from "@/app/WorkspaceProvider";

type AccountMode = "sign-in" | "sign-up" | "forgot" | "reset" | "verify" | "change-password";

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function AccountPage() {
  const [location, navigate] = useLocation();
  const mode = (location.split("?")[0].split("/")[2] as AccountMode | undefined) ?? "sign-in";
  const query = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);
  const token = query.get("token") ?? "";
  const { profile, setProfile } = useWorkspace();
  const utils = trpc.useUtils();
  const account = trpc.auth.account.useQuery(undefined, { retry: false });
  const register = trpc.auth.register.useMutation();
  const signIn = trpc.auth.signIn.useMutation();
  const forgot = trpc.auth.requestPasswordReset.useMutation();
  const reset = trpc.auth.resetPassword.useMutation();
  const changePassword = trpc.auth.changePassword.useMutation();
  const verify = trpc.auth.verifyEmail.useMutation();
  const resend = trpc.auth.resendVerification.useMutation();
  const logout = trpc.auth.logout.useMutation();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [verifyStarted, setVerifyStarted] = useState(false);

  const go = (next: AccountMode) => { setNotice(""); setError(""); navigate(`/account/${next}`); };
  const adoptIdentity = (value: { id: string; username: string }) => {
    if (!profile) setProfile({ id: value.id, name: value.username, color: "#0f766e" });
    void utils.auth.account.invalidate();
  };

  useEffect(() => {
    if (mode !== "verify" || !token || verifyStarted) return;
    setVerifyStarted(true);
    verify.mutate({ token }, { onSuccess: () => setNotice("Your email is verified. You can now return to your workspace."), onError: value => setError(messageFor(value)) });
  }, [mode, token, verify, verifyStarted]);

  if (account.data && mode === "change-password") {
    return <div className="account-page"><section className="account-hero"><button className="account-back" onClick={() => go("sign-in")}><ChevronLeft size={17} /> Account</button><p className="eyebrow">PEERLOCK / ACCOUNT SECURITY</p><h1>Refresh your<br /><em>credentials.</em></h1><p>Changing your password signs other devices out and leaves the current browser securely signed in.</p></section><section className="account-card"><div className="account-icon"><KeyRound size={20} /></div><AccountForm title="Change password" subtitle="Use a unique 10+ character password with uppercase, lowercase, and a number." submit="Save new password" busy={changePassword.isPending} fields={["currentPassword", "password", "confirmPassword"]} onSubmit={async form => { setError(""); if (form.password !== form.confirmPassword) throw new Error("Passwords do not match."); await changePassword.mutateAsync({ currentPassword: form.currentPassword, password: form.password }); setNotice("Password updated. Other devices have been signed out."); navigate("/account/sign-in"); }} footer={<button onClick={() => navigate("/account/sign-in")}>Back to account</button>} />{notice && <p className="account-notice">{notice}</p>}{error && <p className="account-error">{error}</p>}</section></div>;
  }

  if (account.data) {
    const signedIn = account.data;
    return <div className="account-page"><section className="account-hero"><p className="eyebrow">PEERLOCK / ACCOUNT</p><h1>Private work,<br /><em>properly protected.</em></h1><p>Your account protects access and recovery. Your documents remain browser-local and peer-synced only by your choice.</p><div className="account-trust"><ShieldCheck size={17} /> Opaque sessions · hashed passwords · no document upload</div></section><section className="account-card account-signed-in"><div className="account-icon"><CheckCircle2 size={20} /></div><p className="eyebrow">SIGNED IN</p><h2>{signedIn.username}</h2><p className="account-email">{signedIn.email}</p><div className={`verification-state ${signedIn.emailVerifiedAt ? "verified" : "pending"}`}>{signedIn.emailVerifiedAt ? <><CheckCircle2 size={16} /> Email verified</> : <><Mail size={16} /> Email verification pending</>}</div>{!signedIn.emailVerifiedAt && <button className="account-secondary" disabled={resend.isPending} onClick={() => resend.mutate(undefined, { onSuccess: value => setNotice(value.sent ? "Verification email sent." : value.alreadyVerified ? "Your email is already verified." : "Email service is not configured yet."), onError: value => setError(messageFor(value)) })}>Resend verification email</button>}<button className="account-secondary" onClick={() => go("change-password")}>Change password</button>{notice && <p className="account-notice">{notice}</p>}{error && <p className="account-error">{error}</p>}<button className="account-primary" onClick={() => navigate("/")}>Open workspace</button><button className="account-link danger" disabled={logout.isPending} onClick={() => logout.mutate(undefined, { onSuccess: () => { void utils.auth.account.invalidate(); go("sign-in"); } })}>Sign out</button></section></div>;
  }

  const busy = register.isPending || signIn.isPending || forgot.isPending || reset.isPending || verify.isPending;
  return <div className="account-page"><section className="account-hero"><button className="account-back" onClick={() => navigate("/")}><ChevronLeft size={17} /> Workspace</button><p className="eyebrow">PEERLOCK / OPTIONAL ACCOUNT</p><h1>Keep your access<br /><em>in your hands.</em></h1><p>Create an account for secure sign-in and account recovery. You can still use Peerlock as a guest, and your documents remain on this device.</p><div className="account-feature-list"><span><ShieldCheck size={17} /> Passwords are salted and hashed</span><span><KeyRound size={17} /> One-time password reset links</span><span><Sparkles size={17} /> Your local workspace stays local</span></div></section><section className="account-card"><div className="account-icon"><KeyRound size={20} /></div>{mode === "sign-up" && <AccountForm title="Create your account" subtitle="Use an email you can access for verification and recovery." submit="Create account" busy={busy} fields={["username", "email", "password"]} onSubmit={async form => { setError(""); const result = await register.mutateAsync({ username: form.username, email: form.email, password: form.password }); adoptIdentity(result.account); setNotice(result.verificationSent ? "Account created. Check your email to verify it." : "Account created. Email delivery still needs to be configured." ); }} footer={<><span>Already have an account?</span><button onClick={() => go("sign-in")}>Sign in</button></>} />}{mode === "sign-in" && <AccountForm title="Welcome back" subtitle="Sign in to your private Peerlock account." submit="Sign in" busy={busy} fields={["email", "password"]} onSubmit={async form => { setError(""); const result = await signIn.mutateAsync({ email: form.email, password: form.password }); adoptIdentity(result.account); navigate("/"); }} footer={<><button onClick={() => go("forgot")}>Forgot password?</button><span>New here?</span><button onClick={() => go("sign-up")}>Create account</button></>} />}{mode === "forgot" && <AccountForm title="Recover access" subtitle="If that email belongs to an account, we will send a reset link." submit="Send reset link" busy={busy} fields={["email"]} onSubmit={async form => { setError(""); await forgot.mutateAsync({ email: form.email }); setNotice("If an account exists, a reset email is on its way."); }} footer={<button onClick={() => go("sign-in")}>Back to sign in</button>} />}{mode === "reset" && <AccountForm title="Choose a new password" subtitle="Use a new 10+ character password with uppercase, lowercase, and a number." submit="Update password" busy={busy} fields={["password", "confirmPassword"]} onSubmit={async form => { setError(""); if (form.password !== form.confirmPassword) throw new Error("Passwords do not match."); const result = await reset.mutateAsync({ token, password: form.password }); adoptIdentity(result.account); setNotice("Password updated. You are signed in."); }} footer={<button onClick={() => go("sign-in")}>Back to sign in</button>} />}{mode === "verify" && <div className="account-verifying"><Loader2 className="spin" size={24} /><h2>Verifying your email</h2><p>{token ? "Please wait while we secure your account." : "This verification link is incomplete."}</p></div>}{notice && <p className="account-notice">{notice}</p>}{error && <p className="account-error">{error}</p>}<button className="account-guest-link" onClick={() => navigate("/")}>Continue as guest instead</button></section></div>;
}

function AccountForm({ title, subtitle, submit, busy, fields, onSubmit, footer }: { title: string; subtitle: string; submit: string; busy: boolean; fields: string[]; onSubmit: (value: Record<string, string>) => Promise<void>; footer: React.ReactNode }) {
  const [form, setForm] = useState<Record<string, string>>({}); const [localError, setLocalError] = useState("");
  const labels: Record<string, string> = { username: "Username", email: "Email address", password: "Password", currentPassword: "Current password", confirmPassword: "Confirm password" };
  const passwordAutocomplete = fields.includes("username") || title.includes("new password") || title.includes("Change") ? "new-password" : "current-password";
  return <form className="account-form" onSubmit={async event => { event.preventDefault(); setLocalError(""); try { await onSubmit(form); } catch (error) { setLocalError(messageFor(error)); } }}><h2>{title}</h2><p>{subtitle}</p>{fields.map(field => <label key={field}>{labels[field]}<input autoComplete={field === "email" ? "email" : field === "username" ? "username" : field === "currentPassword" ? "current-password" : passwordAutocomplete} type={field.toLowerCase().includes("password") ? "password" : "text"} value={form[field] ?? ""} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))} required /></label>)}{localError && <p className="account-error">{localError}</p>}<button className="account-primary" disabled={busy} type="submit">{busy ? <><Loader2 className="spin" size={16} /> Working…</> : submit}</button><div className="account-form-footer">{footer}</div></form>;
}
