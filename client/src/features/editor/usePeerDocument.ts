import { opaqueRoomName } from "@/features/room/invite";
import type { LocalProfile, WorkspaceDocument } from "@/features/workspace/types";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import { useEffect, useRef, useState } from "react";

export type RoomMessage = { id: string; author: string; color: string; body: string; at: number };
const validMessage = (value: unknown): value is RoomMessage => Boolean(value && typeof value === "object" && typeof (value as RoomMessage).id === "string" && typeof (value as RoomMessage).body === "string" && typeof (value as RoomMessage).author === "string" && typeof (value as RoomMessage).at === "number");

export function usePeerDocument(document: WorkspaceDocument, profile: LocalProfile | null) {
  const ydoc = useRef<Y.Doc | null>(null); const ytext = useRef<Y.Text | null>(null); const messages = useRef<Y.Array<unknown> | null>(null);
  const [text, setText] = useState(""); const [connection, setConnection] = useState(document.roomCode ? "connecting" : "local"); const [peers, setPeers] = useState(1); const [chat, setChat] = useState<RoomMessage[]>([]);
  useEffect(() => {
    const doc = new Y.Doc(); ydoc.current = doc; const body = doc.getText("body"); ytext.current = body; const roomMessages = doc.getArray<unknown>("room-chat"); messages.current = roomMessages;
    let provider: WebrtcProvider | undefined; let cancelled = false; const persistence = new IndexeddbPersistence(`peerlock-document-${document.id}`, doc);
    const refreshText = () => setText(body.toString()); const refreshChat = () => setChat(roomMessages.toArray().filter(validMessage).sort((a, b) => a.at - b.at));
    body.observe(refreshText); roomMessages.observe(refreshChat); persistence.once("synced", refreshText);
    if (document.roomCode && document.roomSecret && profile) {
      void opaqueRoomName(document.roomCode, document.roomSecret).then(room => { if (cancelled) return; provider = new WebrtcProvider(room, doc, { password: document.roomSecret }); provider.awareness.setLocalStateField("user", { name: profile.name, color: profile.color, id: profile.id }); const updatePeers = () => setPeers(provider!.awareness.getStates().size); provider.awareness.on("change", updatePeers); provider.on("status", event => setConnection(event.connected ? "connected" : "connecting")); updatePeers(); });
    }
    return () => { cancelled = true; body.unobserve(refreshText); roomMessages.unobserve(refreshChat); persistence.destroy(); provider?.destroy(); doc.destroy(); };
  }, [document.id, document.roomCode, document.roomSecret, profile?.id, profile?.name, profile?.color]);
  const write = (next: string) => { const body = ytext.current; if (!body) return; ydoc.current?.transact(() => { body.delete(0, body.length); body.insert(0, next); }); };
  const send = (body: string) => { if (!body.trim() || !profile) return; messages.current?.push([{ id: crypto.randomUUID(), author: profile.name, color: profile.color, body: body.trim(), at: Date.now() }]); };
  return { text, write, connection, peers, chat, send };
}
