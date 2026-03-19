import {
  DetectedSignal,
  RecommendedAction,
  RiskAssessment,
  RiskLevel,
  ScoreBreakdownItem,
  StructuredAlert,
} from "@/types/fraud";

function scoreSignals(signals: DetectedSignal[]) {
  return signals.reduce((total, signal) => {
    return total + (signal.severity === "strong" ? 3 : 1.5);
  }, 0);
}

function pickAction(riskLevel: RiskLevel): RecommendedAction {
  if (riskLevel === "High") {
    return "Escalate to Fraud Investigator";
  }

  if (riskLevel === "Medium") {
    return "Flag for Manual Review";
  }

  return "Close Alert";
}

// Step 3 converts detected signals into a demo-friendly risk level and next action.
export function RiskAssessmentAgent(params: {
  structuredAlert: StructuredAlert;
  signals: DetectedSignal[];
  mitigatingFactors: string[];
}): RiskAssessment {
  const scoreBreakdown: ScoreBreakdownItem[] = params.signals.map((signal) => ({
    id: signal.id,
    label: signal.title,
    delta: signal.severity === "strong" ? 3 : 1.5,
    explanation: signal.explanation,
    category: "signal",
  }));
  let score = scoreBreakdown.reduce((total, item) => total + item.delta, 0);

  const hasStrongLocationAndAmount =
    params.signals.some((signal) => signal.id === "unusual-location") &&
    params.signals.some(
      (signal) =>
        signal.id === "high-transaction-amount" ||
        signal.id === "elevated-transaction-amount",
    );

  const hasNewDeviceAndHighAmount =
    params.signals.some((signal) => signal.id === "new-device") &&
    params.signals.some((signal) => signal.id === "high-transaction-amount");

  if (hasStrongLocationAndAmount || hasNewDeviceAndHighAmount) {
    score += 2;
    scoreBreakdown.push({
      id: "high-risk-pattern-bonus",
      label: "High-risk pattern bonus",
      delta: 2,
      explanation:
        "Layered high-risk combinations increase concern when location, amount, and device signals appear together.",
      category: "combination",
    });
  }

  if (params.mitigatingFactors.length > 0) {
    score -= 1.5;
    scoreBreakdown.push({
      id: "mitigating-context",
      label: "Mitigating context",
      delta: -1.5,
      explanation: params.mitigatingFactors.join(" "),
      category: "mitigation",
    });
  }

  if (
    params.structuredAlert.knownDevice &&
    params.structuredAlert.knownMerchant &&
    params.signals.length <= 1
  ) {
    score -= 1;
    scoreBreakdown.push({
      id: "known-pattern-credit",
      label: "Known behavior credit",
      delta: -1,
      explanation:
        "Known device and usual merchant reduce concern when very few suspicious signals are present.",
      category: "mitigation",
    });
  }

  let riskLevel: RiskLevel = "Low";

  if (score >= 6) {
    riskLevel = "High";
  } else if (score >= 2.5) {
    riskLevel = "Medium";
  }

  const action = pickAction(riskLevel);

  const strongestSignals = params.signals
    .filter((signal) => signal.severity === "strong")
    .map((signal) => signal.title.toLowerCase());

  const reason =
    riskLevel === "High"
      ? `Multiple strong indicators were detected${
          strongestSignals.length ? `, including ${strongestSignals.join(" and ")}` : ""
        }.`
      : riskLevel === "Medium"
        ? `Some anomalies were identified, but the pattern is not conclusive without human review.`
        : `The activity mostly aligns with expected customer behavior and shows limited fraud indicators.`;

  return {
    riskLevel,
    recommendedAction: action,
    reason:
      params.mitigatingFactors.length > 0 && riskLevel !== "High"
        ? `${reason} Mitigating context was also identified.`
        : reason,
    score: Number(score.toFixed(1)),
    scoreBreakdown,
  };
}
