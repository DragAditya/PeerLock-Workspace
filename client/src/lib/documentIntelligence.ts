export type TextStats = {
  words: number;
  characters: number;
  readingMinutes: number;
};

export function calculateTextStats(text: string): TextStats {
  const normalized = text.replace(/\s+/g, " ").trim();
  const words = normalized ? normalized.split(" ").length : 0;
  return {
    words,
    characters: normalized.length,
    readingMinutes: words ? Math.max(1, Math.ceil(words / 200)) : 0,
  };
}

export function calculateWritingProgress(words: number, target: number) {
  if (target <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((words / target) * 100)));
}

export function describeMeshActivity(peerCount: number, isCollaborative: boolean) {
  if (peerCount > 0) return `${peerCount} peer${peerCount === 1 ? "" : "s"} visible on the mesh`;
  return isCollaborative ? "Awaiting private-room peers" : "Private room not started";
}
