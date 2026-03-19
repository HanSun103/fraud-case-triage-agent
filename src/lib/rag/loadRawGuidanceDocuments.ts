import "server-only";

import { promises as fs } from "fs";
import path from "path";

import {
  guidanceDocumentMetadataSchema,
  rawJsonGuidanceDocumentSchema,
} from "@/lib/rag/schemas";
import { knowledgeRawDir } from "@/lib/rag/knowledgePaths";
import { RawGuidanceDocument } from "@/lib/rag/types";
import { normalizeText } from "@/lib/rag/textProcessing";

async function walkDirectory(targetDirectory: string): Promise<string[]> {
  const entries = await fs.readdir(targetDirectory, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(targetDirectory, entry.name);

      if (entry.isDirectory()) {
        return walkDirectory(entryPath);
      }

      return [entryPath];
    }),
  );

  return paths.flat();
}

function isSupportedKnowledgeFile(filePath: string) {
  return [".md", ".txt", ".json"].includes(path.extname(filePath).toLowerCase());
}

function isMetadataSidecar(filePath: string) {
  return filePath.toLowerCase().endsWith(".meta.json");
}

async function loadSidecarMetadata(filePath: string) {
  const sidecarPath = filePath.replace(/\.(md|txt)$/i, ".meta.json");
  const rawMetadata = await fs.readFile(sidecarPath, "utf8");

  return guidanceDocumentMetadataSchema.parse(JSON.parse(rawMetadata));
}

function buildJsonContent(sections: { heading?: string; content: string }[]) {
  return sections
    .map((section) =>
      section.heading ? `${section.heading}\n${section.content.trim()}` : section.content.trim(),
    )
    .join("\n\n");
}

function toRelativeKnowledgePath(filePath: string) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

async function loadMarkdownOrTextDocument(filePath: string): Promise<RawGuidanceDocument> {
  const fileFormat = path.extname(filePath).slice(1).toLowerCase() as "md" | "txt";
  const metadata = await loadSidecarMetadata(filePath);
  const content = normalizeText(await fs.readFile(filePath, "utf8"));

  return {
    metadata,
    content,
    sourcePath: toRelativeKnowledgePath(filePath),
    fileFormat,
  };
}

async function loadJsonDocument(filePath: string): Promise<RawGuidanceDocument> {
  const rawJson = JSON.parse(await fs.readFile(filePath, "utf8"));
  const parsed = rawJsonGuidanceDocumentSchema.parse(rawJson);

  return {
    metadata: parsed.metadata,
    content: normalizeText(parsed.content ?? buildJsonContent(parsed.sections ?? [])),
    sourcePath: toRelativeKnowledgePath(filePath),
    fileFormat: "json",
  };
}

export async function listRawGuidanceFiles() {
  const allFiles = await walkDirectory(knowledgeRawDir);

  return allFiles.filter(
    (filePath) => isSupportedKnowledgeFile(filePath) && !isMetadataSidecar(filePath),
  );
}

export async function loadRawGuidanceDocuments(): Promise<RawGuidanceDocument[]> {
  const files = await listRawGuidanceFiles();
  const documents = await Promise.all(
    files.map(async (filePath) => {
      const extension = path.extname(filePath).toLowerCase();

      if (extension === ".json") {
        return loadJsonDocument(filePath);
      }

      return loadMarkdownOrTextDocument(filePath);
    }),
  );

  return documents.filter((document) => document.content.length > 0);
}
