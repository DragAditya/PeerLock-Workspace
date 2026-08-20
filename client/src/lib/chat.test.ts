import { describe, expect, it } from "vitest";
import { createRoomChatMessage, normalizeChatBody } from "./chat";

describe("room chat models", () => {
  it("normalizes and bounds a peer chat message before it reaches the Yjs document", () => {
    expect(normalizeChatBody("  share   the  API notes \n please ")).toBe("share the API notes please");
    expect(normalizeChatBody(" ")).toBe("");
  });

  it("creates a local identity-bearing message without server identifiers", () => {
    const message = createRoomChatMessage({ id: "local-1", name: "Yogeshwari", color: "#71E4C2" }, "Ready to review", 1000);
    expect(message).toMatchObject({ authorId: "local-1", authorName: "Yogeshwari", body: "Ready to review", createdAt: 1000 });
  });
});
