import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("room collaborator directory authorization", () => {
  it("rejects an unauthenticated direct caller before resolving room metadata", async () => {
    const caller = appRouter.createCaller({ account: null, req: { headers: {} }, res: {} } as TrpcContext);
    await expect(caller.room.collaborators({ roomId: "00000000-0000-4000-8000-000000000001" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "UNAUTHORIZED" });
  });
});
