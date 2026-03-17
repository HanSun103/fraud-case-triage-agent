import { TriageResult } from "@/types/fraud";
import { formatCurrency } from "@/lib/utils/fraudFormatting";
import { generateCaseSummaryWithOpenAI } from "@/lib/openai/generateCaseSummary";

function buildFallbackSummary(result: Omit<TriageResult, "caseSummary">) {
  const { structuredAlert, riskAssessment, detectedSignals, mitigatingFactors } = result;
  const primarySignals = detectedSignals.map((signal) => signal.title.toLowerCase()).join(", ");

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
  }`;
}

// Step 4 converts the structured output into investigator-friendly narrative text.
export async function CaseSummaryGenerator(
  triageResult: Omit<TriageResult, "caseSummary">,
) {
  try {
    const llmSummary = await generateCaseSummaryWithOpenAI(triageResult);
    return llmSummary ?? buildFallbackSummary(triageResult);
  } catch {
    return buildFallbackSummary(triageResult);
  }
}
