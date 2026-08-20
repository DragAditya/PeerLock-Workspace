import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import { createRoomChatMessage, createRoomChatReaction, normalizeSharedMessages, normalizeSharedReactions, type RoomChatMessageView } from "@/lib/chat";
import type { LocalProfile } from "@/lib/workspace";

function sortMessages(messages: RoomChatMessageView[]) {
  return [...messages].sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id));
}

export function useRoomChat(ydoc: Y.Doc, profile: LocalProfile) {
  const [messages, setMessages] = useState<RoomChatMessageView[]>([]);

  useEffect(() => {
    const collection = ydoc.getArray<unknown>("peerlock-room-chat");
    const reactions = ydoc.getArray<unknown>("peerlock-room-chat-reactions");
    const sync = () => {
      try {
        const safeReactions = normalizeSharedReactions(reactions.toArray());
        const grouped = new Map<string, Map<string, Set<string>>>();
        safeReactions.forEach(reaction => {
          const byEmoji = grouped.get(reaction.messageId) ?? new Map<string, Set<string>>();
          const authors = byEmoji.get(reaction.emoji) ?? new Set<string>();
          authors.add(reaction.authorId);
          byEmoji.set(reaction.emoji, authors);
          grouped.set(reaction.messageId, byEmoji);
        });
        const messages = normalizeSharedMessages(collection.toArray()).map(message => ({
          ...message,
          reactions: Array.from(grouped.get(message.id)?.entries() ?? []).map(([emoji, authors]) => ({ emoji, count: authors.size, reactedByLocalUser: authors.has(profile.id) })),
        }));
        setMessages(sortMessages(messages));
      } catch (error) {
        console.warn("[Room chat] Ignored an unreadable shared chat update", error);
        setMessages([]);
      }
    };
    sync();
    collection.observe(sync);
    reactions.observe(sync);
    return () => { collection.unobserve(sync); reactions.unobserve(sync); };
  }, [profile.id, ydoc]);

  const sendMessage = useCallback((body: string, mentionedPeerIds: string[] = []) => {
    const message = createRoomChatMessage(profile, body, mentionedPeerIds);
    if (!message) return false;
    ydoc.getArray<unknown>("peerlock-room-chat").push([message]);
    return true;
  }, [profile, ydoc]);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    const collection = ydoc.getArray<unknown>("peerlock-room-chat-reactions");
    const existingIndex = collection.toArray().findIndex(value => {
      const reaction = normalizeSharedReactions([value])[0];
      return reaction?.messageId === messageId && reaction.authorId === profile.id && reaction.emoji === emoji;
    });
    if (existingIndex >= 0) {
      collection.delete(existingIndex, 1);
      return;
    }
    const reaction = createRoomChatReaction(profile, messageId, emoji);
    if (reaction) collection.push([reaction]);
  }, [profile, ydoc]);

  return { messages, sendMessage, toggleReaction };
}
