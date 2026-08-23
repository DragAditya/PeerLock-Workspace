import { describe, expect, it } from "vitest";
import { parseSharedAvatar } from "./accountAuth";

function avatarDataUrl(bytes: Buffer) { return `data:image/webp;base64,${bytes.toString("base64")}`; }

describe("shared account avatar validation", () => {
  it("accepts a small WebP-shaped payload for account-owned storage", () => {
    const sample = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), Buffer.from("avatar")]);
    expect(parseSharedAvatar(avatarDataUrl(sample))).toEqual(sample);
  });

  it("rejects non-WebP and oversized data URLs before storage", () => {
    expect(() => parseSharedAvatar("data:image/png;base64,AAAA")).toThrow(/Choose a PNG, JPEG, or WebP image/);
    const large = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), Buffer.alloc(1_000_001)]);
    expect(() => parseSharedAvatar(avatarDataUrl(large))).toThrow(/smaller than 1 MB/);
  });
});
