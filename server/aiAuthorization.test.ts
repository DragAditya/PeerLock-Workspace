import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("AI formatting authorization", () => {
  it("rejects direct unauthenticated formatting requests before invoking an external model", async () => {
    const caller = appRouter.createCaller({ account: null, req: { headers: {} }, res: {} } as TrpcContext);
    await expect(caller.ai.format({ text: "# private note", consent: true, externalAiEnabled: true })).rejects.toMatchObject<Partial<TRPCError>>({ code: "UNAUTHORIZED" });
  });
});
