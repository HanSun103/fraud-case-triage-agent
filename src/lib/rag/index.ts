export { chunkGuidanceDocuments } from "@/lib/rag/chunkGuidanceDocuments";
export {
  buildKnowledgeStore,
  loadKnowledgeStore,
} from "@/lib/rag/processKnowledgeBase";
export { retrieveGuidanceForAlert } from "@/lib/rag/retrieveGuidance";
export type {
  GuidanceChunk,
  KnowledgeStore,
} from "@/lib/rag/types";
export type {
  GuidanceChunkCitation,
  GuidanceDocumentMetadata,
  RetrievedPassage,
} from "@/types/fraud";
