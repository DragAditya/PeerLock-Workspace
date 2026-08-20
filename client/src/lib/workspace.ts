export const MAX_ROOM_PARTICIPANTS = 10;

export type LocalDocument = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  roomCode?: string;
  roomSecret?: string;
};

export type LocalProfile = {
  id: string;
  name: string;
  color: string;
};

export type PeerPresence = {
  clientId: string;
  name: string;
  color: string;
  isLocal?: boolean;
  isDirect?: boolean;
};

export type ConnectionState =
  | "loading-local"
  | "local-only"
  | "connecting"
  | "awaiting-peers"
  | "synced"
  | "offline"
  | "error";

export const presenceColors = [
  "#71E4C2",
  "#F4B860",
  "#A99FF7",
  "#F38BA8",
  "#79C4F2",
  "#B7E36B",
  "#F7A8E0",
  "#FF9B6A",
  "#8DE0C1",
  "#C9B8FF",
];

export function colorForSeed(seed: string) {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) | 0;
  }
  return presenceColors[Math.abs(value) % presenceColors.length];
}

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getLocalProfile(): LocalProfile {
  const storedId = localStorage.getItem("p2p-workspace.profile-id");
  const id = storedId ?? randomId();
  if (!storedId) localStorage.setItem("p2p-workspace.profile-id", id);

  const name = localStorage.getItem("p2p-workspace.profile-name")?.trim() || "Local editor";
  const color = localStorage.getItem("p2p-workspace.profile-color") || colorForSeed(id);
  return { id, name, color };
}

export function saveLocalProfile(profile: LocalProfile) {
  localStorage.setItem("p2p-workspace.profile-id", profile.id);
  localStorage.setItem("p2p-workspace.profile-name", profile.name.trim() || "Local editor");
  localStorage.setItem("p2p-workspace.profile-color", profile.color);
}
