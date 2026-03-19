import {
  DetectedSignal,
  InvestigatorRecommendation,
  RetrievedPassage,
  RiskAssessment,
  StructuredAlert,
} from "@/types/fraud";

export function InvestigatorRecommendationAgent(params: {
  structuredAlert: StructuredAlert;
  detectedSignals: DetectedSignal[];
  riskAssessment: RiskAssessment;
  mitigatingFactors: string[];
  retrievedGuidance: RetrievedPassage[];
}): InvestigatorRecommendation {
  const topGuidance = params.retrievedGuidance[0];
  const signalSummary =
    params.detectedSignals.length > 0
      ? params.detectedSignals
          .slice(0, 2)
          .map((signal) => signal.title.toLowerCase())
          .join(" and ")
      : "limited suspicious indicators";
  const guidanceSummary = topGuidance
    ? ` Guidance support came from ${topGuidance.citation.title}.`
    : "";
  const mitigationSummary = params.mitigatingFactors.length
    ? ` Mitigating context: ${params.mitigatingFactors[0]}`
    : "";

  return {
    caseId: params.structuredAlert.caseId,
    recommendedAction: params.riskAssessment.recommendedAction,
    rationale: `The case was classified as ${params.riskAssessment.riskLevel} risk based on ${signalSummary}.${guidanceSummary}${mitigationSummary}`.trim(),
    status:
      params.riskAssessment.recommendedAction === "Escalate to Fraud Investigator"
        ? "Escalated"
        : params.riskAssessment.recommendedAction === "Flag for Manual Review"
          ? "Pending Review"
          : "Closed",
    generatedBy: "rules",
  };
}
