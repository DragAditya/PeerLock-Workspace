import type { LocalProfile } from "./workspace";

export type RoomChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  color: string;
  body: string;
  createdAt: number;
};

export function normalizeChatBody(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 1000);
}

export function createRoomChatMessage(profile: LocalProfile, body: string, createdAt = Date.now()): RoomChatMessage | undefined {
  const normalized = normalizeChatBody(body);
  if (!normalized) return undefined;
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${createdAt}-${Math.random().toString(36).slice(2, 10)}`,
    authorId: profile.id,
    authorName: profile.name || "Local editor",
    color: profile.color,
    body: normalized,
    createdAt,
  };
}
