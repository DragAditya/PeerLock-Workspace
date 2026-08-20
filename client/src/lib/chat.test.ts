import { describe, expect, it } from "vitest";
import { createRoomChatMessage, createRoomChatReaction, normalizeChatBody, normalizeSharedMessages, normalizeSharedReactions } from "./chat";

describe("room chat models", () => {
  it("normalizes and bounds a peer chat message before it reaches the Yjs document", () => {
    expect(normalizeChatBody("  share   the  API notes \n please ")).toBe("share the API notes please");
    expect(normalizeChatBody(" ")).toBe("");
  });

  it("creates a local identity-bearing message without server identifiers", () => {
    const message = createRoomChatMessage({ id: "local-1", name: "Yogeshwari", color: "#71E4C2" }, "Ready to review", ["peer-2"], 1000);
    expect(message).toMatchObject({ authorId: "local-1", authorName: "Yogeshwari", body: "Ready to review", createdAt: 1000 });
  });

  it("ignores malformed or legacy shared values instead of passing them into the chat renderer", () => {
    const messages = normalizeSharedMessages([
      { id: "ok", authorId: "peer", authorName: "Peer", color: "#71E4C2", body: "Hello", createdAt: 1 },
      "old string message",
      { id: "missing-fields" },
      { id: "empty", authorId: "peer", authorName: "Peer", color: "#71E4C2", body: "   ", createdAt: 2 },
    ]);
    expect(messages).toEqual([{ id: "ok", authorId: "peer", authorName: "Peer", color: "#71E4C2", body: "Hello", createdAt: 1, mentions: [] }]);
  });

  it("keeps valid peer reaction events while ignoring malformed payloads", () => {
    const profile = { id: "local-1", name: "Yogeshwari", color: "#71E4C2" };
    const reaction = createRoomChatReaction(profile, "message-1", "👍", 10);
    expect(reaction).toMatchObject({ id: "message-1:local-1:👍", messageId: "message-1", authorId: "local-1" });
    expect(normalizeSharedReactions([reaction, { id: "broken" }, "legacy"])).toEqual([reaction]);
  });
});
