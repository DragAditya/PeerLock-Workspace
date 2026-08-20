import type { LocalProfile } from "./workspace";

export type RoomChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  color: string;
  body: string;
  createdAt: number;
  mentions?: string[];
};

export type RoomChatReaction = {
  id: string;
  messageId: string;
  emoji: string;
  authorId: string;
  createdAt: number;
};

export type ChatReactionSummary = { emoji: string; count: number; reactedByLocalUser: boolean };
export type RoomChatMessageView = RoomChatMessage & { reactions: ChatReactionSummary[] };

export function isRoomChatMessage(value: unknown): value is RoomChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<RoomChatMessage>;
  return typeof message.id === "string"
    && typeof message.authorId === "string"
    && typeof message.authorName === "string"
    && typeof message.color === "string"
    && typeof message.body === "string"
    && typeof message.createdAt === "number"
    && Number.isFinite(message.createdAt);
}

export function isRoomChatReaction(value: unknown): value is RoomChatReaction {
  if (!value || typeof value !== "object") return false;
  const reaction = value as Partial<RoomChatReaction>;
  return typeof reaction.id === "string"
    && typeof reaction.messageId === "string"
    && typeof reaction.emoji === "string"
    && typeof reaction.authorId === "string"
    && typeof reaction.createdAt === "number"
    && Number.isFinite(reaction.createdAt);
}

export function normalizeSharedMessages(values: unknown[]) {
  return values.filter(isRoomChatMessage).map(message => ({
    ...message,
    authorName: message.authorName.trim() || "Peer",
    body: normalizeChatBody(message.body),
    mentions: Array.isArray(message.mentions) ? message.mentions.filter((id): id is string => typeof id === "string").slice(0, 20) : [],
  })).filter(message => Boolean(message.body));
}

export function normalizeSharedReactions(values: unknown[]) {
  return values.filter(isRoomChatReaction).filter(reaction => reaction.emoji.length > 0 && reaction.emoji.length <= 8);
}

export function normalizeChatBody(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 1000);
}

export function createRoomChatMessage(profile: LocalProfile, body: string, mentions: string[] = [], createdAt = Date.now()): RoomChatMessage | undefined {
  const normalized = normalizeChatBody(body);
  if (!normalized) return undefined;
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${createdAt}-${Math.random().toString(36).slice(2, 10)}`,
    authorId: profile.id,
    authorName: profile.name || "Local editor",
    color: profile.color,
    body: normalized,
    createdAt,
    mentions: mentions.filter(id => typeof id === "string").slice(0, 20),
  };
}

export function createRoomChatReaction(profile: LocalProfile, messageId: string, emoji: string, createdAt = Date.now()): RoomChatReaction | undefined {
  if (!messageId || !emoji || emoji.length > 8) return undefined;
  return { id: `${messageId}:${profile.id}:${emoji}`, messageId, emoji, authorId: profile.id, createdAt };
}
