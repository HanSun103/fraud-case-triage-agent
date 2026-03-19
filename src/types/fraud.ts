export type RiskLevel = "Low" | "Medium" | "High";
export type TriageMode = "LOCAL_RULES_ONLY" | "HYBRID_OPENAI";

export type RecommendedAction =
  | "Close Alert"
  | "Flag for Manual Review"
  | "Escalate to Fraud Investigator";

export type SignalSeverity = "moderate" | "strong";

export type TransactionChannel =
  | "Card Present"
  | "Card Not Present"
  | "Online"
  | "Mobile"
  | "ATM"
  | "Wire"
  | "Other";

export type CustomerSegment =
  | "Mass Retail"
  | "Affluent"
  | "Student"
  | "Small Business"
  | "Traveling Customer"
  | "Other";

export type AlertSource =
  | "Rules Engine"
  | "Velocity Rule"
  | "Location Rule"
  | "Analyst Referral"
  | "Customer Report"
  | "Demo Scenario"
  | "Other";

export type DeviceStatus = "Known" | "New";

export type MerchantFamiliarity = "Usual" | "New";
export type GuidanceSourceType =
  | "official-guidance"
  | "internal-policy"
  | "manual-note"
  | "reference-data"
  | "demo-seed";
export type RetrievalMethod = "keyword" | "lightweight-similarity";
export type CaseDatasetSource = "sample" | "generated" | "imported";
export type AgentProvider = "local" | "openai";

export interface LegacyFraudAlertInput {
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
  deviceStatus: DeviceStatus;
  merchantFamiliarity: MerchantFamiliarity;
  accountHistoryNotes: string;
}

export type FraudAlertInput = LegacyFraudAlertInput;

export interface TransactionEvent {
  caseId: string;
  transactionId: string;
  eventTime: string;
  amount: number;
  currency: string;
  channel: TransactionChannel;
  merchantName: string;
  merchantCategory: string;
  merchantCountry: string;
  transactionLocation: string;
  prior30dTxnCount: number;
  prior24hTxnCount: number;
  typicalTransactionAmount: number;
}

export interface CustomerProfile {
  customerId: string;
  customerName: string;
  customerSegment: CustomerSegment;
  customerHomeCountry: string;
  homeLocation: string;
  accountAgeDays: number;
  priorChargebackCount: number;
  travelNoticeOnFile: boolean;
  accountHistoryNotes: string;
  analystNotes: string;
}

export interface DeviceContext {
  deviceId: string;
  knownDevice: boolean;
  deviceAgeDays: number;
}

export interface MerchantContext {
  merchantName: string;
  merchantCategory: string;
  merchantCountry: string;
  knownMerchant: boolean;
}

export interface GeolocationContext {
  transactionLocation: string;
  homeLocation: string;
  merchantCountry: string;
  customerHomeCountry: string;
}

export interface CaseAlert {
  caseId: string;
  alertSource: AlertSource;
  alertTriggerReason: string;
  analystNotes: string;
  customer: CustomerProfile;
  transaction: TransactionEvent;
  device: DeviceContext;
  merchant: MerchantContext;
  geolocation: GeolocationContext;
}

export interface StructuredAlert {
  caseId: string;
  transactionId: string;
  eventTime: string;
  transactionTime: string;
  amount: number;
  transactionAmount: number;
  currency: string;
  channel: TransactionChannel;
  merchant: string;
  merchantCategory: string;
  merchantCountry: string;
  transactionLocation: string;
  homeLocation: string;
  customerHomeCountry: string;
  alertTrigger: string;
  alertSource: AlertSource;
  knownDevice: boolean;
  deviceAgeDays: number;
  knownMerchant: boolean;
  prior30dTxnCount: number;
  prior24hTxnCount: number;
  recentTransactionCount: number;
  priorChargebackCount: number;
  accountAgeDays: number;
  typicalTransactionAmount: number;
  travelNoticeOnFile: boolean;
  customerSegment: CustomerSegment;
  accountHistory: string;
  analystNotes: string;
  customerName: string;
  deviceStatus: DeviceStatus;
  merchantFamiliarity: MerchantFamiliarity;
}

export interface DetectedSignal {
  id: string;
  title: string;
  explanation: string;
  severity: SignalSeverity;
}

export interface ScoreBreakdownItem {
  id: string;
  label: string;
  delta: number;
  explanation: string;
  category: "signal" | "combination" | "mitigation";
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  recommendedAction: RecommendedAction;
  reason: string;
  score: number;
  scoreBreakdown: ScoreBreakdownItem[];
}

export interface GuidanceDocumentMetadata {
  id: string;
  title: string;
  sourceUrl: string | null;
  sourceType: GuidanceSourceType;
  jurisdiction: string;
  topic: string;
  publicationDate: string;
  tags: string[];
}

export interface GuidanceChunkCitation {
  documentId: string;
  title: string;
  sourceUrl: string | null;
  sourceType: GuidanceSourceType;
  jurisdiction: string;
  topic: string;
  publicationDate: string;
  sourcePath: string;
  chunkIndex: number;
}

export interface RetrievedPassage {
  chunkId: string;
  score: number;
  retrievalMethod: RetrievalMethod;
  text: string;
  matchedTerms: string[];
  citation: GuidanceChunkCitation;
  interpretation: string | null;
  interpretationSource: AgentProvider | null;
}

export interface AgentInference {
  provider: AgentProvider;
  model: string | null;
  attempted: boolean;
  used: boolean;
  verifiedWithRules: boolean;
  verificationSummary: string | null;
  fallbackReason: string | null;
  requestId: string | null;
}

export interface RunProviderSummary {
  openAiConfigured: boolean;
  openAiAttemptCount: number;
  openAiSuccessCount: number;
  fallbackCount: number;
}

export interface AgentTraceEvent {
  runId: string;
  caseId: string;
  agentName: string;
  status: "completed" | "failed" | "fallback";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  inputSummary: string;
  outputSummary: string;
  inference: AgentInference;
  details?: string;
  metadata?: Record<string, boolean | number | string | null>;
}

export interface TriageTrace {
  runId: string;
  caseId: string;
  mode: TriageMode;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  providerSummary: RunProviderSummary;
  events: AgentTraceEvent[];
}

export interface CaseDisposition {
  caseId: string;
  recommendedAction: RecommendedAction;
  status: "Open" | "Pending Review" | "Closed" | "Escalated";
  rationale: string;
  analystDecision?: "Pending" | "Confirmed Fraud" | "False Positive" | "Needs Review";
  updatedAt?: string;
}

export interface InvestigatorRecommendation {
  caseId: string;
  recommendedAction: RecommendedAction;
  rationale: string;
  status: CaseDisposition["status"];
  generatedBy: "rules" | "openai" | "fallback";
}

export interface TriageResult {
  structuredAlert: StructuredAlert;
  detectedSignals: DetectedSignal[];
  riskAssessment: RiskAssessment;
  investigatorRecommendation: InvestigatorRecommendation;
  retrievedGuidance: RetrievedPassage[];
  caseSummary: string;
  summarySource: "template" | "openai";
  whyFlagged: string[];
  mitigatingFactors: string[];
  limitations: string[];
  trace: TriageTrace;
}

export interface SampleCase {
  id: string;
  label: string;
  expectedOutcome: string;
  expectedRiskTier: RiskLevel;
  description: string;
  source: CaseDatasetSource;
  scenarioType: string;
  tags: string[];
  alert: CaseAlert;
}

export type FraudTriageRequest = FraudAlertInput | CaseAlert;
