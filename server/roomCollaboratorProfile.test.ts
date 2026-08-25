import { describe, expect, it } from "vitest";
import { safeCollaboratorProfile } from "./roomRegistry";

describe("approved-room collaborator profile responses", () => {
  it("returns only shared identity fields and omits an internal account identifier", () => {
    const response = safeCollaboratorProfile({ displayName: "Peer", displayColor: "#0f766e", username: "peerlock-user", avatarKey: "avatars/peer.webp", verifiedAt: new Date("2026-01-01") });
    expect(response).toEqual({ name: "peerlock-user", color: "#0f766e", avatarUrl: "/manus-storage/avatars/peer.webp", verified: true });
    expect(response).not.toHaveProperty("accountId");
  });
});
