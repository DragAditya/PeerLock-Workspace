import type { WorkspaceDocument } from "./types";

export function normalizeWorkspaceDocument(value: unknown): WorkspaceDocument | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<WorkspaceDocument>;
  const createdAt = record.createdAt; const updatedAt = record.updatedAt;
  if (typeof record.id !== "string" || !record.id || typeof record.title !== "string" || typeof createdAt !== "number" || !Number.isFinite(createdAt) || typeof updatedAt !== "number" || !Number.isFinite(updatedAt)) return null;
  return { id: record.id, title: record.title, createdAt, updatedAt, externalAiEnabled: record.externalAiEnabled !== false, roomCode: typeof record.roomCode === "string" ? record.roomCode : undefined, roomId: typeof record.roomId === "string" ? record.roomId : undefined, roomProtected: typeof record.roomProtected === "boolean" ? record.roomProtected : undefined, roomTransportSecret: typeof record.roomTransportSecret === "string" ? record.roomTransportSecret : undefined };
}
