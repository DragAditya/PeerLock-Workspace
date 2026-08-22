import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { formatWithGemini } from "./aiFormatter";
import { accountEmailDiagnostics, changeAccountPassword, clearAccountSession, registerAccount, requestPasswordReset, resetAccountPassword, safeAccountError, sendVerificationEmail, signInAccount, verifyAccountEmail } from "./accountAuth";
import { clearGuestSession, createRegisteredRoom, decideRoomRequest, liveRoomCount, pendingRoomRequests, requestRoomJoin, roomAccess } from "./roomRegistry";
import { z } from "zod";
import { getDevDiagnostics } from "./devDiagnostics";
import { TRPCError } from "@trpc/server";
import { activeAnnouncements, adminAuditTrail, adminCreateAnnouncement, adminDeleteRoom, adminListAccounts, adminListAnnouncements, adminListRooms, adminOverview, adminRevokeMembership, adminSetAccountSuspension, adminSetAnnouncementActive, requireSuperAdmin } from "./adminService";
import { isSuperAdminEmail } from "./adminAuthorization";

function requireVerifiedAccount(ctx: { account: { id: string; email: string; username: string; emailVerifiedAt: Date | null; suspendedAt?: Date | null } | null }) {
  if (!ctx.account) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to use Peerlock." });
  if (!ctx.account.emailVerifiedAt) throw new TRPCError({ code: "FORBIDDEN", message: "Verify your email to use Peerlock." });
  if (ctx.account.suspendedAt) throw new TRPCError({ code: "FORBIDDEN", message: "This account is suspended." });
  return ctx.account;
}
function requireAdmin(ctx: { account: { id: string; email: string; username: string; emailVerifiedAt: Date | null; suspendedAt?: Date | null } | null }) { const account = requireVerifiedAccount(ctx); try { return requireSuperAdmin({ ...account, suspendedAt: account.suspendedAt ?? null }); } catch (error) { throw new TRPCError({ code: "FORBIDDEN", message: error instanceof Error ? error.message : "Admin access is unavailable." }); } }

