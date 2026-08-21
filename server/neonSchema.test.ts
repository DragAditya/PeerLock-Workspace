import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { peerlockGuestSessions, peerlockRoomMemberships, peerlockRooms } from "../drizzle/schema";

describe("Neon PostgreSQL room schema", () => {
  it("keeps only the metadata tables required for guest access and room approval", () => {
    expect(getTableName(peerlockGuestSessions)).toBe("peerlock_guest_sessions");
    expect(getTableName(peerlockRooms)).toBe("peerlock_rooms");
    expect(getTableName(peerlockRoomMemberships)).toBe("peerlock_room_memberships");
    expect(Object.keys(peerlockRooms)).not.toContain("documentContent");
    expect(Object.keys(peerlockRoomMemberships)).not.toContain("chatContent");
  });
});
