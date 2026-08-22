import { describe, expect, it } from "vitest";
import { MAX_PROFILE_IMAGE_BYTES, profileImageValidationError } from "./profileImage";

describe("profile image validation", () => {
  it("accepts supported local images below the privacy-conscious size limit", () => {
    expect(profileImageValidationError({ type: "image/png", size: 1024 } as File)).toBeNull();
  });
  it("rejects unsupported formats and oversized images before browser compression", () => {
    expect(profileImageValidationError({ type: "image/gif", size: 1024 } as File)).toContain("PNG");
    expect(profileImageValidationError({ type: "image/jpeg", size: MAX_PROFILE_IMAGE_BYTES + 1 } as File)).toContain("2 MB");
  });
});
