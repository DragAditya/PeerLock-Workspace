import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { and, eq, gt, isNull } from "drizzle-orm";
import { parse as parseCookie } from "cookie";
import { peerlockAccounts, peerlockAccountSessions, peerlockAccountTokens } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { getDb } from "./db";

export const ACCOUNT_SESSION_COOKIE = "peerlock_account_session";
const SESSION_MS = 1000 * 60 * 60 * 24 * 30;
const VERIFY_MS = 1000 * 60 * 60 * 24;
const RESET_MS = 1000 * 60 * 30;
const recoveryAttempts = new Map<string, number[]>();

export type AccountIdentity = { id: string; email: string; username: string; emailVerifiedAt: Date | null };

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function normalizeUsername(username: string) { return username.trim().replace(/\s+/g, " "); }
function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function randomToken() { return randomBytes(32).toString("base64url"); }
function passwordRecord(password: string) { const salt = randomBytes(16).toString("hex"); return { salt, hash: scryptSync(password, salt, 64).toString("hex") }; }
function verifyPassword(password: string, salt: string, expectedHash: string) { const actual = scryptSync(password, salt, 64); const expected = Buffer.from(expectedHash, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); }

export function validatePassword(password: string) {
  if (password.length < 10 || password.length > 128) return "Use 10–128 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return "Use uppercase, lowercase, and a number.";
  return null;
}

function accountView(account: typeof peerlockAccounts.$inferSelect): AccountIdentity {
  return { id: account.id, email: account.email, username: account.username, emailVerifiedAt: account.emailVerifiedAt };
}

function requestOrigin(req: Request) {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" ? forwardedProto.split(",")[0].trim() : req.protocol;
  const host = req.get("host");
  if (!host) throw new Error("Unable to determine application URL for account email.");
  return `${protocol}://${host}`;
}

async function sendAccountEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) { console.warn("[Account] Email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL."); return false; }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
  });
  if (!response.ok) { console.error("[Account] Email delivery failed", response.status); return false; }
  return true;
}

function allowRecovery(key: string) {
  const cutoff = Date.now() - 15 * 60 * 1000;
  const current = (recoveryAttempts.get(key) ?? []).filter(time => time > cutoff);
  if (current.length >= 4) return false;
  current.push(Date.now()); recoveryAttempts.set(key, current); return true;
}

async function createSession(accountId: string) {
  const db = await getDb(); if (!db) throw new Error("Accounts are temporarily unavailable.");
  const rawToken = randomToken();
  await db.insert(peerlockAccountSessions).values({ id: randomUUID(), accountId, tokenHash: hash(rawToken), expiresAt: new Date(Date.now() + SESSION_MS) });
  return rawToken;
}

function setAccountSession(res: Response, req: Request, token: string) {
  res.cookie(ACCOUNT_SESSION_COOKIE, token, { ...getSessionCookieOptions(req), maxAge: SESSION_MS });
}

export function clearAccountSession(res: Response, req: Request) {
  res.clearCookie(ACCOUNT_SESSION_COOKIE, { ...getSessionCookieOptions(req), maxAge: -1 });
}

async function issueToken(accountId: string, purpose: "verify_email" | "reset_password") {
  const db = await getDb(); if (!db) throw new Error("Accounts are temporarily unavailable.");
  const rawToken = randomToken();
  const expiresAt = new Date(Date.now() + (purpose === "verify_email" ? VERIFY_MS : RESET_MS));
  await db.delete(peerlockAccountTokens).where(and(eq(peerlockAccountTokens.accountId, accountId), eq(peerlockAccountTokens.purpose, purpose), isNull(peerlockAccountTokens.consumedAt)));
  await db.insert(peerlockAccountTokens).values({ id: randomUUID(), accountId, purpose, tokenHash: hash(rawToken), expiresAt });
  return rawToken;
}

