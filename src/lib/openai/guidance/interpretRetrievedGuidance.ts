import { z } from "zod";

import { requestStructuredOpenAIResponse } from "@/lib/openai/shared";
import { RetrievedPassage, StructuredAlert } from "@/types/fraud";

const guidanceInterpretationSchema = z.object({
  interpretations: z.array(
    z.object({
      chunkId: z.string(),
      interpretation: z.string().min(1),
    }),
  ),
});

export async function interpretRetrievedGuidanceWithOpenAI(params: {
  structuredAlert: StructuredAlert;
  passages: RetrievedPassage[];
}) {
  const extractMeaningfulString = (record: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(record)) {
      if (
        ["chunkId", "id", "passageId", "title", "topic"].includes(key) ||
        typeof value !== "string"
      ) {
        continue;
      }

      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }

    return null;
  };

  const normalizeInterpretations = (value: unknown) => {
    if (!Array.isArray(value)) {
      return value;
    }

    return value.map((item) => {
      if (!item || typeof item !== "object") {
        return item;
      }

      const record = item as Record<string, unknown>;
      const bestString = extractMeaningfulString(record);

      return {
        chunkId:
          typeof record.chunkId === "string"
            ? record.chunkId
            : typeof record.id === "string"
              ? record.id
              : typeof record.passageId === "string"
                ? record.passageId
                : record.chunkId,
        interpretation:
          typeof record.interpretation === "string"
            ? record.interpretation
            : typeof record.explanation === "string"
              ? record.explanation
              : typeof record.reason === "string"
                ? record.reason
                : typeof record.summary === "string"
                  ? record.summary
                  : bestString ??
                    "This retrieved passage appears relevant to the current alert context.",
      };
    });
  };

  return requestStructuredOpenAIResponse({
    systemPrompt: `You are a guidance interpretation agent for fraud analysts.

Given a structured alert and retrieved guidance passages, explain in 1 sentence per passage why each passage is relevant to this alert.
Do not restate the full passage. Focus on practical relevance for the analyst.`,
    userPayload: {
      structuredAlert: {
        caseId: params.structuredAlert.caseId,
        alertTrigger: params.structuredAlert.alertTrigger,
        merchantCategory: params.structuredAlert.merchantCategory,
        transactionAmount: params.structuredAlert.transactionAmount,
        transactionLocation: params.structuredAlert.transactionLocation,
        customerHomeCountry: params.structuredAlert.customerHomeCountry,
        knownDevice: params.structuredAlert.knownDevice,
        knownMerchant: params.structuredAlert.knownMerchant,
        travelNoticeOnFile: params.structuredAlert.travelNoticeOnFile,
      },
      passages: params.passages.map((passage) => ({
        chunkId: passage.chunkId,
        title: passage.citation.title,
        topic: passage.citation.topic,
        text: passage.text,
      })),
    },
    schema: guidanceInterpretationSchema,
    normalizeParsed: (parsed) => {
      if (Array.isArray(parsed)) {
        return { interpretations: parsed };
      }

      if (parsed && typeof parsed === "object") {
        const record = parsed as Record<string, unknown>;

        if (Array.isArray(record.interpretations)) {
          return { interpretations: normalizeInterpretations(record.interpretations) };
        }

        const firstArray = Object.values(record).find(Array.isArray);
        if (firstArray) {
          return { interpretations: normalizeInterpretations(firstArray) };
        }
      }

      return Array.isArray(parsed)
        ? { interpretations: normalizeInterpretations(parsed) }
        : parsed;
    },
  });
}
