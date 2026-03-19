import { describe, expect, it } from "vitest";

import { AlertIntakeAgent } from "@/lib/agents/AlertIntakeAgent";
import { RiskAssessmentAgent } from "@/lib/agents/RiskAssessmentAgent";
import { RiskSignalDetectionAgent } from "@/lib/agents/RiskSignalDetectionAgent";
import { getCaseByScenario, getCaseByTag } from "./helpers";

describe("risk logic", () => {
  it("classifies an obvious cross-border anomaly as high risk", () => {
    const demoCase = getCaseByScenario("Cross-border anomalies");
    const structuredAlert = AlertIntakeAgent(demoCase.alert);
    const signalDetection = RiskSignalDetectionAgent(structuredAlert);
    const riskAssessment = RiskAssessmentAgent({
      structuredAlert,
      signals: signalDetection.signals,
      mitigatingFactors: signalDetection.mitigatingFactors,
    });

    expect(signalDetection.signals.some((signal) => signal.id === "unusual-location")).toBe(true);
    expect(riskAssessment.riskLevel).toBe("High");
    expect(riskAssessment.score).toBeGreaterThanOrEqual(6);
  });

  it("keeps routine domestic behavior at low risk", () => {
    const demoCase = getCaseByScenario("Low-risk normal behavior");
    const structuredAlert = AlertIntakeAgent(demoCase.alert);
    const signalDetection = RiskSignalDetectionAgent(structuredAlert);
    const riskAssessment = RiskAssessmentAgent({
      structuredAlert,
      signals: signalDetection.signals,
      mitigatingFactors: signalDetection.mitigatingFactors,
    });

    expect(riskAssessment.riskLevel).toBe("Low");
    expect(riskAssessment.recommendedAction).toBe("Close Alert");
  });

  it("detects travel notice mitigation", () => {
    const demoCase = getCaseByScenario("Travel-context mitigations");
    const structuredAlert = AlertIntakeAgent(demoCase.alert);
    const signalDetection = RiskSignalDetectionAgent(structuredAlert);
    const riskAssessment = RiskAssessmentAgent({
      structuredAlert,
      signals: signalDetection.signals,
      mitigatingFactors: signalDetection.mitigatingFactors,
    });

    expect(signalDetection.mitigatingFactors.length).toBeGreaterThan(0);
    expect(riskAssessment.riskLevel).not.toBe("High");
  });

  it("flags a new-device and velocity pattern aggressively", () => {
    const demoCase = getCaseByTag("velocity");
    const structuredAlert = AlertIntakeAgent(demoCase.alert);
    const signalDetection = RiskSignalDetectionAgent(structuredAlert);
    const riskAssessment = RiskAssessmentAgent({
      structuredAlert,
      signals: signalDetection.signals,
      mitigatingFactors: signalDetection.mitigatingFactors,
    });

    expect(signalDetection.signals.some((signal) => signal.id === "rapid-transaction-activity")).toBe(
      true,
    );
    expect(signalDetection.signals.some((signal) => signal.id === "new-device")).toBe(true);
    expect(riskAssessment.score).toBeGreaterThan(4);
  });
});
