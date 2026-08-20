const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 8;

function toBase64Url(bytes: Uint8Array) {
  let value = "";
  bytes.forEach(byte => {
    value += String.fromCharCode(byte);
  });
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function createRoomCode() {
  const bytes = randomBytes(ROOM_CODE_LENGTH);
  return Array.from(bytes, byte => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]).join("");
}

export function createRoomSecret() {
  return toBase64Url(randomBytes(32));
}

export function isValidRoomCode(value: string) {
  return new RegExp(`^[${ROOM_ALPHABET}]{${ROOM_CODE_LENGTH}}$`).test(value.trim().toUpperCase());
}

export function normalizeRoomCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, ROOM_CODE_LENGTH);
}

export async function deriveOpaqueRoomName(roomCode: string, roomSecret: string) {
  const material = new TextEncoder().encode(`p2p-encrypted-workspace:${roomCode}:${roomSecret}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return `p2p-${toBase64Url(new Uint8Array(digest).slice(0, 18))}`;
}

export function buildInviteUrl(roomCode: string, roomSecret: string) {
  const base = `${window.location.origin}/room/${roomCode}`;
  return `${base}#key=${encodeURIComponent(roomSecret)}`;
}

export function readInviteFromLocation() {
  const match = window.location.pathname.match(/^\/room\/([A-Z2-9]{8})$/i);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const roomCode = match?.[1] ? normalizeRoomCode(match[1]) : "";
  const roomSecret = hash.get("key") ?? "";
  return { roomCode, roomSecret };
}

export function parseInviteInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { roomCode: "", roomSecret: "" };

  try {
    const url = new URL(trimmed, window.location.origin);
    const roomCode = normalizeRoomCode(url.pathname.split("/").pop() ?? "");
    const roomSecret = new URLSearchParams(url.hash.replace(/^#/, "")).get("key") ?? "";
    return { roomCode, roomSecret };
  } catch {
    const [rawCode, rawHash] = trimmed.split("#");
    const roomCode = normalizeRoomCode(rawCode);
    const roomSecret = new URLSearchParams(rawHash ?? "").get("key") ?? "";
    return { roomCode, roomSecret };
  }
}
