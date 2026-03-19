import { GuidanceChunk, RawGuidanceDocument } from "@/lib/rag/types";
import { splitIntoParagraphs, uniqueTokens } from "@/lib/rag/textProcessing";

const DEFAULT_MAX_CHARS = 700;
const DEFAULT_OVERLAP_PARAGRAPHS = 1;

function splitLongParagraph(paragraph: string, maxChars: number) {
  if (paragraph.length <= maxChars) {
    return [paragraph];
  }

  const sentences = paragraph.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;

    if (candidate.length > maxChars && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      continue;
    }

    currentChunk = candidate;
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function createChunkParagraphs(content: string, maxChars = DEFAULT_MAX_CHARS) {
  const paragraphs = splitIntoParagraphs(content).flatMap((paragraph) =>
    splitLongParagraph(paragraph, maxChars),
  );
  const chunks: string[] = [];
  let currentParagraphs: string[] = [];

  for (const paragraph of paragraphs) {
    const nextChunk = [...currentParagraphs, paragraph].join("\n\n");

    if (nextChunk.length > maxChars && currentParagraphs.length > 0) {
      chunks.push(currentParagraphs.join("\n\n"));
      currentParagraphs = currentParagraphs.slice(-DEFAULT_OVERLAP_PARAGRAPHS);
    }

    currentParagraphs.push(paragraph);
  }

  if (currentParagraphs.length > 0) {
    chunks.push(currentParagraphs.join("\n\n"));
  }

  return chunks.filter(Boolean);
}

export function chunkGuidanceDocuments(documents: RawGuidanceDocument[]) {
  const chunks: GuidanceChunk[] = [];

  for (const document of documents) {
    const documentChunks = createChunkParagraphs(document.content);

    documentChunks.forEach((text, chunkIndex) => {
      const tokens = uniqueTokens(
        [text, document.metadata.title, document.metadata.topic, document.metadata.tags.join(" ")].join(
          " ",
        ),
      );

      chunks.push({
        chunkId: `${document.metadata.id}::${chunkIndex}`,
        documentId: document.metadata.id,
        chunkIndex,
        text,
        tokenCount: tokens.length,
        charCount: text.length,
        searchableText: [
          document.metadata.title,
          document.metadata.topic,
          document.metadata.jurisdiction,
          document.metadata.tags.join(" "),
          text,
        ].join("\n"),
        citation: {
          documentId: document.metadata.id,
          title: document.metadata.title,
          sourceUrl: document.metadata.sourceUrl,
          sourceType: document.metadata.sourceType,
          jurisdiction: document.metadata.jurisdiction,
          topic: document.metadata.topic,
          publicationDate: document.metadata.publicationDate,
          sourcePath: document.sourcePath,
          chunkIndex,
        },
        tags: document.metadata.tags,
        embedding: null,
      });
    });
  }

  return chunks;
}
