import { z } from "zod";

import { requestStructuredOpenAIResponse } from "@/lib/openai/shared";
import { investigatorRecommendationSchema } from "@/lib/validation/fraudSchemas";
import {
  DetectedSignal,
  RetrievedPassage,
  RiskAssessment,
  StructuredAlert,
} from "@/types/fraud";

const openAiRecommendationSchema = z.object({
  caseId: z.string().optional(),
  recommendedAction: z.enum([
    "Close Alert",
    "Flag for Manual Review",
    "Escalate to Fraud Investigator",
  ]),
  rationale: z.string().min(1),
  status: z.enum(["Open", "Pending Review", "Closed", "Escalated"]),
  generatedBy: z.enum(["rules", "openai", "fallback"]).optional(),
});

export async function generateRecommendationWithOpenAI(params: {
  structuredAlert: StructuredAlert;
  detectedSignals: DetectedSignal[];
  riskAssessment: RiskAssessment;
  mitigatingFactors: string[];
  retrievedGuidance: RetrievedPassage[];
}) {
  const response = await requestStructuredOpenAIResponse({
    systemPrompt: `You are an investigator recommendation agent. Recommend one of the supported actions and a short rationale.

Rules:
- Use the provided rule-based risk assessment as authoritative.
- Do not change the risk score or risk level.
- recommendedAction must be one of: Close Alert, Flag for Manual Review, Escalate to Fraud Investigator.
- status must be one of: Open, Pending Review, Closed, Escalated.
- generatedBy must be "openai".`,
    userPayload: {
      structuredAlert: {
        caseId: params.structuredAlert.caseId,
        customerName: params.structuredAlert.customerName,
        alertTrigger: params.structuredAlert.alertTrigger,
      },
      detectedSignals: params.detectedSignals,
      riskAssessment: {
        riskLevel: params.riskAssessment.riskLevel,
        score: params.riskAssessment.score,
        recommendedAction: params.riskAssessment.recommendedAction,
        reason: params.riskAssessment.reason,
      },
      mitigatingFactors: params.mitigatingFactors,
      guidance: params.retrievedGuidance.map((passage) => ({
        title: passage.citation.title,
        interpretation: passage.interpretation,
      })),
      localReference: {
        caseId: params.structuredAlert.caseId,
        recommendedAction: params.riskAssessment.recommendedAction,
        status:
          params.riskAssessment.recommendedAction === "Escalate to Fraud Investigator"
            ? "Escalated"
            : params.riskAssessment.recommendedAction === "Flag for Manual Review"
              ? "Pending Review"
              : "Closed",
        generatedBy: "openai",
      },
    },
    schema: openAiRecommendationSchema,
  });

  if (!response) {
    return response;
  }

  return {
    ...response,
    data: investigatorRecommendationSchema.parse({
      ...response.data,
      caseId: response.data.caseId ?? params.structuredAlert.caseId,
      generatedBy: "openai",
    }),
  };
}
