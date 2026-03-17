export type RiskLevel = "Low" | "Medium" | "High";

export type RecommendedAction =
  | "Close Alert"
  | "Flag for Manual Review"
  | "Escalate to Fraud Investigator";

export type SignalSeverity = "moderate" | "strong";

export interface FraudAlertInput {
  customerName: string;
  accountAgeDays: number;
  homeLocation: string;
  transactionAmount: number;
  merchant: string;
  transactionLocation: string;
  transactionTime: string;
  recentTransactionCount: number;
  typicalTransactionAmount: number;
  alertTriggerReason: string;
  deviceStatus: "Known" | "New";
  merchantFamiliarity: "Usual" | "New";
  accountHistoryNotes: string;
}

export interface StructuredAlert {
  transactionAmount: number;
  merchant: string;
  transactionLocation: string;
  transactionTime: string;
  homeLocation: string;
  alertTrigger: string;
  deviceStatus: FraudAlertInput["deviceStatus"];
  merchantFamiliarity: FraudAlertInput["merchantFamiliarity"];
  recentTransactionCount: number;
  accountAgeDays: number;
  typicalTransactionAmount: number;
  accountHistory: string;
  customerName: string;
}

export interface DetectedSignal {
  id: string;
  title: string;
  explanation: string;
  severity: SignalSeverity;
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  recommendedAction: RecommendedAction;
  reason: string;
  score: number;
}

export interface TriageResult {
  structuredAlert: StructuredAlert;
  detectedSignals: DetectedSignal[];
  riskAssessment: RiskAssessment;
  caseSummary: string;
  whyFlagged: string[];
  mitigatingFactors: string[];
  limitations: string[];
}

export interface SampleCase {
  id: string;
  label: string;
  expectedOutcome: string;
  description: string;
  alert: FraudAlertInput;
}
