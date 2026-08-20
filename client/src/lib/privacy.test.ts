import { describe, expect, it } from "vitest";
import { privacyCopy } from "./privacy";

describe("privacy copy", () => {
  it("communicates the no-document-server-storage guarantee without hiding metadata limits", () => {
    expect(privacyCopy.header).toContain("never reaches this app's server");
    expect(privacyCopy.preciseScope).toContain("connection metadata");
    expect(privacyCopy.preciseScope).not.toContain("anonymous");
  });
});
