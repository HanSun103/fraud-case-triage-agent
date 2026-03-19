import { z } from "zod";

export const guidanceSourceTypeSchema = z.enum([
  "official-guidance",
  "internal-policy",
  "manual-note",
  "reference-data",
  "demo-seed",
]);

export const guidanceDocumentMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceUrl: z.string().nullable(),
  sourceType: guidanceSourceTypeSchema,
  jurisdiction: z.string(),
  topic: z.string(),
  publicationDate: z.string(),
  tags: z.array(z.string()),
});

export const rawJsonGuidanceSectionSchema = z.object({
  heading: z.string().optional(),
  content: z.string(),
});

export const rawJsonGuidanceDocumentSchema = z
  .object({
    metadata: guidanceDocumentMetadataSchema,
    content: z.string().optional(),
    sections: z.array(rawJsonGuidanceSectionSchema).optional(),
  })
  .refine((value) => Boolean(value.content || value.sections?.length), {
    message: "JSON guidance documents must include content or sections.",
  });

export const guidanceChunkCitationSchema = z.object({
  documentId: z.string(),
  title: z.string(),
  sourceUrl: z.string().nullable(),
  sourceType: guidanceSourceTypeSchema,
  jurisdiction: z.string(),
  topic: z.string(),
  publicationDate: z.string(),
  sourcePath: z.string(),
  chunkIndex: z.number().int().min(0),
});

export const guidanceChunkSchema = z.object({
  chunkId: z.string(),
  documentId: z.string(),
  chunkIndex: z.number().int().min(0),
  text: z.string(),
  tokenCount: z.number().int().min(0),
  charCount: z.number().int().min(0),
  searchableText: z.string(),
  citation: guidanceChunkCitationSchema,
  tags: z.array(z.string()),
  embedding: z.array(z.number()).nullable(),
});

export const knowledgeStoreSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  embeddingProvider: z.string().nullable(),
  documents: z.array(guidanceDocumentMetadataSchema),
  chunks: z.array(guidanceChunkSchema),
});
