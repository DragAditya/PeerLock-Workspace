const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join("");
}

export function makeRoomSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

export function makeInvite(roomCode: string, protectedRoom = false, origin = window.location.origin) { return `${origin}/r/${roomCode}${protectedRoom ? "?access=protected" : ""}`; }

export function readInvite() {
  const roomCode = window.location.pathname.match(/^\/(?:r|room)\/([A-Z0-9]{8})$/i)?.[1]?.toUpperCase();
  const access = new URLSearchParams(window.location.search).get("access");
  return roomCode ? { roomCode, protected: access === "protected" } : null;
}

export async function opaqueRoomName(roomId: string, transportSecret: string) {
  const bytes = new TextEncoder().encode(`peerlock-v2:${roomId}:${transportSecret}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `peerlock-${Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("").slice(0, 40)}`;
}

export function peerlockSignalingUrl(origin = window.location) {
  const scheme = origin.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${origin.host}/api/peerlock-signaling`;
}
