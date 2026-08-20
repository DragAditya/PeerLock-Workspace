export function organizeTechnicalText(input: string) {
  return input.split("\n").map(line => {
    const value = line.trimEnd();
    if (/^#{1,6}\s+/.test(value) || /^[-*+]\s+/.test(value) || /^\d+\.\s+/.test(value) || /^>\s?/.test(value) || /^```/.test(value) || /^---$/.test(value)) return value;
    if (/^[A-Z][A-Z\s]{4,}$/.test(value)) return `# ${value.replace(/\s+/g, " ")}`;
    return value;
  }).join("\n").replace(/\n{4,}/g, "\n\n\n");
}
