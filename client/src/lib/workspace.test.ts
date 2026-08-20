import { describe, expect, it } from "vitest";
import { colorForSeed, MAX_ROOM_PARTICIPANTS, presenceColors } from "./workspace";

describe("workspace models", () => {
  it("uses a stable valid presence color for the same local profile seed", () => {
    expect(colorForSeed("peer-one")).toBe(colorForSeed("peer-one"));
    expect(presenceColors).toContain(colorForSeed("peer-one"));
  });

  it("defines the small-room participant limit", () => {
    expect(MAX_ROOM_PARTICIPANTS).toBe(10);
  });
});
