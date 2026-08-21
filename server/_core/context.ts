import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { resolveAccount, type AccountIdentity } from "../accountAuth";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  account: AccountIdentity | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let account: AccountIdentity | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  try {
    account = await resolveAccount(opts.req);
  } catch (error) {
    console.warn("[Account] Could not resolve account session", error);
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    account,
  };
}