async function safeAccountCall<T>(work: () => Promise<T>) { try { return await work(); } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: safeAccountError(error) }); } }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(options => options.ctx.user),
    account: publicProcedure.query(({ ctx }) => ctx.account ? { ...ctx.account, isSuperAdmin: isSuperAdminEmail(ctx.account.email) } : null),
    register: publicProcedure.input(z.object({ email: z.string().max(320), username: z.string().max(48), password: z.string().max(128) })).mutation(({ ctx, input }) => safeAccountCall(() => registerAccount(ctx.req, ctx.res, input))),
    signIn: publicProcedure.input(z.object({ email: z.string().max(320), password: z.string().max(128) })).mutation(({ ctx, input }) => safeAccountCall(() => signInAccount(ctx.req, ctx.res, input))),
    requestPasswordReset: publicProcedure.input(z.object({ email: z.string().max(320) })).mutation(({ ctx, input }) => safeAccountCall(() => requestPasswordReset(ctx.req, input.email))),
    resetPassword: publicProcedure.input(z.object({ token: z.string().min(24).max(256), password: z.string().max(128) })).mutation(({ ctx, input }) => safeAccountCall(() => resetAccountPassword(ctx.req, ctx.res, input))),
    changePassword: publicProcedure.input(z.object({ currentPassword: z.string().max(128), password: z.string().max(128) })).mutation(({ ctx, input }) => {
      if (!ctx.account) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to change your password." });
      return safeAccountCall(() => changeAccountPassword(ctx.req, ctx.res, ctx.account!.id, input));
    }),
    verifyEmail: publicProcedure.input(z.object({ otp: z.string().regex(/^\d{6}$/) })).mutation(({ ctx, input }) => {
      if (!ctx.account) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to verify your email." });
      return safeAccountCall(() => verifyAccountEmail(ctx.account!.id, input.otp));
    }),
    resendVerification: publicProcedure.mutation(async ({ ctx }) => {
      if (!ctx.account) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to resend verification." });
      return safeAccountCall(() => sendVerificationEmail(ctx.req, ctx.account!.id));
    }),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); clearAccountSession(ctx.res, ctx.req); return { success: true } as const; }),
  }),
  ai: router({
    format: publicProcedure.input(z.object({ text: z.string(), instruction: z.string().max(240).optional(), action: z.enum(["format_document", "improve", "summarize", "expand", "simplify", "explain", "format"]).default("format_document"), consent: z.literal(true), externalAiEnabled: z.boolean() })).mutation(({ input }) => formatWithGemini(input)),
  }),
  diagnostics: router({
    snapshot: publicProcedure.query(() => getDevDiagnostics()),
  }),
  announcement: router({
    active: publicProcedure.query(() => activeAnnouncements()),
  }),
  admin: router({
    overview: publicProcedure.query(({ ctx }) => { requireAdmin(ctx); return adminOverview(); }),
    accounts: publicProcedure.query(({ ctx }) => { requireAdmin(ctx); return adminListAccounts(); }),
    setAccountSuspension: publicProcedure.input(z.object({ accountId: z.string().uuid(), suspended: z.boolean(), reason: z.string().max(240).optional() })).mutation(({ ctx, input }) => adminSetAccountSuspension(requireAdmin(ctx), input)),
    rooms: publicProcedure.query(({ ctx }) => { requireAdmin(ctx); return adminListRooms(); }),
    revokeMembership: publicProcedure.input(z.object({ roomId: z.string().uuid(), membershipId: z.string().uuid() })).mutation(({ ctx, input }) => adminRevokeMembership(requireAdmin(ctx), input)),
    deleteRoom: publicProcedure.input(z.object({ roomId: z.string().uuid() })).mutation(({ ctx, input }) => adminDeleteRoom(requireAdmin(ctx), input.roomId)),
    announcements: publicProcedure.query(({ ctx }) => { requireAdmin(ctx); return adminListAnnouncements(); }),
    createAnnouncement: publicProcedure.input(z.object({ title: z.string().min(2).max(120), message: z.string().min(2).max(480), tone: z.enum(["info", "success", "warning", "error"]).default("info"), expiresAt: z.coerce.date().optional().nullable() })).mutation(({ ctx, input }) => adminCreateAnnouncement(requireAdmin(ctx), input)),
    setAnnouncementActive: publicProcedure.input(z.object({ id: z.string().uuid(), active: z.boolean() })).mutation(({ ctx, input }) => adminSetAnnouncementActive(requireAdmin(ctx), input.id, input.active)),
    audit: publicProcedure.query(({ ctx }) => { requireAdmin(ctx); return adminAuditTrail(); }),
  }),
  room: router({
    create: publicProcedure.input(z.object({ protected: z.boolean(), password: z.string().max(256).optional(), identity: z.object({ name: z.string().min(1).max(64), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }) })).mutation(({ ctx, input }) => { const account = requireVerifiedAccount(ctx); return createRegisteredRoom(ctx, { ...input, identity: { ...input.identity, name: account.username } }); }),
    requestJoin: publicProcedure.input(z.object({ code: z.string().regex(/^[A-Z0-9]{8}$/), password: z.string().max(256).optional(), identity: z.object({ name: z.string().min(1).max(64), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }) })).mutation(({ ctx, input }) => { const account = requireVerifiedAccount(ctx); return requestRoomJoin(ctx, { ...input, identity: { ...input.identity, name: account.username } }); }),
    logout: publicProcedure.mutation(({ ctx }) => clearGuestSession(ctx)),
    access: publicProcedure.input(z.object({ roomId: z.string().uuid() })).query(({ ctx, input }) => { requireVerifiedAccount(ctx); return roomAccess(ctx, input.roomId); }),
    pendingRequests: publicProcedure.input(z.object({ roomId: z.string().uuid() })).query(({ ctx, input }) => { requireVerifiedAccount(ctx); return pendingRoomRequests(ctx, input.roomId); }),
    decideRequest: publicProcedure.input(z.object({ roomId: z.string().uuid(), requestId: z.string().uuid(), allow: z.boolean() })).mutation(({ ctx, input }) => { requireVerifiedAccount(ctx); return decideRoomRequest(ctx, input); }),
    liveCount: publicProcedure.query(({ ctx }) => { requireVerifiedAccount(ctx); return liveRoomCount(); }),
  }),
});

export type AppRouter = typeof appRouter;
