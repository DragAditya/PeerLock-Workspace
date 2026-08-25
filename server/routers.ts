import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { formatWithGemini } from "./aiFormatter";
import { accountEmailDiagnostics, changeAccountPassword, clearAccountSession, registerAccount, requestPasswordReset, resetAccountPassword, safeAccountError, sendVerificationEmail, signInAccount, verifyAccountEmail, updateAccountAvatar, removeAccountAvatar } from "./accountAuth";
import { clearGuestSession, createRegisteredRoom, decideRoomRequest, liveRoomCount, pendingRoomRequests, requestRoomJoin, roomAccess, roomCollaborators } from "./roomRegistry";
import { z } from "zod";
import { getDevDiagnostics } from "./devDiagnostics";
import { TRPCError } from "@trpc/server";
import { adminAuditTrail, adminDeleteRoom, adminListAccounts, adminListRooms, adminOverview, adminPermanentlyDeleteAccount, adminRevokeMembership, adminSetAccountSuspension, requireSuperAdmin } from "./adminService";
import { isSuperAdminEmail } from "./adminAuthorization";

function requireVerifiedAccount(ctx: { account: { id: string; email: string; username: string; emailVerifiedAt: Date | null; suspendedAt?: Date | null } | null }) {
  if (!ctx.account) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to use Peerlock." });
  if (!ctx.account.emailVerifiedAt) throw new TRPCError({ code: "FORBIDDEN", message: "Verify your email to use Peerlock." });
  if (ctx.account.suspendedAt) throw new TRPCError({ code: "FORBIDDEN", message: "This account is suspended." });
  return ctx.account;
}
function requireAdmin(ctx: { account: { id: string; email: string; username: string; emailVerifiedAt: Date | null; suspendedAt?: Date | null } | null }) { const account = requireVerifiedAccount(ctx); try { return requireSuperAdmin({ ...account, suspendedAt: account.suspendedAt ?? null }); } catch (error) { throw new TRPCError({ code: "FORBIDDEN", message: error instanceof Error ? error.message : "Admin access is unavailable." }); } }

async function safeAccountCall<T>(work: () => Promise<T>) { try { return await work(); } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: safeAccountError(error) }); } }
async function safeRoomCall<T>(work: () => Promise<T>) { try { return await work(); } catch (error) { const message = error instanceof Error ? error.message : ""; if (/password/i.test(message)) throw new TRPCError({ code: "BAD_REQUEST", message: "The room password is incorrect." }); if (/does not exist|was not found|membership was not found/i.test(message)) throw new TRPCError({ code: "NOT_FOUND", message: "This room is no longer available to this browser." }); if (/only the room owner|only approved room members/i.test(message)) throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission for this room action." }); if (/temporarily unavailable/i.test(message)) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The room registry is temporarily unavailable. Please try again shortly." }); throw new TRPCError({ code: "BAD_REQUEST", message: "The room action could not be completed. Please try again." }); } }

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
    uploadAvatar: publicProcedure.input(z.object({ dataUrl: z.string().max(1_500_000) })).mutation(({ ctx, input }) => safeAccountCall(() => updateAccountAvatar(requireVerifiedAccount(ctx).id, input.dataUrl))),
    removeAvatar: publicProcedure.mutation(({ ctx }) => safeAccountCall(() => removeAccountAvatar(requireVerifiedAccount(ctx).id))),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); clearAccountSession(ctx.res, ctx.req); return { success: true } as const; }),
  }),
  ai: router({
    format: publicProcedure.input(z.object({ text: z.string(), instruction: z.string().max(240).optional(), action: z.enum(["format_document", "improve", "summarize", "expand", "simplify", "explain", "format"]).default("format_document"), consent: z.literal(true), externalAiEnabled: z.boolean() })).mutation(({ ctx, input }) => { requireVerifiedAccount(ctx); return formatWithGemini(input); }),
  }),
  diagnostics: router({
    snapshot: publicProcedure.query(() => getDevDiagnostics()),
  }),
  admin: router({
    overview: publicProcedure.query(({ ctx }) => { requireAdmin(ctx); return adminOverview(); }),
    accounts: publicProcedure.query(({ ctx }) => { requireAdmin(ctx); return adminListAccounts(); }),
    setAccountSuspension: publicProcedure.input(z.object({ accountId: z.string().uuid(), suspended: z.boolean(), reason: z.string().max(240).optional() })).mutation(({ ctx, input }) => adminSetAccountSuspension(requireAdmin(ctx), input)),
    permanentlyDeleteAccount: publicProcedure.input(z.object({ accountId: z.string().uuid() })).mutation(({ ctx, input }) => adminPermanentlyDeleteAccount(requireAdmin(ctx), input.accountId)),
    rooms: publicProcedure.query(({ ctx }) => { requireAdmin(ctx); return adminListRooms(); }),
    revokeMembership: publicProcedure.input(z.object({ roomId: z.string().uuid(), membershipId: z.string().uuid() })).mutation(({ ctx, input }) => adminRevokeMembership(requireAdmin(ctx), input)),
    deleteRoom: publicProcedure.input(z.object({ roomId: z.string().uuid() })).mutation(({ ctx, input }) => adminDeleteRoom(requireAdmin(ctx), input.roomId)),
    audit: publicProcedure.query(({ ctx }) => { requireAdmin(ctx); return adminAuditTrail(); }),
  }),
  room: router({
    create: publicProcedure.input(z.object({ protected: z.boolean(), password: z.string().max(256).optional(), identity: z.object({ name: z.string().min(1).max(64), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }) })).mutation(({ ctx, input }) => { const account = requireVerifiedAccount(ctx); return safeRoomCall(() => createRegisteredRoom(ctx, { ...input, identity: { ...input.identity, name: account.username } })); }),
    requestJoin: publicProcedure.input(z.object({ code: z.string().regex(/^[A-Z0-9]{8}$/), password: z.string().max(256).optional(), identity: z.object({ name: z.string().min(1).max(64), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }) })).mutation(({ ctx, input }) => { const account = requireVerifiedAccount(ctx); return safeRoomCall(() => requestRoomJoin(ctx, { ...input, identity: { ...input.identity, name: account.username } })); }),
    logout: publicProcedure.mutation(({ ctx }) => clearGuestSession(ctx)),
    access: publicProcedure.input(z.object({ roomId: z.string().uuid() })).query(({ ctx, input }) => { requireVerifiedAccount(ctx); return safeRoomCall(() => roomAccess(ctx, input.roomId)); }),
    collaborators: publicProcedure.input(z.object({ roomId: z.string().uuid() })).query(({ ctx, input }) => { requireVerifiedAccount(ctx); return safeRoomCall(() => roomCollaborators(ctx, input.roomId)); }),
    pendingRequests: publicProcedure.input(z.object({ roomId: z.string().uuid() })).query(({ ctx, input }) => { requireVerifiedAccount(ctx); return safeRoomCall(() => pendingRoomRequests(ctx, input.roomId)); }),
    decideRequest: publicProcedure.input(z.object({ roomId: z.string().uuid(), requestId: z.string().uuid(), allow: z.boolean() })).mutation(({ ctx, input }) => { requireVerifiedAccount(ctx); return safeRoomCall(() => decideRoomRequest(ctx, input)); }),
    liveCount: publicProcedure.query(({ ctx }) => { requireVerifiedAccount(ctx); return liveRoomCount(); }),
  }),
});

export type AppRouter = typeof appRouter;
