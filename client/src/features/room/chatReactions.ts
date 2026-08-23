export type ChatReactionMap = Record<string, string[]>;

const allowedReactions = new Set(["👍", "❤", "😂", "🎉"]);

/** Toggles one identity's reaction without mutating the prior replicated message state. */
export function toggleChatReaction(reactions: ChatReactionMap | undefined, emoji: string, identityId: string): ChatReactionMap {
  if (!allowedReactions.has(emoji) || !identityId) return { ...(reactions ?? {}) };
  const next = { ...(reactions ?? {}) }; const people = new Set(next[emoji] ?? []);
  if (people.has(identityId)) people.delete(identityId); else people.add(identityId);
  if (people.size) next[emoji] = Array.from(people); else delete next[emoji];
  return next;
}
