import { ROOM_MAX_REMOTE_CONNECTIONS } from "@/features/room/capacity";
import { opaqueRoomName, peerlockSignalingUrl } from "@/features/room/invite";
import { createInitializationGate } from "@/features/workspace/initialization";
import { toggleChatReaction } from "@/features/room/chatReactions";
import type { LocalProfile, WorkspaceDocument } from "@/features/workspace/types";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import { useEffect, useMemo, useRef, useState } from "react";

export type RoomMessage = { id: string; author: string; color: string; avatarUrl?: string | null; body: string; at: number; reactions?: Record<string, string[]> };
/** Presence shares identity metadata only. avatarUrl is a storage URL, never image bytes or document state. */
export type PeerPresence = { id: number; name: string; color: string; avatarUrl?: string | null; verified?: boolean };
export type CollaboratorIdentity = { name: string; color: string; avatarUrl: string | null; verified: boolean };
const validMessage = (value: unknown): value is RoomMessage => Boolean(value && typeof value === "object" && typeof (value as RoomMessage).id === "string" && typeof (value as RoomMessage).body === "string" && typeof (value as RoomMessage).author === "string" && typeof (value as RoomMessage).at === "number");

export function usePeerDocument(document: WorkspaceDocument, profile: LocalProfile | null, avatarUrl: string | null = null, collaborators: CollaboratorIdentity[] = []) {
  const ydoc = useMemo(() => new Y.Doc(), [document.id]);
  const fragment = useMemo(() => ydoc.getXmlFragment("editor"), [ydoc]);
  const messages = useMemo(() => ydoc.getArray<unknown>("room-chat"), [ydoc]);
  const metadata = useMemo(() => ydoc.getMap<string>("document-meta"), [ydoc]);
  const [connection, setConnection] = useState(document.roomCode ? "connecting" : "local");
  const [peers, setPeers] = useState<PeerPresence[]>([]);
  const [chat, setChat] = useState<RoomMessage[]>([]); const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [persistenceRecovered, setPersistenceRecovered] = useState(false);
  const [syncRevision, setSyncRevision] = useState(0);
  const [title, setTitle] = useState(document.title);
  const providerRef = useRef<WebrtcProvider | null>(null);

  useEffect(() => {
    let cancelled = false;
    let persistence: IndexeddbPersistence | null = null;
    const isFirstJoinReplica = Boolean(document.roomId && document.id === `room-${document.roomId}`);
    setPersistenceReady(isFirstJoinReplica);
    setPersistenceRecovered(false);
    const gate = createInitializationGate(3500, reason => {
      if (cancelled) return;
      setPersistenceRecovered(reason !== "ready");
      setPersistenceReady(true);
    });
    try {
      persistence = new IndexeddbPersistence(`peerlock-document-${document.id}`, ydoc);
      persistence.once("synced", () => gate.ready());
    } catch {
      gate.fail();
    }
    return () => { cancelled = true; gate.dispose(); persistence?.destroy(); ydoc.destroy(); };
  }, [document.id, ydoc]);
  useEffect(() => { if (!persistenceReady) return; const syncTitle = () => { const sharedTitle = metadata.get("title"); if (typeof sharedTitle === "string") setTitle(sharedTitle); else metadata.set("title", title); }; metadata.observe(syncTitle); syncTitle(); return () => metadata.unobserve(syncTitle); }, [metadata, persistenceReady, title]);
  useEffect(() => { const refreshChat = () => setChat(messages.toArray().filter(validMessage).sort((a, b) => a.at - b.at)); messages.observe(refreshChat); refreshChat(); return () => messages.unobserve(refreshChat); }, [messages]);
  useEffect(() => {
    providerRef.current?.destroy(); providerRef.current = null; setProvider(null); setPeers([]); setConnection(document.roomCode ? "connecting" : "local");
    if (!document.roomId || !document.roomTransportSecret || !profile) return;
    let cancelled = false;
    const transportSecret = document.roomTransportSecret;
    void opaqueRoomName(document.roomId, transportSecret).then(room => {
      if (cancelled) return;
      const nextProvider = new WebrtcProvider(room, ydoc, { signaling: [peerlockSignalingUrl()], password: transportSecret, maxConns: ROOM_MAX_REMOTE_CONNECTIONS }); providerRef.current = nextProvider; setProvider(nextProvider);
      const refreshAfterRemoteSync = ({ synced }: { synced: boolean }) => { if (synced) setSyncRevision(value => value + 1); };
      nextProvider.on("synced", refreshAfterRemoteSync); nextProvider.connect();
      nextProvider.awareness.setLocalStateField("user", { name: profile.name, color: profile.color, id: profile.id, avatarUrl });
      const updatePeers = () => setPeers(Array.from(nextProvider.awareness.getStates().entries()).map(([id, state]) => { const name = (state.user as { name?: string } | undefined)?.name ?? "Anonymous peer"; const match = collaborators.find(item => item.name === name); return { id, name, color: (state.user as { color?: string } | undefined)?.color ?? match?.color ?? "#607064", avatarUrl: (state.user as { avatarUrl?: string | null } | undefined)?.avatarUrl ?? match?.avatarUrl ?? null, verified: match?.verified ?? false }; }));
      nextProvider.awareness.on("change", updatePeers); nextProvider.on("status", event => setConnection(event.connected ? "connected" : "connecting")); updatePeers();
    });
    return () => { cancelled = true; providerRef.current?.destroy(); providerRef.current = null; setProvider(null); };
  }, [document.roomId, document.roomTransportSecret, profile?.id, profile?.name, profile?.color, avatarUrl, collaborators, ydoc]);
  const send = (body: string) => { if (!body.trim() || !profile) return; messages.push([{ id: crypto.randomUUID(), author: profile.name, color: profile.color, avatarUrl, body: body.trim(), at: Date.now(), reactions: {} }]); };
  const react = (messageId: string, emoji: string) => {
    if (!profile || !["👍", "❤", "😂", "🎉"].includes(emoji)) return;
    const items = messages.toArray(); const index = items.findIndex(value => validMessage(value) && value.id === messageId);
    const message = items[index]; if (index < 0 || !validMessage(message)) return;
    const reactions = toggleChatReaction(message.reactions, emoji, profile.id);
    ydoc.transact(() => { messages.delete(index, 1); messages.insert(index, [{ ...message, reactions }]); });
  };
  const updateTitle = (next: string) => { setTitle(next); if (persistenceReady) metadata.set("title", next); };
  return { ydoc, fragment, provider, connection, peers, chat, send, react, persistenceReady, persistenceRecovered, syncRevision, title, updateTitle };
}
