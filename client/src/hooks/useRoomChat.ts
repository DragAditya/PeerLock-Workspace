import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import { createRoomChatMessage, type RoomChatMessage } from "@/lib/chat";
import type { LocalProfile } from "@/lib/workspace";

function sortMessages(messages: RoomChatMessage[]) {
  return [...messages].sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id));
}

export function useRoomChat(ydoc: Y.Doc, profile: LocalProfile) {
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);

  useEffect(() => {
    const collection = ydoc.getArray<RoomChatMessage>("peerlock-room-chat");
    const sync = () => setMessages(sortMessages(collection.toArray()));
    sync();
    collection.observe(sync);
    return () => collection.unobserve(sync);
  }, [ydoc]);

  const sendMessage = useCallback((body: string) => {
    const message = createRoomChatMessage(profile, body);
    if (!message) return false;
    ydoc.getArray<RoomChatMessage>("peerlock-room-chat").push([message]);
    return true;
  }, [profile, ydoc]);

  return { messages, sendMessage };
}
