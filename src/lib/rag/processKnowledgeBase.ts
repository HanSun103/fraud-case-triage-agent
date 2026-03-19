import "server-only";

import { promises as fs } from "fs";

import { chunkGuidanceDocuments } from "@/lib/rag/chunkGuidanceDocuments";
import {
  knowledgeProcessedDir,
  knowledgeStorePath,
} from "@/lib/rag/knowledgePaths";
import { loadRawGuidanceDocuments, listRawGuidanceFiles } from "@/lib/rag/loadRawGuidanceDocuments";
import { knowledgeStoreSchema } from "@/lib/rag/schemas";
import { KnowledgeStore } from "@/lib/rag/types";

async function getLatestMtimeMs(paths: string[]) {
  const stats = await Promise.all(paths.map((filePath) => fs.stat(filePath)));
  return Math.max(...stats.map((stat) => stat.mtimeMs), 0);
}

async function shouldRebuildKnowledgeStore() {
  try {
    const [rawFiles, processedStats] = await Promise.all([
      listRawGuidanceFiles(),
      fs.stat(knowledgeStorePath),
    ]);

    const rawMtime = await getLatestMtimeMs(rawFiles);
    return rawMtime > processedStats.mtimeMs;
  } catch {
    return true;
  }
}

export async function buildKnowledgeStore() {
  const rawDocuments = await loadRawGuidanceDocuments();
  const chunks = chunkGuidanceDocuments(rawDocuments);

  const store: KnowledgeStore = {
    version: "1",
    generatedAt: new Date().toISOString(),
    embeddingProvider: null,
    documents: rawDocuments.map((document) => document.metadata),
    chunks,
  };

  await fs.mkdir(knowledgeProcessedDir, { recursive: true });
  await fs.writeFile(knowledgeStorePath, JSON.stringify(store, null, 2), "utf8");

  return store;
}

export async function loadKnowledgeStore(options?: { forceRebuild?: boolean }) {
  const needsRebuild = options?.forceRebuild || (await shouldRebuildKnowledgeStore());

  if (needsRebuild) {
    return buildKnowledgeStore();
  }

  const existingStore = await fs.readFile(knowledgeStorePath, "utf8");
  return knowledgeStoreSchema.parse(JSON.parse(existingStore));
}
