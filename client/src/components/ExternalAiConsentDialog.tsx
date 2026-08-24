import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import "./external-ai-consent.css";

type AiAction = "format_document" | "improve" | "summarize" | "expand" | "simplify" | "explain" | "format";
type ConsentRequest = { action: AiAction; contentKind: "document text" | "selected text"; onApprove: () => void };
type ConsentContextValue = { requestConsent: (request: ConsentRequest) => void };

const ExternalAiConsentContext = createContext<ConsentContextValue | null>(null);

export function ExternalAiConsentProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConsentRequest | null>(null);
  const value = useMemo<ConsentContextValue>(() => ({ requestConsent: setPending }), []);
  const actionLabel = pending?.action === "format_document" ? "format" : pending?.action ?? "process";
  const approve = () => { const request = pending; setPending(null); request?.onApprove(); };
  return <ExternalAiConsentContext.Provider value={value}>{children}<AlertDialog open={Boolean(pending)} onOpenChange={open => { if (!open) setPending(null); }}><AlertDialogContent className="external-ai-consent-dialog"><AlertDialogHeader><p className="eyebrow"><Sparkles size={14} />EXTERNAL AI CONSENT</p><AlertDialogTitle>Send {pending?.contentKind ?? "text"} to Gemini?</AlertDialogTitle><AlertDialogDescription>Gemini will receive only the {pending?.contentKind ?? "requested text"} to {actionLabel} it. The text is never displayed in this approval window and is not stored by PeerLock.</AlertDialogDescription></AlertDialogHeader><div className="external-ai-consent-boundary"><ShieldCheck size={16} /><span>Continue only if this content is suitable to process with the external AI provider.</span></div><AlertDialogFooter><AlertDialogCancel>Keep local</AlertDialogCancel><AlertDialogAction className="external-ai-consent-confirm" onClick={approve}>Send to Gemini</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></ExternalAiConsentContext.Provider>;
}

export function useExternalAiConsent() {
  const value = useContext(ExternalAiConsentContext);
  if (!value) throw new Error("useExternalAiConsent must be used within ExternalAiConsentProvider");
  return value;
}
