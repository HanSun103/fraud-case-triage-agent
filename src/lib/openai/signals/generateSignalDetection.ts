import { z } from "zod";

import { RiskSignalDetectionAgent } from "@/lib/agents/RiskSignalDetectionAgent";
import { requestStructuredOpenAIResponse } from "@/lib/openai/shared";
import { signalDetectionResultSchema } from "@/lib/validation/fraudSchemas";
import { StructuredAlert } from "@/types/fraud";

const allowedSignalIds = [
  "unusual-location",
  "high-transaction-amount",
  "elevated-transaction-amount",
  "rapid-transaction-activity",
  "elevated-volume",
  "new-merchant",
  "new-device",
  "low-account-age",
];

const signalDisplayMap: Record<
  string,
  { title: string; explanation: string }
> = {
  "unusual-location": {
    title: "Unusual location",
    explanation:
      "The transaction location differs from the customer's usual home market.",
  },
  "high-transaction-amount": {
    title: "High transaction amount",
    explanation:
      "The transaction value is materially above the customer's typical spend.",
  },
  "elevated-transaction-amount": {
    title: "Higher-than-normal transaction amount",
    explanation:
      "The amount is elevated relative to the customer's usual transaction size.",
  },
  "rapid-transaction-activity": {
    title: "Rapid transaction activity",
    explanation: "The account shows unusually high recent transaction frequency.",
  },
  "elevated-volume": {
    title: "Abnormal recent transaction volume",
    explanation: "Recent transaction count is slightly above normal expectations.",
  },
  "new-merchant": {
    title: "New merchant",
    explanation:
      "The transaction occurred with a merchant that is not part of the customer's usual pattern.",
  },
  "new-device": {
    title: "New device",
    explanation:
      "The transaction was initiated from a device not previously associated with the account.",
  },
  "low-account-age": {
    title: "Low account age",
    explanation:
      "Newer accounts often carry more uncertainty and less stable behavioral history.",
  },
};

const openAiSignalDetectionSchema = z.object({
  signals: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      explanation: z.string().optional(),
      severity: z.enum(["moderate", "strong"]),
    }),
  ),
  whyFlagged: z.array(z.string()).default([]),
  mitigatingFactors: z.array(z.string()).default([]),
});

export async function generateSignalDetectionWithOpenAI(structuredAlert: StructuredAlert) {
  const localReference = RiskSignalDetectionAgent(structuredAlert);

  const response = await requestStructuredOpenAIResponse({
    systemPrompt: `You are a fraud signal detection agent. Analyze the structured alert and return only supported signal ids.

Allowed signal ids:
- ${allowedSignalIds.join("\n- ")}

Return:
- signals: array of DetectedSignal
- whyFlagged: array of short reasons
- mitigatingFactors: array of short factors

Important mapping hints:
- foreign or non-home geography -> unusual-location
- transaction much larger than baseline -> high-transaction-amount or elevated-transaction-amount
- bursty recent counts -> rapid-transaction-activity or elevated-volume
- unseen device -> new-device
- unseen merchant -> new-merchant
- new account -> low-account-age

Only use "moderate" or "strong" severities. If there is no good basis for a signal, omit it. Do not invent new signal ids. Prefer the allowed ids even when paraphrasing explanations.

You may use localReference as a vocabulary and consistency hint, but produce your own final judgment.`,
    userPayload: {
      structuredAlert,
      reasoningHints: {
        transactionAmount: structuredAlert.transactionAmount,
        typicalTransactionAmount: structuredAlert.typicalTransactionAmount,
        prior24hTxnCount: structuredAlert.prior24hTxnCount,
        prior30dTxnCount: structuredAlert.prior30dTxnCount,
        knownDevice: structuredAlert.knownDevice,
        knownMerchant: structuredAlert.knownMerchant,
        accountAgeDays: structuredAlert.accountAgeDays,
        travelNoticeOnFile: structuredAlert.travelNoticeOnFile,
      },
      localReference,
    },
    schema: openAiSignalDetectionSchema,
  });

  if (!response) {
    return response;
  }

  const localSignalMap = new Map(localReference.signals.map((signal) => [signal.id, signal]));

  return {
    ...response,
    data: signalDetectionResultSchema.parse({
      signals: response.data.signals.map((signal) => {
        const localSignal = localSignalMap.get(signal.id);
        const display = signalDisplayMap[signal.id];

        return {
          id: signal.id,
          title: signal.title ?? localSignal?.title ?? display?.title ?? signal.id,
          explanation:
            signal.explanation ??
            localSignal?.explanation ??
            display?.explanation ??
            `Signal ${signal.id} was identified for this alert.`,
          severity: signal.severity,
        };
      }),
      whyFlagged: response.data.whyFlagged,
      mitigatingFactors: response.data.mitigatingFactors,
    }),
  };
}
