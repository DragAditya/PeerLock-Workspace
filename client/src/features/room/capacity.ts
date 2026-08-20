export const ROOM_MAX_PEERS = 10;
export const ROOM_MAX_REMOTE_CONNECTIONS = ROOM_MAX_PEERS - 1;
export function isRoomAtCapacity(awarenessPeerCount: number) { return awarenessPeerCount >= ROOM_MAX_PEERS; }
export function visiblePeerCount(awarenessPeerCount: number) { return Math.min(Math.max(0, awarenessPeerCount), ROOM_MAX_PEERS); }
