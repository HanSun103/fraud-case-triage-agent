import { z } from "zod";

import { guidanceChunkCitationSchema } from "@/lib/rag/schemas";

const riskLevelSchema = z.enum(["Low", "Medium", "High"]);
const recommendedActionSchema = z.enum([
  "Close Alert",
  "Flag for Manual Review",
  "Escalate to Fraud Investigator",
]);
const signalSeveritySchema = z.enum(["moderate", "strong"]);
const triageModeSchema = z.enum(["LOCAL_RULES_ONLY", "HYBRID_OPENAI"]);
const retrievalMethodSchema = z.enum(["keyword", "lightweight-similarity"]);
const agentProviderSchema = z.enum(["local", "openai"]);
const transactionChannelSchema = z.enum([
  "Card Present",
  "Card Not Present",
  "Online",
  "Mobile",
  "ATM",
  "Wire",
  "Other",
]);
const customerSegmentSchema = z.enum([
  "Mass Retail",
  "Affluent",
  "Student",
  "Small Business",
  "Traveling Customer",
  "Other",
]);
const alertSourceSchema = z.enum([
  "Rules Engine",
  "Velocity Rule",
  "Location Rule",
  "Analyst Referral",
  "Customer Report",
  "Demo Scenario",
  "Other",
]);
const deviceStatusSchema = z.enum(["Known", "New"]);
const merchantFamiliaritySchema = z.enum(["Usual", "New"]);

const looseString = z.string();
const finiteNumber = z.coerce.number().finite();
const nonNegativeNumber = finiteNumber.min(0);

export const legacyFraudAlertInputSchema = z.object({
  customerName: looseString,
  accountAgeDays: nonNegativeNumber,
  homeLocation: looseString,
  transactionAmount: nonNegativeNumber,
  merchant: looseString,
  transactionLocation: looseString,
  transactionTime: looseString,
  recentTransactionCount: nonNegativeNumber,
  typicalTransactionAmount: nonNegativeNumber,
  alertTriggerReason: looseString,
  deviceStatus: deviceStatusSchema,
  merchantFamiliarity: merchantFamiliaritySchema,
  accountHistoryNotes: looseString,
});

export const transactionEventSchema = z.object({
  caseId: looseString,
  transactionId: looseString,
  eventTime: looseString,
  amount: nonNegativeNumber,
  currency: looseString,
  channel: transactionChannelSchema,
  merchantName: looseString,
  merchantCategory: looseString,
  merchantCountry: looseString,
  transactionLocation: looseString,
  prior30dTxnCount: nonNegativeNumber,
  prior24hTxnCount: nonNegativeNumber,
  typicalTransactionAmount: nonNegativeNumber,
});

export const customerProfileSchema = z.object({
  customerId: looseString,
  customerName: looseString,
  customerSegment: customerSegmentSchema,
  customerHomeCountry: looseString,
  homeLocation: looseString,
  accountAgeDays: nonNegativeNumber,
  priorChargebackCount: nonNegativeNumber,
  travelNoticeOnFile: z.boolean(),
  accountHistoryNotes: looseString,
  analystNotes: looseString,
});

export const deviceContextSchema = z.object({
  deviceId: looseString,
  knownDevice: z.boolean(),
  deviceAgeDays: nonNegativeNumber,
});

export const merchantContextSchema = z.object({
  merchantName: looseString,
  merchantCategory: looseString,
  merchantCountry: looseString,
  knownMerchant: z.boolean(),
});

export const geolocationContextSchema = z.object({
  transactionLocation: looseString,
  homeLocation: looseString,
  merchantCountry: looseString,
  customerHomeCountry: looseString,
});

export const caseAlertSchema = z.object({
  caseId: looseString,
  alertSource: alertSourceSchema,
  alertTriggerReason: looseString,
  analystNotes: looseString,
  customer: customerProfileSchema,
  transaction: transactionEventSchema,
  device: deviceContextSchema,
  merchant: merchantContextSchema,
  geolocation: geolocationContextSchema,
});

export const detectedSignalSchema = z.object({
  id: looseString,
  title: looseString,
  explanation: looseString,
  severity: signalSeveritySchema,
});

export const signalDetectionResultSchema = z.object({
  signals: z.array(detectedSignalSchema),
  whyFlagged: z.array(looseString),
  mitigatingFactors: z.array(looseString),
});

export const riskAssessmentSchema = z.object({
  riskLevel: riskLevelSchema,
  recommendedAction: recommendedActionSchema,
  reason: looseString,
  score: finiteNumber,
  scoreBreakdown: z.array(
    z.object({
      id: looseString,
      label: looseString,
      delta: finiteNumber,
      explanation: looseString,
      category: z.enum(["signal", "combination", "mitigation"]),
    }),
  ),
});

