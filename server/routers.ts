import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { formatWithGemini } from "./aiFormatter";
import { clearGuestSession, createRegisteredRoom, decideRoomRequest, liveRoomCount, pendingRoomRequests, requestRoomJoin, roomAccess } from "./roomRegistry";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(options => options.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  ai: router({
    format: publicProcedure.input(z.object({ text: z.string(), instruction: z.string().max(240).optional(), action: z.enum(["format_document", "improve", "summarize", "expand", "simplify", "explain", "format"]).default("format_document"), consent: z.literal(true), externalAiEnabled: z.boolean() })).mutation(({ input }) => formatWithGemini(input)),
  }),
  room: router({
    create: publicProcedure.input(z.object({ protected: z.boolean(), password: z.string().max(256).optional(), identity: z.object({ name: z.string().min(1).max(64), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }) })).mutation(({ ctx, input }) => createRegisteredRoom(ctx, input)),
    requestJoin: publicProcedure.input(z.object({ code: z.string().regex(/^[A-Z0-9]{8}$/), password: z.string().max(256).optional(), identity: z.object({ name: z.string().min(1).max(64), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }) })).mutation(({ ctx, input }) => requestRoomJoin(ctx, input)),
    logout: publicProcedure.mutation(({ ctx }) => clearGuestSession(ctx)),
    access: publicProcedure.input(z.object({ roomId: z.string().uuid() })).query(({ ctx, input }) => roomAccess(ctx, input.roomId)),
    pendingRequests: publicProcedure.input(z.object({ roomId: z.string().uuid() })).query(({ ctx, input }) => pendingRoomRequests(ctx, input.roomId)),
    decideRequest: publicProcedure.input(z.object({ roomId: z.string().uuid(), requestId: z.string().uuid(), allow: z.boolean() })).mutation(({ ctx, input }) => decideRoomRequest(ctx, input)),
    liveCount: publicProcedure.query(() => liveRoomCount()),
  }),
});

export type AppRouter = typeof appRouter;
