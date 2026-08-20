import { TRPCError } from "@trpc/server";

export type AiFormatRequest = { text: string; instruction: string; consent: boolean; externalAiEnabled: boolean };

export function validateAiFormatRequest(input: AiFormatRequest) {
  if (!input.externalAiEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "External AI is disabled for this sensitive document." });
  if (!input.consent) throw new TRPCError({ code: "BAD_REQUEST", message: "Explicit consent is required before text can be sent to Gemini." });
  if (!input.text.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Write something before requesting formatting." });
  if (input.text.length > 24000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Select a shorter document excerpt for AI formatting." });
}

export async function formatWithGemini(input: AiFormatRequest) {
  validateAiFormatRequest(input);
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Gemini formatting is not configured for this deployment." });
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 22000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `Format the following technical draft. Preserve its meaning. Use concise Markdown headings, lists, quotes, and fenced code blocks where appropriate. Return only the revised text.\n\nInstruction: ${input.instruction}\n\nDraft:\n${input.text}` }] }] }) });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const formatted = data.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("").trim();
    if (!formatted) throw new Error("Gemini returned no usable formatted text");
    return { formatted };
  } catch (error) { if (error instanceof TRPCError) throw error; throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Gemini formatting is temporarily unavailable. Your document remains local." }); }
  finally { clearTimeout(timeout); }
}
