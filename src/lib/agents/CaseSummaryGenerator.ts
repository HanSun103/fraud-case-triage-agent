import { generateCaseSummaryWithOpenAI } from "@/lib/openai/generateCaseSummary";
import { getTriageMode } from "@/lib/openai/triageMode";
import { formatCurrency } from "@/lib/utils/fraudFormatting";
import { TriageResult } from "@/types/fraud";

function buildFallbackSummary(
  result: Omit<TriageResult, "caseSummary" | "summarySource" | "trace">,
) {
  const {
    structuredAlert,
    riskAssessment,
    detectedSignals,
    mitigatingFactors,
    retrievedGuidance,
  } = result;
  const primarySignals = detectedSignals.map((signal) => signal.title.toLowerCase()).join(", ");
  const guidanceSummary = retrievedGuidance[0]
    ? ` Relevant guidance was retrieved from ${retrievedGuidance[0].citation.title}.`
    : "";

  return `${structuredAlert.customerName}'s ${formatCurrency(
    structuredAlert.transactionAmount,
  )} transaction at ${structuredAlert.merchant} in ${
    structuredAlert.transactionLocation
  } was flagged due to ${primarySignals || "alert rule activity"}. The case is assessed as ${
    riskAssessment.riskLevel
  } risk with a recommended action of ${
    riskAssessment.recommendedAction
  }. ${
    mitigatingFactors.length
      ? "Context suggests a potential false positive that should still be verified by an investigator."
      : "The decision is based on visible rule-based anomalies compared with recent account behavior."
  }${guidanceSummary}`;
}

// Step 5 converts the structured output into investigator-friendly narrative text.
export async function CaseSummaryGenerator(
  triageResult: Omit<TriageResult, "caseSummary" | "summarySource" | "trace">,
) {
  if (getTriageMode() !== "HYBRID_OPENAI") {
    return {
      summary: buildFallbackSummary(triageResult),
      source: "template" as const,
      model: null,
      requestId: null,
      fallbackReason: "MODE_LOCAL_ONLY",
    };
  }

  try {
    const llmSummary = await generateCaseSummaryWithOpenAI(triageResult);

    return llmSummary
      ? {
          summary: llmSummary.summary,
          source: "openai" as const,
          model: llmSummary.model,
          requestId: llmSummary.requestId,
          fallbackReason: null,
        }
      : {
          summary: buildFallbackSummary(triageResult),
          source: "template" as const,
          model: null,
          requestId: null,
          fallbackReason: "OPENAI_NOT_CONFIGURED",
        };
  } catch {
    return {
      summary: buildFallbackSummary(triageResult),
      source: "template" as const,
      model: null,
      requestId: null,
      fallbackReason: "OPENAI_REQUEST_FAILED",
    };
  }
}
