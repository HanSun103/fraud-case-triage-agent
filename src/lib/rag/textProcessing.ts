export function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitIntoParagraphs(value: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function tokenizeText(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

export function uniqueTokens(value: string) {
  return [...new Set(tokenizeText(value))];
}
