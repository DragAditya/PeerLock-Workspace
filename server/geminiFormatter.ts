const MAX_DOCUMENT_LENGTH = 16_000;

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

export function extractGeminiMarkdown(payload: GeminiResponse) {
  const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("\n").trim() ?? "";
  if (!text) throw new Error(payload.error?.message || "Gemini returned no formatted document.");
  try {
    const parsed = JSON.parse(text) as { markdown?: unknown };
    if (typeof parsed.markdown === "string" && parsed.markdown.trim()) return parsed.markdown.trim();
  } catch {
    // The response is allowed to be raw Markdown as a fallback.
  }
  return text.replace(/^```(?:markdown|md)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export async function formatDocumentWithGemini(documentText: string, instruction: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini AI formatting is not configured.");
  if (!documentText.trim()) throw new Error("Add some document content before requesting AI formatting.");
  if (documentText.length > MAX_DOCUMENT_LENGTH) throw new Error("For AI formatting, select or format a document under 16,000 characters.");

  const prompt = `You are a meticulous technical editor. Reformat the supplied document into clean Markdown without adding facts, removing meaningful information, changing code semantics, or inventing citations. Preserve the writer's language. Use concise headings, lists, blockquotes and fenced code blocks only where appropriate. Return JSON only in this exact shape: {"markdown":"..."}.\n\nFormatting preference: ${instruction || "Make the structure clear and professional."}\n\nDocument:\n${documentText}`;
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.15, responseMimeType: "application/json" } }),
    signal: AbortSignal.timeout(35_000),
  });
  const payload = await response.json() as GeminiResponse;
  if (!response.ok) throw new Error(payload.error?.message || "Gemini formatting request failed.");
  return extractGeminiMarkdown(payload);
}
