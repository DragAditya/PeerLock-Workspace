import type { WebrtcProviderOptions } from "y-webrtc";
import { MAX_ROOM_PARTICIPANTS } from "./workspace";
import type { RoomCapacityState } from "@/hooks/useCollaborationDocument";

export const MAX_DIRECT_CONNECTIONS = MAX_ROOM_PARTICIPANTS - 1;

export function createWebrtcProviderOptions(roomSecret: string): WebrtcProviderOptions {
  return {
    password: roomSecret,
    maxConns: MAX_DIRECT_CONNECTIONS,
  };
}

export function getRoomCapacityState(remotePeerCount: number): RoomCapacityState {
  if (remotePeerCount > MAX_DIRECT_CONNECTIONS) return "above-limit";
  if (remotePeerCount === MAX_DIRECT_CONNECTIONS) return "at-limit";
  return "within-limit";
}
