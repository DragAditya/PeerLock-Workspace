import { describe, expect, it } from "vitest";
import { appendNotice, createNotice } from "./notificationModel";

describe("notification model", () => {
  it("defaults to a safe informational notification and six-second timeout", () => {
    expect(createNotice({ title: "Ready" }, "notice-1")).toMatchObject({ id: "notice-1", kind: "info", timeoutMs: 6000, title: "Ready" });
  });
  it("keeps the most recent bounded notification stack", () => {
    const notices = ["1", "2", "3", "4"].map(id => createNotice({ title: id }, id));
    expect(appendNotice(notices, createNotice({ title: "5" }, "5")).map(notice => notice.id)).toEqual(["2", "3", "4", "5"]);
  });
});
