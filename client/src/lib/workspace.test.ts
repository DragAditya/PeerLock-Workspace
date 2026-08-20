import { afterEach, describe, expect, it, vi } from "vitest";
import { colorForSeed, getLocalProfile, isLocalProfileReady, MAX_ROOM_PARTICIPANTS, presenceColors, saveLocalProfile } from "./workspace";

describe("workspace models", () => {
  it("uses a stable valid presence color for the same local profile seed", () => {
    expect(colorForSeed("peer-one")).toBe(colorForSeed("peer-one"));
    expect(presenceColors).toContain(colorForSeed("peer-one"));
  });

  it("defines the small-room participant limit", () => {
    expect(MAX_ROOM_PARTICIPANTS).toBe(10);
  });

  it("requires a saved local display name before profile onboarding is complete", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    expect(isLocalProfileReady()).toBe(false);
    const profile = getLocalProfile();
    saveLocalProfile({ ...profile, name: "Yogeshwari" });
    expect(isLocalProfileReady()).toBe(true);
  });
});

afterEach(() => vi.unstubAllGlobals());
