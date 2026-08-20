import { opaqueRoomName } from "@/features/room/invite";
import { ROOM_MAX_REMOTE_CONNECTIONS } from "@/features/room/capacity";
import type { LocalProfile, WorkspaceDocument } from "@/features/workspace/types";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import { useEffect, useMemo, useRef, useState } from "react";

export type RoomMessage = { id: string; author: string; color: string; body: string; at: number };
export type PeerPresence = { id: number; name: string; color: string };
const validMessage = (value: unknown): value is RoomMessage => Boolean(value && typeof value === "object" && typeof (value as RoomMessage).id === "string" && typeof (value as RoomMessage).body === "string" && typeof (value as RoomMessage).author === "string" && typeof (value as RoomMessage).at === "number");

export function usePeerDocument(document: WorkspaceDocument, profile: LocalProfile | null) {
  const ydoc = useMemo(() => new Y.Doc(), [document.id]);
  const fragment = useMemo(() => ydoc.getXmlFragment("editor"), [ydoc]);
  const messages = useMemo(() => ydoc.getArray<unknown>("room-chat"), [ydoc]);
  const [connection, setConnection] = useState(document.roomCode ? "connecting" : "local");
  const [peers, setPeers] = useState<PeerPresence[]>([]);
  const [chat, setChat] = useState<RoomMessage[]>([]); const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);

  useEffect(() => { const persistence = new IndexeddbPersistence(`peerlock-document-${document.id}`, ydoc); return () => { persistence.destroy(); ydoc.destroy(); }; }, [document.id, ydoc]);
  useEffect(() => { const refreshChat = () => setChat(messages.toArray().filter(validMessage).sort((a, b) => a.at - b.at)); messages.observe(refreshChat); refreshChat(); return () => messages.unobserve(refreshChat); }, [messages]);
  useEffect(() => {
    providerRef.current?.destroy(); providerRef.current = null; setProvider(null); setPeers([]); setConnection(document.roomCode ? "connecting" : "local");
    if (!document.roomCode || !document.roomSecret || !profile) return;
    let cancelled = false;
    void opaqueRoomName(document.roomCode, document.roomSecret).then(room => {
      if (cancelled) return;
      const nextProvider = new WebrtcProvider(room, ydoc, { password: document.roomSecret, maxConns: ROOM_MAX_REMOTE_CONNECTIONS }); providerRef.current = nextProvider; setProvider(nextProvider);
      nextProvider.awareness.setLocalStateField("user", { name: profile.name, color: profile.color, id: profile.id });
      const updatePeers = () => setPeers(Array.from(nextProvider.awareness.getStates().entries()).map(([id, state]) => ({ id, name: (state.user as { name?: string } | undefined)?.name ?? "Anonymous peer", color: (state.user as { color?: string } | undefined)?.color ?? "#607064" })));
      nextProvider.awareness.on("change", updatePeers); nextProvider.on("status", event => setConnection(event.connected ? "connected" : "connecting")); updatePeers();
    });
    return () => { cancelled = true; providerRef.current?.destroy(); providerRef.current = null; setProvider(null); };
  }, [document.roomCode, document.roomSecret, profile?.id, profile?.name, profile?.color, ydoc]);
  const send = (body: string) => { if (!body.trim() || !profile) return; messages.push([{ id: crypto.randomUUID(), author: profile.name, color: profile.color, body: body.trim(), at: Date.now() }]); };
  return { ydoc, fragment, provider, connection, peers, chat, send };
}
