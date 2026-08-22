/** Server-only super-admin identity. No password, session token, or document data is stored here. */
export function configuredSuperAdminEmail() { return process.env.PEERLOCK_SUPER_ADMIN_EMAIL?.trim().toLowerCase() ?? ""; }
export function isSuperAdminEmail(email: string | null | undefined) { const configured = configuredSuperAdminEmail(); return Boolean(configured && email && configured === email.trim().toLowerCase()); }
