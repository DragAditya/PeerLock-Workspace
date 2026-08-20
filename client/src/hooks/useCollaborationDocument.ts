import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import { useEffect, useRef, useState } from "react";
import { deriveOpaqueRoomName } from "@/lib/room";
import { createWebrtcProviderOptions, getRoomCapacityState } from "@/lib/collaboration";
import type { ConnectionState, LocalDocument, LocalProfile, PeerPresence } from "@/lib/workspace";

export type RoomCapacityState = "within-limit" | "at-limit" | "above-limit";

type CollaborationResource = {
  ydoc: Y.Doc;
  provider?: WebrtcProvider;
};

type UseCollaborationDocumentOptions = {
  document: LocalDocument;
  profile: LocalProfile;
  onActivity?: () => void;
};

export function useCollaborationDocument({ document, profile, onActivity }: UseCollaborationDocumentOptions) {
  const [resource, setResource] = useState<CollaborationResource>();
  const [connectionState, setConnectionState] = useState<ConnectionState>("loading-local");
  const [peers, setPeers] = useState<PeerPresence[]>([]);
  const [directPeerCount, setDirectPeerCount] = useState(0);
  const [roomCapacity, setRoomCapacity] = useState<RoomCapacityState>("within-limit");
  const activityTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let disposed = false;
    let provider: WebrtcProvider | undefined;
    const ydoc = new Y.Doc();
    const persistence = new IndexeddbPersistence(`p2p-workspace:document:${document.id}`, ydoc);

    const localPeer: PeerPresence = {
      clientId: String(ydoc.clientID),
      name: profile.name,
      color: profile.color,
      isLocal: true,
      isDirect: true,
    };

    const scheduleActivity = () => {
      if (!onActivity) return;
      window.clearTimeout(activityTimer.current);
      activityTimer.current = window.setTimeout(onActivity, 850);
    };

    ydoc.on("update", scheduleActivity);
    setResource(undefined);
    setPeers([localPeer]);
    setDirectPeerCount(0);
    setRoomCapacity("within-limit");
    setConnectionState("loading-local");

    const initializePeerSync = async () => {
      if (!document.roomCode || !document.roomSecret) {
        if (!disposed) {
          setResource({ ydoc });
          setConnectionState("local-only");
        }
        return;
      }

      try {
        const roomName = await deriveOpaqueRoomName(document.roomCode, document.roomSecret);
        if (disposed) return;

        provider = new WebrtcProvider(roomName, ydoc, createWebrtcProviderOptions(document.roomSecret));

        provider.awareness.setLocalStateField("user", {
          id: profile.id,
          name: profile.name,
          color: profile.color,
        });

        const updatePeers = (event?: { webrtcConns?: Map<string, unknown> }) => {
          const directConnectionIds = new Set(Array.from(event?.webrtcConns?.keys() ?? []));
          const awarenessEntries = Array.from(provider!.awareness.getStates().entries()) as Array<[
            number,
            { user?: { name?: string; color?: string } }
          ]>;
          const awarenessPeers = awarenessEntries
            .filter(([clientId]) => clientId !== ydoc.clientID)
            .map(([clientId, state], index): PeerPresence => {
              const user = state.user;
              return {
                clientId: String(clientId),
                name: user?.name || `Peer ${index + 1}`,
                color: user?.color || "#A99FF7",
                isDirect: directConnectionIds.size === 0 || directConnectionIds.has(String(clientId)),
              };
            });
          if (!disposed) {
            setPeers([localPeer, ...awarenessPeers]);
            setDirectPeerCount(directConnectionIds.size || awarenessPeers.length);
            setRoomCapacity(getRoomCapacityState(awarenessPeers.length));
            setConnectionState(awarenessPeers.length ? "synced" : navigator.onLine ? "awaiting-peers" : "offline");
          }
        };

        provider.awareness.on("change", updatePeers);
        provider.on("peers", updatePeers);
        updatePeers();
        if (!disposed) setResource({ ydoc, provider });
      } catch {
        if (!disposed) {
          setResource({ ydoc });
          setConnectionState("error");
        }
      }
    };

    const onOnline = () => setConnectionState(current => current === "offline" ? "awaiting-peers" : current);
    const onOffline = () => setConnectionState("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    persistence.once("synced", initializePeerSync);

    return () => {
      disposed = true;
      window.clearTimeout(activityTimer.current);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      ydoc.off("update", scheduleActivity);
      provider?.destroy();
      persistence.destroy();
      ydoc.destroy();
    };
  }, [document.id, document.roomCode, document.roomSecret, onActivity, profile.color, profile.id, profile.name]);

  return {
    ydoc: resource?.ydoc,
    provider: resource?.provider,
    peers,
    directPeerCount,
    roomCapacity,
    connectionState,
    isCollaborative: Boolean(document.roomCode && document.roomSecret),
  };
}
