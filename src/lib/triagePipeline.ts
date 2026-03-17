import { AlertIntakeAgent } from "@/lib/agents/AlertIntakeAgent";
import { CaseSummaryGenerator } from "@/lib/agents/CaseSummaryGenerator";
import { RiskAssessmentAgent } from "@/lib/agents/RiskAssessmentAgent";
import { RiskSignalDetectionAgent } from "@/lib/agents/RiskSignalDetectionAgent";
import { FraudAlertInput, TriageResult } from "@/types/fraud";

const limitations = [
  "False positives can happen when important context is missing.",
  "Travel notifications and other customer context may be incomplete.",
  "Rules are simplified for transparency and demo value.",
  "This POC is not suitable for production use without stronger controls and real data pipelines.",
];

// This pipeline stitches the four demo agents together into one API-friendly workflow.
export async function runFraudTriage(alertInput: FraudAlertInput): Promise<TriageResult> {
  const structuredAlert = AlertIntakeAgent(alertInput);
  const signalDetection = RiskSignalDetectionAgent(structuredAlert);
  const riskAssessment = RiskAssessmentAgent({
    structuredAlert,
    signals: signalDetection.signals,
    mitigatingFactors: signalDetection.mitigatingFactors,
  });

  const partialResult = {
    structuredAlert,
    detectedSignals: signalDetection.signals,
    riskAssessment,
    whyFlagged: signalDetection.whyFlagged,
    mitigatingFactors: signalDetection.mitigatingFactors,
    limitations,
  };

  const caseSummary = await CaseSummaryGenerator(partialResult);

  return {
    ...partialResult,
    caseSummary,
  };
}
