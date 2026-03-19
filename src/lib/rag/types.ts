import {
  FraudTriageRequest,
  GuidanceChunkCitation,
  GuidanceDocumentMetadata,
  RetrievedPassage,
  StructuredAlert,
} from "@/types/fraud";

export interface RawGuidanceDocument {
  metadata: GuidanceDocumentMetadata;
  content: string;
  sourcePath: string;
  fileFormat: "md" | "txt" | "json";
}

export interface GuidanceChunk {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  charCount: number;
  searchableText: string;
  citation: GuidanceChunkCitation;
  tags: string[];
  embedding: number[] | null;
}

export interface KnowledgeStore {
  version: string;
  generatedAt: string;
  embeddingProvider: string | null;
  documents: GuidanceDocumentMetadata[];
  chunks: GuidanceChunk[];
}

export interface RetrieveGuidanceOptions {
  topK?: number;
  forceRebuild?: boolean;
}

export type GuidanceAlertInput = StructuredAlert | FraudTriageRequest;
