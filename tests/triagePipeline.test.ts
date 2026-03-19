import { beforeEach, describe, expect, it } from "vitest";

import { runFraudTriage } from "@/lib/triagePipeline";
import { buildNoGuidanceCase, getCaseByScenario } from "./helpers";

describe("triage pipeline", () => {
  beforeEach(() => {
    process.env.TRIAGE_MODE = "LOCAL_RULES_ONLY";
    delete process.env.OPENAI_API_KEY;
  });

  it("runs end-to-end in demo mode for an obvious high-risk case", async () => {
    const demoCase = getCaseByScenario("Cross-border anomalies");
    const result = await runFraudTriage(demoCase.alert);

    expect(result.riskAssessment.riskLevel).toBe("High");
    expect(result.retrievedGuidance.length).toBeGreaterThan(0);
    expect(result.summarySource).toBe("template");
    expect(result.trace.events.map((event) => event.agentName)).toEqual([
      "AlertIntakeAgent",
      "SignalDetectionAgent",
      "RiskAssessmentAgent",
      "GuidanceRetrievalAgent",
      "InvestigatorRecommendationAgent",
      "NarrativeSummaryAgent",
    ]);
  });

  it("keeps a routine case low risk in demo mode", async () => {
    const demoCase = getCaseByScenario("Low-risk normal behavior");
    const result = await runFraudTriage(demoCase.alert);

    expect(result.riskAssessment.riskLevel).toBe("Low");
    expect(result.investigatorRecommendation.recommendedAction).toBe("Close Alert");
  });

  it("preserves mitigation context for a travel-notice case", async () => {
    const demoCase = getCaseByScenario("Travel-context mitigations");
    const result = await runFraudTriage(demoCase.alert);

    expect(result.mitigatingFactors.length).toBeGreaterThan(0);
    expect(result.trace.events.some((event) => event.agentName === "GuidanceRetrievalAgent")).toBe(
      true,
    );
  });

  it("captures a trace even when no guidance is found", async () => {
    const result = await runFraudTriage(buildNoGuidanceCase());
    const retrievalEvent = result.trace.events.find(
      (event) => event.agentName === "GuidanceRetrievalAgent",
    );

    expect(result.retrievedGuidance).toEqual([]);
    expect(retrievalEvent?.metadata?.passageCount).toBe(0);
    expect(result.trace.durationMs).toBeGreaterThanOrEqual(0);
  });
});