async function sendVerification(account: typeof peerlockAccounts.$inferSelect, req: Request) {
  const token = await issueToken(account.id, "verify_email");
  const link = `${requestOrigin(req)}/account/verify?token=${encodeURIComponent(token)}`;
  return sendAccountEmail({ to: account.email, subject: "Verify your Peerlock email", html: `<p>Hello ${escapeHtml(account.username)},</p><p>Verify your email to secure your Peerlock account:</p><p><a href="${link}">Verify email</a></p><p>This link expires in 24 hours.</p>` });
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char); }

export async function registerAccount(req: Request, res: Response, input: { email: string; username: string; password: string }) {
  const email = normalizeEmail(input.email); const username = normalizeUsername(input.username); const policyError = validatePassword(input.password);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]{1,47}$/.test(username)) throw new Error("Use 2–48 letters, numbers, spaces, dots, hyphens, or underscores for your username.");
  if (policyError) throw new Error(policyError);
  const db = await getDb(); if (!db) throw new Error("Accounts are temporarily unavailable.");
  const existing = await db.select({ id: peerlockAccounts.id }).from(peerlockAccounts).where(eq(peerlockAccounts.email, email)).limit(1);
  if (existing[0]) throw new Error("An account already uses this email. Sign in or reset your password.");
  const record = passwordRecord(input.password); const id = randomUUID();
  await db.insert(peerlockAccounts).values({ id, email, username, passwordSalt: record.salt, passwordHash: record.hash });
  const [account] = await db.select().from(peerlockAccounts).where(eq(peerlockAccounts.id, id)).limit(1);
  if (!account) throw new Error("Could not create account.");
  const sessionToken = await createSession(id); setAccountSession(res, req, sessionToken);
  const verificationSent = await sendVerification(account, req);
  return { account: accountView(account), verificationSent };
}

export async function signInAccount(req: Request, res: Response, input: { email: string; password: string }) {
  const db = await getDb(); if (!db) throw new Error("Accounts are temporarily unavailable.");
  const email = normalizeEmail(input.email);
  const [account] = await db.select().from(peerlockAccounts).where(eq(peerlockAccounts.email, email)).limit(1);
  if (!account || !verifyPassword(input.password, account.passwordSalt, account.passwordHash)) throw new Error("Email or password is incorrect.");
  await db.update(peerlockAccounts).set({ lastSignedInAt: new Date() }).where(eq(peerlockAccounts.id, account.id));
  const sessionToken = await createSession(account.id); setAccountSession(res, req, sessionToken);
  return { account: accountView(account) };
}

export async function sendVerificationEmail(req: Request, accountId: string) {
  const db = await getDb(); if (!db) throw new Error("Accounts are temporarily unavailable.");
  const [account] = await db.select().from(peerlockAccounts).where(eq(peerlockAccounts.id, accountId)).limit(1);
  if (!account) throw new Error("Account was not found.");
  if (account.emailVerifiedAt) return { sent: false as const, alreadyVerified: true as const };
  const sent = await sendVerification(account, req);
  return { sent, alreadyVerified: false as const };
}

export async function resolveAccount(req: Request): Promise<AccountIdentity | null> {
  const rawToken = parseCookie(req.headers.cookie ?? "")[ACCOUNT_SESSION_COOKIE];
  if (!rawToken) return null;
  const db = await getDb(); if (!db) return null;
  const [session] = await db.select().from(peerlockAccountSessions).where(eq(peerlockAccountSessions.tokenHash, hash(rawToken))).limit(1);
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  const [account] = await db.select().from(peerlockAccounts).where(eq(peerlockAccounts.id, session.accountId)).limit(1);
  if (!account) return null;
  await db.update(peerlockAccountSessions).set({ lastSeenAt: new Date() }).where(eq(peerlockAccountSessions.id, session.id));
  return accountView(account);
}

