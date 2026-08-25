import { describe, expect, it } from "vitest";
import { normalizeWorkspaceDocument } from "./documentRecord";

describe("browser-local workspace record normalization", () => {
  it("keeps valid legacy records and supplies the safe default external-AI policy", () => {
    expect(normalizeWorkspaceDocument({ id: "note-1", title: "Local note", createdAt: 1, updatedAt: 2 })).toEqual({ id: "note-1", title: "Local note", createdAt: 1, updatedAt: 2, externalAiEnabled: true, roomCode: undefined, roomId: undefined, roomProtected: undefined, roomTransportSecret: undefined });
  });

  it("rejects malformed records before they reach workspace rendering", () => {
    expect(normalizeWorkspaceDocument({ id: "broken", title: 4, createdAt: 1, updatedAt: 2 })).toBeNull();
    expect(normalizeWorkspaceDocument(null)).toBeNull();
  });
});
