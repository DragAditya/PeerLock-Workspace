import { AppFrame } from "@/app/AppFrame";
import { ArrowLeft, Compass } from "lucide-react";
import { useLocation } from "wouter";
import "./not-found.css";

export function NotFoundPage() {
  const [, navigate] = useLocation();
  return <AppFrame><main className="not-found-page"><section><Compass size={24} /><p className="eyebrow">PEERLOCK / ROUTE UNAVAILABLE</p><h1>This path is not part of your workspace.</h1><p>The link may be incomplete, expired, or no longer available. Your browser-local documents and account data have not been changed.</p><button onClick={() => navigate("/")}><ArrowLeft size={16} />Return to workspace</button></section></main></AppFrame>;
}
