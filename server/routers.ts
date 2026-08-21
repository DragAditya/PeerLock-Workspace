import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { formatWithGemini } from "./aiFormatter";
import { changeAccountPassword, clearAccountSession, registerAccount, requestPasswordReset, resetAccountPassword, sendVerificationEmail, signInAccount, verifyAccountEmail } from "./accountAuth";
import { clearGuestSession, createRegisteredRoom, decideRoomRequest, liveRoomCount, pendingRoomRequests, requestRoomJoin, roomAccess } from "./roomRegistry";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(options => options.ctx.user),
    account: publicProcedure.query(({ ctx }) => ctx.account),
    register: publicProcedure.input(z.object({ email: z.string().max(320), username: z.string().max(48), password: z.string().max(128) })).mutation(({ ctx, input }) => registerAccount(ctx.req, ctx.res, input)),
    signIn: publicProcedure.input(z.object({ email: z.string().max(320), password: z.string().max(128) })).mutation(({ ctx, input }) => signInAccount(ctx.req, ctx.res, input)),
    requestPasswordReset: publicProcedure.input(z.object({ email: z.string().max(320) })).mutation(({ ctx, input }) => requestPasswordReset(ctx.req, input.email)),
    resetPassword: publicProcedure.input(z.object({ token: z.string().min(24).max(256), password: z.string().max(128) })).mutation(({ ctx, input }) => resetAccountPassword(ctx.req, ctx.res, input)),
    changePassword: publicProcedure.input(z.object({ currentPassword: z.string().max(128), password: z.string().max(128) })).mutation(({ ctx, input }) => {
      if (!ctx.account) throw new Error("Sign in to change your password.");
      return changeAccountPassword(ctx.req, ctx.res, ctx.account.id, input);
    }),
    verifyEmail: publicProcedure.input(z.object({ token: z.string().min(24).max(256) })).mutation(({ input }) => verifyAccountEmail(input.token)),
    resendVerification: publicProcedure.mutation(async ({ ctx }) => {
      if (!ctx.account) throw new Error("Sign in to resend verification.");
      return sendVerificationEmail(ctx.req, ctx.account.id);
    }),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); clearAccountSession(ctx.res, ctx.req); return { success: true } as const; }),
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
