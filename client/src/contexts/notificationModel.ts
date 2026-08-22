export type NotificationKind = "success" | "info" | "warning" | "error";
export type NoticeInput = { kind?: NotificationKind; title: string; detail?: string; timeoutMs?: number };
export type Notice = NoticeInput & { id: string; kind: NotificationKind; timeoutMs: number };
export function createNotice(input: NoticeInput, id: string): Notice { return { id, kind: input.kind ?? "info", timeoutMs: input.timeoutMs ?? 6000, ...input }; }
export function appendNotice(current: Notice[], next: Notice, limit = 4) { return [...current, next].slice(-limit); }
