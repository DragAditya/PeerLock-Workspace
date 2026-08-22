import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { appendNotice, createNotice, type NotificationKind, type NoticeInput, type Notice } from "./notificationModel";

export type { NotificationKind, NoticeInput } from "./notificationModel";
type NotificationApi = { notify: (input: NoticeInput) => void; dismiss: (id: string) => void };
const NotificationContext = createContext<NotificationApi | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const dismiss = useCallback((id: string) => setNotices(current => current.filter(notice => notice.id !== id)), []);
  const notify = useCallback((input: NoticeInput) => {
    const id = crypto.randomUUID(); const notice = createNotice(input, id);
    setNotices(current => appendNotice(current, notice));
    window.setTimeout(() => dismiss(id), notice.timeoutMs);
  }, [dismiss]);
  const api = useMemo(() => ({ notify, dismiss }), [dismiss, notify]);
  return <NotificationContext.Provider value={api}>{children}<NotificationViewport notices={notices} dismiss={dismiss} /></NotificationContext.Provider>;
}
export function useNotifications() { const context = useContext(NotificationContext); if (!context) throw new Error("useNotifications must be used inside NotificationProvider"); return context; }
function NotificationViewport({ notices, dismiss }: { notices: Notice[]; dismiss: (id: string) => void }) {
  return <aside className="notification-viewport" aria-label="Peerlock notifications" aria-live="polite">{notices.map(notice => <div key={notice.id} className={`notification-toast notification-${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}><span className="notification-icon">{notice.kind === "success" ? <CheckCircle2 size={18} /> : notice.kind === "error" ? <CircleAlert size={18} /> : <Info size={18} />}</span><div><b>{notice.title}</b>{notice.detail && <p>{notice.detail}</p>}</div><button type="button" aria-label={`Dismiss ${notice.title}`} onClick={() => dismiss(notice.id)}><X size={16} /></button></div>)}</aside>;
}
