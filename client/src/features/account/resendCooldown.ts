export function formatResendCooldown(seconds: number) { const safe = Math.max(0, Math.floor(seconds)); return `Resend in ${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`; }
