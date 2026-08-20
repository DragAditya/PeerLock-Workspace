import type { PeerPresence } from "@/features/editor/usePeerDocument";
import { isRoomAtCapacity } from "./capacity";
import React from "react";

export function roomState(connection: string, peerCount: number) {
  if (isRoomAtCapacity(peerCount)) return { label: "Room at capacity", detail: "This room has reached its ten-person peer limit.", tone: "capacity" };
  if (connection === "connected") return { label: "Mesh connected", detail: "Peers are exchanging encrypted CRDT updates directly.", tone: "connected" };
  if (connection === "connecting") return { label: "Establishing mesh", detail: "Waiting for an invited peer to complete the encrypted connection.", tone: "connecting" };
  return { label: "Local replica", detail: "This document is persisted locally and has no open peer room.", tone: "local" };
}

export function PeerTopology({ peers, connection, localColor }: { peers: PeerPresence[]; connection: string; localColor?: string }) {
  const state = roomState(connection, peers.length);
  return <section className={`peer-topology peer-topology-${state.tone}`}><header><p className="eyebrow">Peer topology</p><strong>{state.label}</strong></header><div className="peer-topology-map"><span className="topology-local" style={{ backgroundColor: localColor }} title="Local peer">You</span>{peers.filter(peer => peer.id !== peers[0]?.id).slice(0, 9).map((peer, index) => <span key={peer.id} className="topology-remote" style={{ backgroundColor: peer.color, "--node": index } as React.CSSProperties} title={peer.name}>{peer.name.slice(0, 1).toUpperCase()}</span>)}</div><p>{state.detail}</p></section>;
}
