import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertIntakeAgent } from "@/lib/agents/AlertIntakeAgent";
import { RiskSignalDetectionAgent } from "@/lib/agents/RiskSignalDetectionAgent";
import { runFraudTriage } from "@/lib/triagePipeline";
import { getCaseByScenario } from "./helpers";

const {
  generateStructuredAlertWithOpenAIMock,
  generateSignalDetectionWithOpenAIMock,
  interpretRetrievedGuidanceWithOpenAIMock,
  generateRecommendationWithOpenAIMock,
  generateCaseSummaryWithOpenAIMock,
} = vi.hoisted(() => ({
  generateStructuredAlertWithOpenAIMock: vi.fn(),
  generateSignalDetectionWithOpenAIMock: vi.fn(),
  interpretRetrievedGuidanceWithOpenAIMock: vi.fn(),
  generateRecommendationWithOpenAIMock: vi.fn(),
  generateCaseSummaryWithOpenAIMock: vi.fn(),
}));

vi.mock("@/lib/openai/intake/generateStructuredAlert", () => ({
  generateStructuredAlertWithOpenAI: generateStructuredAlertWithOpenAIMock,
}));

vi.mock("@/lib/openai/signals/generateSignalDetection", () => ({
  generateSignalDetectionWithOpenAI: generateSignalDetectionWithOpenAIMock,
}));

vi.mock("@/lib/openai/guidance/interpretRetrievedGuidance", () => ({
  interpretRetrievedGuidanceWithOpenAI: interpretRetrievedGuidanceWithOpenAIMock,
}));

vi.mock("@/lib/openai/recommendation/generateRecommendation", () => ({
  generateRecommendationWithOpenAI: generateRecommendationWithOpenAIMock,
}));

vi.mock("@/lib/openai/generateCaseSummary", () => ({
  generateCaseSummaryWithOpenAI: generateCaseSummaryWithOpenAIMock,
}));

describe("hybrid OpenAI mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TRIAGE_MODE = "HYBRID_OPENAI";
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-4.1-mini";
    process.env.OPENAI_AGENT_MODEL = "gpt-4.1-mini";
  });

  it("uses OpenAI-backed agents and records provider metadata", async () => {
    const demoCase = getCaseByScenario("Cross-border anomalies");
    const localStructuredAlert = AlertIntakeAgent(demoCase.alert);
    const localSignalDetection = RiskSignalDetectionAgent(localStructuredAlert);

    generateStructuredAlertWithOpenAIMock.mockResolvedValue({
      data: localStructuredAlert,
      model: "gpt-4.1-mini",
      requestId: "resp-intake",
    });
    generateSignalDetectionWithOpenAIMock.mockResolvedValue({
      data: localSignalDetection,
      model: "gpt-4.1-mini",
      requestId: "resp-signals",
    });
    interpretRetrievedGuidanceWithOpenAIMock.mockImplementation(async ({ passages }) => ({
      data: {
        interpretations: passages.map((passage: { chunkId: string }) => ({
          chunkId: passage.chunkId,
          interpretation: "This guidance supports the analyst's review path.",
        })),
      },
      model: "gpt-4.1-mini",
      requestId: "resp-guidance",
    }));
    generateRecommendationWithOpenAIMock.mockImplementation(async ({ structuredAlert, riskAssessment }) => ({
      data: {
        caseId: structuredAlert.caseId,
        recommendedAction: riskAssessment.recommendedAction,
        rationale: "OpenAI recommendation aligned with the rule-based decision.",
        status: "Escalated",
        generatedBy: "openai",
      },
      model: "gpt-4.1-mini",
      requestId: "resp-recommendation",
    }));
    generateCaseSummaryWithOpenAIMock.mockResolvedValue({
      summary: "OpenAI-generated narrative summary.",
      model: "gpt-4.1-mini",
      requestId: "resp-summary",
    });

    const result = await runFraudTriage(demoCase.alert);

    expect(result.summarySource).toBe("openai");
    expect(result.investigatorRecommendation.generatedBy).toBe("openai");
    expect(result.retrievedGuidance.some((passage) => passage.interpretationSource === "openai")).toBe(
      true,
    );
    expect(result.trace.providerSummary.openAiAttemptCount).toBeGreaterThan(0);
    expect(result.trace.events.find((event) => event.agentName === "AlertIntakeAgent")?.inference.provider).toBe(
      "openai",
    );
    expect(
      result.trace.events.find((event) => event.agentName === "InvestigatorRecommendationAgent")
        ?.inference.provider,
    ).toBe("openai");
  });

  it("falls back to local recommendation when OpenAI conflicts with rule output", async () => {
    const demoCase = getCaseByScenario("Cross-border anomalies");
    const localStructuredAlert = AlertIntakeAgent(demoCase.alert);
    const localSignalDetection = RiskSignalDetectionAgent(localStructuredAlert);

    generateStructuredAlertWithOpenAIMock.mockResolvedValue({
      data: localStructuredAlert,
      model: "gpt-4.1-mini",
      requestId: "resp-intake",
    });
    generateSignalDetectionWithOpenAIMock.mockResolvedValue({
      data: localSignalDetection,
      model: "gpt-4.1-mini",
      requestId: "resp-signals",
    });
    interpretRetrievedGuidanceWithOpenAIMock.mockResolvedValue({
      data: { interpretations: [] },
      model: "gpt-4.1-mini",
      requestId: "resp-guidance",
    });
    generateRecommendationWithOpenAIMock.mockImplementation(async ({ structuredAlert }) => ({
      data: {
        caseId: structuredAlert.caseId,
        recommendedAction: "Close Alert",
        rationale: "Conflicting recommendation from OpenAI.",
        status: "Closed",
        generatedBy: "openai",
      },
      model: "gpt-4.1-mini",
      requestId: "resp-recommendation",
    }));
    generateCaseSummaryWithOpenAIMock.mockResolvedValue({
      summary: "OpenAI-generated narrative summary.",
      model: "gpt-4.1-mini",
      requestId: "resp-summary",
    });

    const result = await runFraudTriage(demoCase.alert);
    const recommendationEvent = result.trace.events.find(
      (event) => event.agentName === "InvestigatorRecommendationAgent",
    );

    expect(result.investigatorRecommendation.generatedBy).toBe("rules");
    expect(recommendationEvent?.status).toBe("fallback");
    expect(recommendationEvent?.inference.fallbackReason).toBe("VERIFICATION_FAILED");
    expect(recommendationEvent?.inference.attempted).toBe(true);
  });
});
