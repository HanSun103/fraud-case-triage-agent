import "server-only";

import path from "path";

export const knowledgeRootDir = path.join(process.cwd(), "data", "knowledge");
export const knowledgeRawDir = path.join(knowledgeRootDir, "raw");
export const knowledgeProcessedDir = path.join(knowledgeRootDir, "processed");
export const knowledgeStorePath = path.join(knowledgeProcessedDir, "guidance-store.json");
