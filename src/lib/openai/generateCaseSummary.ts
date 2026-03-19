import { requestStructuredOpenAIResponse } from "@/lib/openai/shared";
import { TriageResult } from "@/types/fraud";
import { z } from "zod";

const summaryResponseSchema = z.object({
  summary: z.string().min(1),
});

export async function generateCaseSummaryWithOpenAI(
  triageResult: Omit<TriageResult, "caseSummary" | "summarySource" | "trace">,
) {
  const response = await requestStructuredOpenAIResponse({
    systemPrompt:
      "You write concise fraud investigation summaries for human investigators. Keep it to 3-4 sentences, mention the main signals, the risk level, the recommended action, and note if context suggests a possible false positive.",
    userPayload: {
      structuredAlert: {
        customerName: triageResult.structuredAlert.customerName,
        transactionAmount: triageResult.structuredAlert.transactionAmount,
        merchant: triageResult.structuredAlert.merchant,
        transactionLocation: triageResult.structuredAlert.transactionLocation,
        alertTrigger: triageResult.structuredAlert.alertTrigger,
      },
      detectedSignals: triageResult.detectedSignals,
      riskAssessment: triageResult.riskAssessment,
      mitigatingFactors: triageResult.mitigatingFactors,
      investigatorRecommendation: triageResult.investigatorRecommendation,
      retrievedGuidance: triageResult.retrievedGuidance.map((passage) => ({
        title: passage.citation.title,
        topic: passage.citation.topic,
        interpretation: passage.interpretation,
        excerpt: passage.text.slice(0, 320),
      })),
    },
    schema: summaryResponseSchema,
  });

  if (!response) {
    return null;
  }

  return {
    summary: response.data.summary.trim(),
    model: response.model,
    requestId: response.requestId,
  };
}