export const retrievedPassageSchema = z.object({
  chunkId: looseString,
  score: finiteNumber,
  retrievalMethod: retrievalMethodSchema,
  text: looseString,
  matchedTerms: z.array(looseString),
  citation: guidanceChunkCitationSchema,
  interpretation: z.string().nullable(),
  interpretationSource: agentProviderSchema.nullable(),
});

export const investigatorRecommendationSchema = z.object({
  caseId: looseString,
  recommendedAction: recommendedActionSchema,
  rationale: looseString,
  status: z.enum(["Open", "Pending Review", "Closed", "Escalated"]),
  generatedBy: z.enum(["rules", "openai", "fallback"]),
});

export const agentInferenceSchema = z.object({
  provider: agentProviderSchema,
  model: z.string().nullable(),
  attempted: z.boolean(),
  used: z.boolean(),
  verifiedWithRules: z.boolean(),
  verificationSummary: z.string().nullable(),
  fallbackReason: z.string().nullable(),
  requestId: z.string().nullable(),
});

export const agentTraceEventSchema = z.object({
  runId: looseString,
  caseId: looseString,
  agentName: looseString,
  status: z.enum(["completed", "failed", "fallback"]),
  startedAt: looseString,
  completedAt: looseString,
  durationMs: nonNegativeNumber,
  inputSummary: looseString,
  outputSummary: looseString,
  inference: agentInferenceSchema,
  details: looseString.optional(),
  metadata: z
    .record(z.string(), z.union([z.boolean(), z.number(), z.string(), z.null()]))
    .optional(),
});

export const triageTraceSchema = z.object({
  runId: looseString,
  caseId: looseString,
  mode: triageModeSchema,
  startedAt: looseString,
  completedAt: looseString,
  durationMs: nonNegativeNumber,
  providerSummary: z.object({
    openAiConfigured: z.boolean(),
    openAiAttemptCount: nonNegativeNumber,
    openAiSuccessCount: nonNegativeNumber,
    fallbackCount: nonNegativeNumber,
  }),
  events: z.array(agentTraceEventSchema),
});

export const caseDispositionSchema = z.object({
  caseId: looseString,
  recommendedAction: recommendedActionSchema,
  status: z.enum(["Open", "Pending Review", "Closed", "Escalated"]),
  rationale: looseString,
  analystDecision: z
    .enum(["Pending", "Confirmed Fraud", "False Positive", "Needs Review"])
    .optional(),
  updatedAt: looseString.optional(),
});

export const structuredAlertSchema = z.object({
  caseId: looseString,
  transactionId: looseString,
  eventTime: looseString,
  transactionTime: looseString,
  amount: nonNegativeNumber,
  transactionAmount: nonNegativeNumber,
  currency: looseString,
  channel: transactionChannelSchema,
  merchant: looseString,
  merchantCategory: looseString,
  merchantCountry: looseString,
  transactionLocation: looseString,
  homeLocation: looseString,
  customerHomeCountry: looseString,
  alertTrigger: looseString,
  alertSource: alertSourceSchema,
  knownDevice: z.boolean(),
  deviceAgeDays: nonNegativeNumber,
  knownMerchant: z.boolean(),
  prior30dTxnCount: nonNegativeNumber,
  prior24hTxnCount: nonNegativeNumber,
  recentTransactionCount: nonNegativeNumber,
  priorChargebackCount: nonNegativeNumber,
  accountAgeDays: nonNegativeNumber,
  typicalTransactionAmount: nonNegativeNumber,
  travelNoticeOnFile: z.boolean(),
  customerSegment: customerSegmentSchema,
  accountHistory: looseString,
  analystNotes: looseString,
  customerName: looseString,
  deviceStatus: deviceStatusSchema,
  merchantFamiliarity: merchantFamiliaritySchema,
});

export const triageResultSchema = z.object({
  structuredAlert: structuredAlertSchema,
  detectedSignals: z.array(detectedSignalSchema),
  riskAssessment: riskAssessmentSchema,
  investigatorRecommendation: investigatorRecommendationSchema,
  retrievedGuidance: z.array(retrievedPassageSchema),
  caseSummary: looseString,
  summarySource: z.enum(["template", "openai"]),
  whyFlagged: z.array(looseString),
  mitigatingFactors: z.array(looseString),
  limitations: z.array(looseString),
  trace: triageTraceSchema,
});

export const sampleCaseSchema = z.object({
  id: looseString,
  label: looseString,
  expectedOutcome: looseString,
  expectedRiskTier: riskLevelSchema,
  description: looseString,
  source: z.enum(["sample", "generated", "imported"]),
  scenarioType: looseString,
  tags: z.array(looseString),
  alert: caseAlertSchema,
});

export const triageRequestSchema = z.union([legacyFraudAlertInputSchema, caseAlertSchema]);
export const sampleCaseDatasetSchema = z.array(sampleCaseSchema);
export const caseAlertDatasetSchema = z.array(caseAlertSchema);
