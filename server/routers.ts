import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { formatWithGemini } from "./aiFormatter";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(options => options.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  ai: router({
    format: publicProcedure.input(z.object({ text: z.string(), instruction: z.string().min(1).max(240), consent: z.literal(true), externalAiEnabled: z.boolean() })).mutation(({ input }) => formatWithGemini(input)),
  }),
});

export type AppRouter = typeof appRouter;