export async function requestPasswordReset(req: Request, emailInput: string) {
  const key = `${req.ip}:${normalizeEmail(emailInput)}`;
  if (!allowRecovery(key)) return { accepted: true as const };
  const db = await getDb(); if (!db) return { accepted: true as const };
  const [account] = await db.select().from(peerlockAccounts).where(eq(peerlockAccounts.email, normalizeEmail(emailInput))).limit(1);
  if (!account) return { accepted: true as const };
  const token = await issueToken(account.id, "reset_password");
  const link = `${requestOrigin(req)}/account/reset?token=${encodeURIComponent(token)}`;
  await sendAccountEmail({ to: account.email, subject: "Reset your Peerlock password", html: `<p>Hello ${escapeHtml(account.username)},</p><p>Use this one-time link to reset your Peerlock password:</p><p><a href="${link}">Reset password</a></p><p>This link expires in 30 minutes.</p>` });
  return { accepted: true as const };
}

async function consumeToken(rawToken: string, purpose: "verify_email" | "reset_password") {
  const db = await getDb(); if (!db) throw new Error("Accounts are temporarily unavailable.");
  const [token] = await db.select().from(peerlockAccountTokens).where(and(eq(peerlockAccountTokens.tokenHash, hash(rawToken)), eq(peerlockAccountTokens.purpose, purpose), isNull(peerlockAccountTokens.consumedAt), gt(peerlockAccountTokens.expiresAt, new Date()))).limit(1);
  if (!token) throw new Error("This link is invalid or has expired.");
  await db.update(peerlockAccountTokens).set({ consumedAt: new Date() }).where(eq(peerlockAccountTokens.id, token.id));
  return token.accountId;
}

export async function verifyAccountEmail(rawToken: string) {
  const accountId = await consumeToken(rawToken, "verify_email"); const db = await getDb(); if (!db) throw new Error("Accounts are temporarily unavailable.");
  await db.update(peerlockAccounts).set({ emailVerifiedAt: new Date() }).where(eq(peerlockAccounts.id, accountId));
  return { verified: true as const };
}

export async function resetAccountPassword(req: Request, res: Response, input: { token: string; password: string }) {
  const policyError = validatePassword(input.password); if (policyError) throw new Error(policyError);
  const accountId = await consumeToken(input.token, "reset_password"); const db = await getDb(); if (!db) throw new Error("Accounts are temporarily unavailable.");
  const record = passwordRecord(input.password);
  await db.update(peerlockAccounts).set({ passwordSalt: record.salt, passwordHash: record.hash, lastSignedInAt: new Date() }).where(eq(peerlockAccounts.id, accountId));
  await db.delete(peerlockAccountSessions).where(eq(peerlockAccountSessions.accountId, accountId));
  const sessionToken = await createSession(accountId); setAccountSession(res, req, sessionToken);
  const [account] = await db.select().from(peerlockAccounts).where(eq(peerlockAccounts.id, accountId)).limit(1);
  if (!account) throw new Error("Account was not found.");
  return { account: accountView(account) };
}

export async function changeAccountPassword(req: Request, res: Response, accountId: string, input: { currentPassword: string; password: string }) {
  const policyError = validatePassword(input.password); if (policyError) throw new Error(policyError);
  const db = await getDb(); if (!db) throw new Error("Accounts are temporarily unavailable.");
  const [account] = await db.select().from(peerlockAccounts).where(eq(peerlockAccounts.id, accountId)).limit(1);
  if (!account || !verifyPassword(input.currentPassword, account.passwordSalt, account.passwordHash)) throw new Error("Your current password is incorrect.");
  const record = passwordRecord(input.password);
  await db.update(peerlockAccounts).set({ passwordSalt: record.salt, passwordHash: record.hash, lastSignedInAt: new Date() }).where(eq(peerlockAccounts.id, accountId));
  await db.delete(peerlockAccountSessions).where(eq(peerlockAccountSessions.accountId, accountId));
  const sessionToken = await createSession(accountId); setAccountSession(res, req, sessionToken);
  return { account: accountView(account) };
}
