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
  const metadata = useMemo(() => ydoc.getMap<string>("document-meta"), [ydoc]);
  const [connection, setConnection] = useState(document.roomCode ? "connecting" : "local");
  const [peers, setPeers] = useState<PeerPresence[]>([]);
  const [chat, setChat] = useState<RoomMessage[]>([]); const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [syncRevision, setSyncRevision] = useState(0);
  const [title, setTitle] = useState(document.title);
  const providerRef = useRef<WebrtcProvider | null>(null);

  useEffect(() => { setPersistenceReady(false); const persistence = new IndexeddbPersistence(`peerlock-document-${document.id}`, ydoc); const onSynced = () => setPersistenceReady(true); persistence.once("synced", onSynced); return () => { persistence.destroy(); ydoc.destroy(); }; }, [document.id, ydoc]);
  useEffect(() => { if (!persistenceReady) return; const syncTitle = () => { const sharedTitle = metadata.get("title"); if (typeof sharedTitle === "string") setTitle(sharedTitle); else metadata.set("title", title); }; metadata.observe(syncTitle); syncTitle(); return () => metadata.unobserve(syncTitle); }, [metadata, persistenceReady, title]);
  useEffect(() => { const refreshChat = () => setChat(messages.toArray().filter(validMessage).sort((a, b) => a.at - b.at)); messages.observe(refreshChat); refreshChat(); return () => messages.unobserve(refreshChat); }, [messages]);
  useEffect(() => {
    providerRef.current?.destroy(); providerRef.current = null; setProvider(null); setPeers([]); setConnection(document.roomCode ? "connecting" : "local");
    if (!document.roomId || !document.roomTransportSecret || !profile) return;
    let cancelled = false;
    const transportSecret = document.roomTransportSecret;
    void opaqueRoomName(document.roomId, transportSecret).then(room => {
      if (cancelled) return;
      const nextProvider = new WebrtcProvider(room, ydoc, { password: transportSecret, maxConns: ROOM_MAX_REMOTE_CONNECTIONS }); providerRef.current = nextProvider; setProvider(nextProvider);
      const refreshAfterRemoteSync = ({ synced }: { synced: boolean }) => { if (synced) setSyncRevision(value => value + 1); };
      nextProvider.on("synced", refreshAfterRemoteSync); nextProvider.connect();
      nextProvider.awareness.setLocalStateField("user", { name: profile.name, color: profile.color, id: profile.id });
      const updatePeers = () => setPeers(Array.from(nextProvider.awareness.getStates().entries()).map(([id, state]) => ({ id, name: (state.user as { name?: string } | undefined)?.name ?? "Anonymous peer", color: (state.user as { color?: string } | undefined)?.color ?? "#607064" })));
      nextProvider.awareness.on("change", updatePeers); nextProvider.on("status", event => setConnection(event.connected ? "connected" : "connecting")); updatePeers();
    });
    return () => { cancelled = true; providerRef.current?.destroy(); providerRef.current = null; setProvider(null); };
  }, [document.roomId, document.roomTransportSecret, profile?.id, profile?.name, profile?.color, ydoc]);
  const send = (body: string) => { if (!body.trim() || !profile) return; messages.push([{ id: crypto.randomUUID(), author: profile.name, color: profile.color, body: body.trim(), at: Date.now() }]); };
  const updateTitle = (next: string) => { setTitle(next); if (persistenceReady) metadata.set("title", next); };
  return { ydoc, fragment, provider, connection, peers, chat, send, persistenceReady, syncRevision, title, updateTitle };
}
