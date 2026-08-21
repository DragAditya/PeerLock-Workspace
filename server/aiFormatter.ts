import { TRPCError } from "@trpc/server";

export type AiAction = "format_document" | "improve" | "summarize" | "expand" | "simplify" | "explain" | "format";
export type AiFormatRequest = { text: string; instruction?: string; action?: AiAction; consent: boolean; externalAiEnabled: boolean };

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
    const action = input.action ?? "format_document";
    const actionGuidance: Record<AiAction, string> = {
      format_document: "Format the existing technical document for clarity and professional structure. Preserve all facts, code, algorithms, imports, APIs, identifiers, URLs, and intended meaning. Detect programming languages from their syntax and keep code in correct fenced blocks with the appropriate language label. Do not add explanations, examples, conclusions, features, or new content. Return only the complete revised document.",
      improve: "Improve the selected wording for clarity, grammar, and professional technical tone while preserving its exact meaning. Return only the replacement text.",
      summarize: "Summarize the selected text accurately and concisely. Preserve technical facts, constraints, and important identifiers. Return only the replacement text.",
      expand: "Expand the selected text with useful, accurate detail that remains consistent with its existing claims. Do not invent facts, APIs, measurements, or citations. Return only the replacement text.",
      simplify: "Simplify the selected text for a clear student-friendly explanation without removing essential technical meaning. Return only the replacement text.",
      explain: "Explain the selected material clearly for an MCA student. If it is code, explain what the existing code does without modifying identifiers or inventing behavior. Return only the replacement text.",
      format: "Format the selected text only. Preserve every fact, identifier, code token, and meaning; improve structure, whitespace, Markdown, and code-block language labels where applicable. Return only the replacement text."
    };
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `You are a precise technical writing assistant. ${actionGuidance[action]}\n\nOptional author instruction: ${input.instruction?.trim() || "None."}\n\nSource text:\n${input.text}` }] }] }) });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const formatted = data.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("").trim();
    if (!formatted) throw new Error("Gemini returned no usable formatted text");
    return { formatted, action };
  } catch (error) { if (error instanceof TRPCError) throw error; throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Gemini formatting is temporarily unavailable. Your document remains local." }); }
  finally { clearTimeout(timeout); }
}
