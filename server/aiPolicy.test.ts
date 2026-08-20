import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("ai.formatDocument privacy policy", () => {
  it("rejects a formatting request when the document policy disables external AI", async () => {
    const caller = appRouter.createCaller({} as TrpcContext);

    await expect(caller.ai.formatDocument({
      documentText: "Sensitive encrypted notes",
      instruction: "Format this document",
      consent: true,
      externalAiAllowed: false,
    } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
