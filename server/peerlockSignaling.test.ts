import { describe, expect, it } from "vitest";
import { isPeerlockSignalTopic } from "./peerlockSignaling";

describe("Peerlock signaling topics", () => {
  it("allows only canonical opaque room topics", () => {
    expect(isPeerlockSignalTopic(`peerlock-${"a".repeat(40)}`)).toBe(true);
    expect(isPeerlockSignalTopic("peerlock-visible-room-code")).toBe(false);
    expect(isPeerlockSignalTopic("peerlock-123")).toBe(false);
  });
});
