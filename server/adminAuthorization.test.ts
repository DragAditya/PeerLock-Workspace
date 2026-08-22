import { describe, expect, it } from "vitest";
import { configuredSuperAdminEmail, isSuperAdminEmail } from "./adminAuthorization";
import { requireSuperAdmin } from "./adminService";

describe("configured super-admin identity", () => {
  it("recognizes only the server-configured email and does not reveal credentials", () => {
    const configured = configuredSuperAdminEmail();
    expect(configured).toMatch(/^\S+@\S+\.\S+$/);
    expect(isSuperAdminEmail(configured.toUpperCase())).toBe(true);
    expect(isSuperAdminEmail("another-user@example.com")).toBe(false);
  });

  it("blocks unverified, suspended, and non-admin accounts from administrative APIs", () => {
    const email = configuredSuperAdminEmail();
    expect(() => requireSuperAdmin({ id: "a", email: "other@example.com", username: "other", emailVerifiedAt: new Date(), suspendedAt: null })).toThrow("not authorized");
    expect(() => requireSuperAdmin({ id: "a", email, username: "admin", emailVerifiedAt: null, suspendedAt: null })).toThrow("Verify");
    expect(() => requireSuperAdmin({ id: "a", email, username: "admin", emailVerifiedAt: new Date(), suspendedAt: new Date() })).toThrow("suspended");
    expect(requireSuperAdmin({ id: "a", email, username: "admin", emailVerifiedAt: new Date(), suspendedAt: null }).id).toBe("a");
  });
});
