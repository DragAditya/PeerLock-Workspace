import { describe, expect, it } from "vitest";
import { createRoomMessage } from "@/features/editor/usePeerDocument";

describe("encrypted room-chat metadata", () => {
  it("does not persist a profile-image URL with a new message", () => {
    const message = createRoomMessage("  Hello peers  ", { id: "peer-1", name: "Ari", color: "#0f766e", avatarDataUrl: "data:image/webp;base64,private" });
    expect(message).toMatchObject({ author: "Ari", color: "#0f766e", body: "Hello peers", reactions: {} });
    expect(message).not.toHaveProperty("avatarUrl");
  });
});
