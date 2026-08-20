import { describe, expect, it } from "vitest";
import { calculateTextStats, calculateWritingProgress, describeMeshActivity } from "./documentIntelligence";

describe("browser-local document intelligence", () => {
  it("calculates normalized writing metrics without persisting document text", () => {
    expect(calculateTextStats("  Peerlock\n\nkeeps   text local. ")).toEqual({
      words: 4,
      characters: 26,
      readingMinutes: 1,
    });
    expect(calculateTextStats("")).toEqual({ words: 0, characters: 0, readingMinutes: 0 });
  });

  it("caps writing target progress for a concise command strip", () => {
    expect(calculateWritingProgress(240, 800)).toBe(30);
    expect(calculateWritingProgress(1600, 800)).toBe(100);
    expect(calculateWritingProgress(20, 0)).toBe(100);
  });

  it("describes mesh activity accurately for local, waiting, and connected rooms", () => {
    expect(describeMeshActivity(0, false)).toBe("Private room not started");
    expect(describeMeshActivity(0, true)).toBe("Awaiting private-room peers");
    expect(describeMeshActivity(1, true)).toBe("1 peer visible on the mesh");
    expect(describeMeshActivity(3, true)).toBe("3 peers visible on the mesh");
  });
});
