const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join("");
}

export function makeRoomSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

export function makeInvite(roomCode: string, roomSecret: string) { return `${window.location.origin}/r/${roomCode}#${roomSecret}`; }

export function readInvite() {
  const roomCode = window.location.pathname.match(/^\/(?:r|room)\/([A-Z0-9]{8})$/i)?.[1]?.toUpperCase();
  const roomSecret = window.location.hash.slice(1);
  return roomCode && /^[a-f0-9]{64}$/i.test(roomSecret) ? { roomCode, roomSecret } : null;
}

export async function opaqueRoomName(roomCode: string, secret: string) {
  const bytes = new TextEncoder().encode(`${roomCode}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `peerlock-${Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("").slice(0, 40)}`;
}
