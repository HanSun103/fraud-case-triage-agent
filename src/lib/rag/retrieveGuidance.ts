import "server-only";

import { AlertIntakeAgent } from "@/lib/agents/AlertIntakeAgent";
import { loadKnowledgeStore } from "@/lib/rag/processKnowledgeBase";
import {
  GuidanceAlertInput,
  GuidanceChunk,
  RetrieveGuidanceOptions,
} from "@/lib/rag/types";
import { uniqueTokens } from "@/lib/rag/textProcessing";
import { RetrievedPassage, StructuredAlert } from "@/types/fraud";

const ignoredQueryTerms = new Set([
  "other",
  "demo",
  "rules",
  "engine",
  "mass",
  "retail",
  "customer",
]);

function isStructuredAlert(alert: GuidanceAlertInput): alert is StructuredAlert {
  return "alertTrigger" in alert && "transactionAmount" in alert;
}

function normalizeAlert(alert: GuidanceAlertInput) {
  return isStructuredAlert(alert) ? alert : AlertIntakeAgent(alert);
}

function buildAlertTerms(alert: StructuredAlert) {
  const queryPhrases = [
    alert.alertTrigger,
    alert.merchantCategory,
    alert.merchantCountry,
    alert.customerHomeCountry,
    alert.transactionLocation,
    alert.homeLocation,
    alert.channel,
    alert.customerSegment,
    alert.analystNotes,
  ];

  if (alert.merchantCountry !== alert.customerHomeCountry) {
    queryPhrases.push("cross border", "foreign transaction", "location mismatch");
  }

  if (alert.transactionAmount >= 2000 || alert.typicalTransactionAmount * 3 <= alert.transactionAmount) {
    queryPhrases.push("high amount", "unusual amount");
  }

  if (alert.prior24hTxnCount >= 4 || alert.prior30dTxnCount >= 6) {
    queryPhrases.push("velocity", "rapid transactions");
  }

  if (!alert.knownDevice) {
    queryPhrases.push("new device");
  }

  if (!alert.knownMerchant) {
    queryPhrases.push("new merchant");
  }

  if (alert.travelNoticeOnFile) {
    queryPhrases.push("travel notice", "travel context");
  }

  return [...new Set(queryPhrases.flatMap((phrase) => uniqueTokens(phrase)))].filter(
    (term) => !ignoredQueryTerms.has(term),
  );
}

function scoreChunk(chunk: GuidanceChunk, queryTerms: string[]) {
  const searchableTokens = new Set(uniqueTokens(chunk.searchableText));
  const matchedTerms = queryTerms.filter((term) => searchableTokens.has(term));
  const exactTagMatches = queryTerms.filter((term) =>
    chunk.tags.some((tag) => tag.toLowerCase().includes(term)),
  );
  const keywordScore = matchedTerms.length * 2 + exactTagMatches.length * 3;
  const similarityScore =
    queryTerms.length > 0 ? matchedTerms.length / Math.sqrt(queryTerms.length * searchableTokens.size) : 0;

  if (keywordScore > 0) {
    return {
      score: Number((keywordScore + similarityScore).toFixed(3)),
      retrievalMethod: "keyword" as const,
      matchedTerms,
    };
  }

  return {
    score: Number(similarityScore.toFixed(3)),
    retrievalMethod: "lightweight-similarity" as const,
    matchedTerms,
  };
}

export async function retrieveGuidanceForAlert(
  alert: GuidanceAlertInput,
  options?: RetrieveGuidanceOptions,
): Promise<RetrievedPassage[]> {
  const structuredAlert = normalizeAlert(alert);
  const queryTerms = buildAlertTerms(structuredAlert);
  const knowledgeStore = await loadKnowledgeStore({ forceRebuild: options?.forceRebuild });

  return [...knowledgeStore.chunks]
    .map((chunk) => {
      const result = scoreChunk(chunk, queryTerms);

      return {
        chunkId: chunk.chunkId,
        score: result.score,
        retrievalMethod: result.retrievalMethod,
        text: chunk.text,
        matchedTerms: result.matchedTerms,
        citation: chunk.citation,
        interpretation: null,
        interpretationSource: null,
      };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, options?.topK ?? 5);
}
