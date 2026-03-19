import { randomUUID } from "crypto";

import { AlertIntakeAgent } from "@/lib/agents/AlertIntakeAgent";
import { GuidanceRetrievalAgent } from "@/lib/agents/GuidanceRetrievalAgent";
import { InvestigatorRecommendationAgent } from "@/lib/agents/InvestigatorRecommendationAgent";
import { NarrativeSummaryAgent } from "@/lib/agents/NarrativeSummaryAgent";
import { RiskAssessmentAgent } from "@/lib/agents/RiskAssessmentAgent";
import { RiskSignalDetectionAgent } from "@/lib/agents/RiskSignalDetectionAgent";
import { toCaseAlert } from "@/lib/domain/fraudAdapters";
import { interpretRetrievedGuidanceWithOpenAI } from "@/lib/openai/guidance/interpretRetrievedGuidance";
import { generateStructuredAlertWithOpenAI } from "@/lib/openai/intake/generateStructuredAlert";
import { generateRecommendationWithOpenAI } from "@/lib/openai/recommendation/generateRecommendation";
import { generateSignalDetectionWithOpenAI } from "@/lib/openai/signals/generateSignalDetection";
import { isOpenAIConfigured } from "@/lib/openai/shared";
import { getTriageMode } from "@/lib/openai/triageMode";
import { runAgentStep } from "@/lib/orchestration/runAgent";
import { OrchestrationAgent } from "@/lib/orchestration/types";
import {
  CaseAlert,
  DetectedSignal,
  FraudTriageRequest,
  InvestigatorRecommendation,
  RetrievedPassage,
  RiskAssessment,
  StructuredAlert,
  TriageResult,
} from "@/types/fraud";

const limitations = [
  "False positives can happen when important context is missing.",
  "Travel notifications and other customer context may be incomplete.",
  "Rules are simplified for transparency and demo value.",
  "This POC is not suitable for production use without stronger controls and real data pipelines.",
];

interface SignalDetectionResult {
  signals: DetectedSignal[];
  whyFlagged: string[];
  mitigatingFactors: string[];
}

function verifyStructuredAlert(openAiAlert: StructuredAlert, localAlert: StructuredAlert) {
  const matches =
    openAiAlert.caseId === localAlert.caseId &&
    openAiAlert.transactionId === localAlert.transactionId &&
    openAiAlert.transactionAmount === localAlert.transactionAmount &&
    openAiAlert.customerName === localAlert.customerName;

  return {
    valid: matches,
    summary: matches
      ? "OpenAI structured alert matched local normalization on key identifiers."
      : "OpenAI structured alert drifted from local normalization on key identifiers.",
  };
}

function countStrongSignals(signals: DetectedSignal[]) {
  return signals.filter((signal) => signal.severity === "strong").length;
}

function verifySignalDetection(openAiSignals: SignalDetectionResult, localSignals: SignalDetectionResult) {
  const openAiIds = new Set(openAiSignals.signals.map((signal) => signal.id));
  const localIds = new Set(localSignals.signals.map((signal) => signal.id));
  const overlap = [...openAiIds].filter((signalId) => localIds.has(signalId));
  const openAiHasReasoning =
    openAiSignals.whyFlagged.length > 0 || openAiSignals.mitigatingFactors.length > 0;
  const catastrophicMiss =
    localSignals.signals.length > 0 &&
    countStrongSignals(localSignals.signals) >= 2 &&
    openAiSignals.signals.length === 0;

  return {
    valid: openAiHasReasoning && !catastrophicMiss,
    summary: catastrophicMiss
      ? "OpenAI signal detection missed several strong rule-based indicators, so local detection was retained."
      : `OpenAI and local signal detection overlapped on ${overlap.length} signal ids.`,
  };
}

function verifyRecommendation(
  recommendedAction: InvestigatorRecommendation["recommendedAction"],
  riskAssessment: RiskAssessment,
) {
  const valid = recommendedAction === riskAssessment.recommendedAction;

  return {
    valid,
    summary: valid
      ? "OpenAI recommendation aligned with the rule-based action."
      : "OpenAI recommendation conflicted with the rule-based action, so the local recommendation was retained.",
  };
}

function applyGuidanceInterpretations(
  passages: RetrievedPassage[],
  interpretations: { chunkId: string; interpretation: string }[],
) {
  const interpretationMap = new Map(
    interpretations.map((interpretation) => [interpretation.chunkId, interpretation.interpretation]),
  );

  return passages.map((passage) => ({
    ...passage,
    interpretation: interpretationMap.get(passage.chunkId) ?? null,
    interpretationSource: interpretationMap.has(passage.chunkId) ? ("openai" as const) : null,
  }));
}

const alertIntakeStep: OrchestrationAgent<CaseAlert, StructuredAlert> = {
  name: "AlertIntakeAgent",
  summarizeInput: (input) =>
    `Normalize case ${input.caseId} from ${input.alertSource} for ${input.customer.customerName}.`,
  summarizeOutput: (output) =>
    `Structured alert for ${output.customerName} with trigger "${output.alertTrigger}".`,
  execute: async (input, context) => {
    const localStructuredAlert = AlertIntakeAgent(input);

    if (context.mode !== "HYBRID_OPENAI" || !context.openAiConfigured) {
      return {
        output: localStructuredAlert,
        inference: {
          provider: "local",
          attempted: false,
          used: true,
          verifiedWithRules: false,
          fallbackReason: context.mode === "HYBRID_OPENAI" ? "OPENAI_NOT_CONFIGURED" : "MODE_LOCAL_ONLY",
        },
        metadata: {
          alertSource: input.alertSource,
          customerSegment: input.customer.customerSegment,
        },
      };
    }

    try {
      const openAiStructuredAlert = await generateStructuredAlertWithOpenAI(input);

      if (!openAiStructuredAlert) {
        return {
          output: localStructuredAlert,
          status: "fallback",
          inference: {
            provider: "local",
            attempted: true,
            used: true,
            verifiedWithRules: false,
            fallbackReason: "OPENAI_NOT_CONFIGURED",
          },
          details: "OpenAI intake was requested but no API key was configured.",
        };
      }

      const verification = verifyStructuredAlert(openAiStructuredAlert.data, localStructuredAlert);

      if (!verification.valid) {
        return {
          output: localStructuredAlert,
          status: "fallback",
          inference: {
            provider: "local",
            model: openAiStructuredAlert.model,
            attempted: true,
            used: true,
            verifiedWithRules: true,
            verificationSummary: verification.summary,
            fallbackReason: "VERIFICATION_FAILED",
            requestId: openAiStructuredAlert.requestId,
          },
          details: verification.summary,
        };
      }

      return {
        output: openAiStructuredAlert.data,
        inference: {
          provider: "openai",
          model: openAiStructuredAlert.model,
          attempted: true,
          used: true,
          verifiedWithRules: true,
          verificationSummary: verification.summary,
          fallbackReason: null,
          requestId: openAiStructuredAlert.requestId,
        },
        metadata: {
          alertSource: input.alertSource,
          customerSegment: input.customer.customerSegment,
        },
      };
    } catch (error) {
      return {
        output: localStructuredAlert,
        status: "fallback",
        inference: {
          provider: "local",
          attempted: true,
          used: true,
          verifiedWithRules: false,
          fallbackReason: "OPENAI_REQUEST_FAILED",
        },
        details: error instanceof Error ? error.message : "OpenAI intake request failed.",
      };
    }
  },
};

const signalDetectionStep: OrchestrationAgent<StructuredAlert, SignalDetectionResult> = {
  name: "SignalDetectionAgent",
  summarizeInput: (input) =>
    `Evaluate rule-based signals for ${input.caseId} at ${input.transactionLocation}.`,
  summarizeOutput: (output) =>
    output.signals.length
      ? `Detected ${output.signals.length} signals and ${output.mitigatingFactors.length} mitigating factors.`
      : `No significant signals detected; ${output.mitigatingFactors.length} mitigating factors noted.`,
  execute: async (input, context) => {
    const localSignalDetection = RiskSignalDetectionAgent(input);

    if (context.mode !== "HYBRID_OPENAI" || !context.openAiConfigured) {
      return {
        output: localSignalDetection,
        inference: {
          provider: "local",
          attempted: false,
          used: true,
          verifiedWithRules: false,
          fallbackReason: context.mode === "HYBRID_OPENAI" ? "OPENAI_NOT_CONFIGURED" : "MODE_LOCAL_ONLY",
        },
        metadata: {
          signalCount: localSignalDetection.signals.length,
        },
      };
    }

    try {
      const openAiSignalDetection = await generateSignalDetectionWithOpenAI(input);

      if (!openAiSignalDetection) {
        return {
          output: localSignalDetection,
          status: "fallback",
          inference: {
            provider: "local",
            attempted: true,
            used: true,
            verifiedWithRules: false,
            fallbackReason: "OPENAI_NOT_CONFIGURED",
          },
          metadata: {
            signalCount: localSignalDetection.signals.length,
          },
        };
      }

      const verification = verifySignalDetection(openAiSignalDetection.data, localSignalDetection);

      if (!verification.valid) {
        return {
          output: localSignalDetection,
          status: "fallback",
          inference: {
            provider: "local",
            model: openAiSignalDetection.model,
            attempted: true,
            used: true,
            verifiedWithRules: true,
            verificationSummary: verification.summary,
            fallbackReason: "VERIFICATION_FAILED",
            requestId: openAiSignalDetection.requestId,
          },
          details: verification.summary,
          metadata: {
            signalCount: localSignalDetection.signals.length,
          },
        };
      }

      return {
        output: openAiSignalDetection.data,
        inference: {
          provider: "openai",
          model: openAiSignalDetection.model,
          attempted: true,
          used: true,
          verifiedWithRules: true,
          verificationSummary: verification.summary,
          fallbackReason: null,
          requestId: openAiSignalDetection.requestId,
        },
        metadata: {
          signalCount: openAiSignalDetection.data.signals.length,
        },
      };
    } catch (error) {
      return {
        output: localSignalDetection,
        status: "fallback",
        inference: {
          provider: "local",
          attempted: true,
          used: true,
          verifiedWithRules: false,
          fallbackReason: "OPENAI_REQUEST_FAILED",
        },
        details: error instanceof Error ? error.message : "OpenAI signal detection request failed.",
        metadata: {
          signalCount: localSignalDetection.signals.length,
        },
      };
    }
  },
};

const riskAssessmentStep: OrchestrationAgent<
  {
    structuredAlert: StructuredAlert;
    signalDetection: SignalDetectionResult;
  },
  RiskAssessment
> = {
  name: "RiskAssessmentAgent",
  summarizeInput: ({ signalDetection }) =>
    `Score ${signalDetection.signals.length} signals with ${signalDetection.mitigatingFactors.length} mitigations.`,
  summarizeOutput: (output) =>
    `${output.riskLevel} risk scored at ${output.score} with action ${output.recommendedAction}.`,
  execute: ({ structuredAlert, signalDetection }) => ({
    output: RiskAssessmentAgent({
      structuredAlert,
      signals: signalDetection.signals,
      mitigatingFactors: signalDetection.mitigatingFactors,
    }),
  }),
};

const guidanceRetrievalStep: OrchestrationAgent<CaseAlert, RetrievedPassage[]> = {
  name: "GuidanceRetrievalAgent",
  summarizeInput: (input) =>
    `Retrieve guidance for ${input.caseId} with trigger "${input.alertTriggerReason}".`,
  summarizeOutput: (output) =>
    output.length
      ? `Retrieved ${output.length} guidance passages; top source ${output[0].citation.title}.`
      : "No relevant guidance passages found.",
  execute: async (input, context) => {
    const localPassages = await GuidanceRetrievalAgent(input);

    if (
      context.mode !== "HYBRID_OPENAI" ||
      !context.openAiConfigured ||
      localPassages.length === 0
    ) {
      return {
        output: localPassages,
        inference: {
          provider: "local",
          attempted: false,
          used: true,
          verifiedWithRules: false,
          fallbackReason:
            localPassages.length === 0
              ? "NO_GUIDANCE_FOUND"
              : context.mode === "HYBRID_OPENAI"
                ? "OPENAI_NOT_CONFIGURED"
                : "MODE_LOCAL_ONLY",
        },
        metadata: {
          passageCount: localPassages.length,
        },
      };
    }

    try {
      const structuredAlert = AlertIntakeAgent(input);
      const openAiInterpretation = await interpretRetrievedGuidanceWithOpenAI({
        structuredAlert,
        passages: localPassages,
      });

      if (!openAiInterpretation) {
        return {
          output: localPassages,
          status: "fallback",
          inference: {
            provider: "local",
            attempted: true,
            used: true,
            verifiedWithRules: false,
            fallbackReason: "OPENAI_NOT_CONFIGURED",
          },
          metadata: {
            passageCount: localPassages.length,
          },
        };
      }

      const interpretedPassages = applyGuidanceInterpretations(
        localPassages,
        openAiInterpretation.data.interpretations,
      );

      return {
        output: interpretedPassages,
        inference: {
          provider: "openai",
          model: openAiInterpretation.model,
          attempted: true,
          used: true,
          verifiedWithRules: true,
          verificationSummary: "OpenAI interpreted local guidance passages while preserving citations.",
          fallbackReason: null,
          requestId: openAiInterpretation.requestId,
        },
        metadata: {
          passageCount: interpretedPassages.length,
        },
      };
    } catch (error) {
      return {
        output: localPassages,
        status: "fallback",
        inference: {
          provider: "local",
          attempted: true,
          used: true,
          verifiedWithRules: false,
          fallbackReason: "OPENAI_REQUEST_FAILED",
        },
        details:
          error instanceof Error ? error.message : "OpenAI guidance interpretation request failed.",
        metadata: {
          passageCount: localPassages.length,
        },
      };
    }
  },
};

const recommendationStep: OrchestrationAgent<
  {
    structuredAlert: StructuredAlert;
    detectedSignals: DetectedSignal[];
    riskAssessment: RiskAssessment;
    mitigatingFactors: string[];
    retrievedGuidance: RetrievedPassage[];
  },
  InvestigatorRecommendation
> = {
  name: "InvestigatorRecommendationAgent",
  summarizeInput: ({ riskAssessment, retrievedGuidance }) =>
    `Draft recommendation from ${riskAssessment.riskLevel} risk and ${retrievedGuidance.length} guidance passages.`,
  summarizeOutput: (output) =>
    `${output.recommendedAction} with case status ${output.status}.`,
  execute: async (input, context) => {
    const localRecommendation = InvestigatorRecommendationAgent(input);

    if (context.mode !== "HYBRID_OPENAI" || !context.openAiConfigured) {
      return {
        output: localRecommendation,
        inference: {
          provider: "local",
          attempted: false,
          used: true,
          verifiedWithRules: false,
          fallbackReason: context.mode === "HYBRID_OPENAI" ? "OPENAI_NOT_CONFIGURED" : "MODE_LOCAL_ONLY",
        },
      };
    }

    try {
      const openAiRecommendation = await generateRecommendationWithOpenAI(input);

      if (!openAiRecommendation) {
        return {
          output: localRecommendation,
          status: "fallback",
          inference: {
            provider: "local",
            attempted: true,
            used: true,
            verifiedWithRules: false,
            fallbackReason: "OPENAI_NOT_CONFIGURED",
          },
        };
      }

      const verification = verifyRecommendation(
        openAiRecommendation.data.recommendedAction,
        input.riskAssessment,
      );

      if (!verification.valid) {
        return {
          output: localRecommendation,
          status: "fallback",
          inference: {
            provider: "local",
            model: openAiRecommendation.model,
            attempted: true,
            used: true,
            verifiedWithRules: true,
            verificationSummary: verification.summary,
            fallbackReason: "VERIFICATION_FAILED",
            requestId: openAiRecommendation.requestId,
          },
          details: verification.summary,
        };
      }

      return {
        output: openAiRecommendation.data,
        inference: {
          provider: "openai",
          model: openAiRecommendation.model,
          attempted: true,
          used: true,
          verifiedWithRules: true,
          verificationSummary: verification.summary,
          fallbackReason: null,
          requestId: openAiRecommendation.requestId,
        },
      };
    } catch (error) {
      return {
        output: localRecommendation,
        status: "fallback",
        inference: {
          provider: "local",
          attempted: true,
          used: true,
          verifiedWithRules: false,
          fallbackReason: "OPENAI_REQUEST_FAILED",
        },
        details:
          error instanceof Error ? error.message : "OpenAI recommendation request failed.",
      };
    }
  },
};

const narrativeSummaryStep: OrchestrationAgent<
  Omit<TriageResult, "caseSummary" | "summarySource" | "trace">,
  {
    summary: string;
    source: "template" | "openai";
    model: string | null;
    requestId: string | null;
    fallbackReason: string | null;
  }
> = {
  name: "NarrativeSummaryAgent",
  summarizeInput: (input) =>
    `Generate narrative for ${input.structuredAlert.caseId} using ${input.retrievedGuidance.length} guidance passages.`,
  summarizeOutput: (output) =>
    `Generated summary via ${output.source} source.`,
  execute: async (input, context) => {
    const output = await NarrativeSummaryAgent(input);

    return {
      output,
      status:
        output.source === "template" && context.mode === "HYBRID_OPENAI"
          ? "fallback"
          : "completed",
      inference: {
        provider: output.source === "openai" ? "openai" : "local",
        model: output.model,
        attempted: context.mode === "HYBRID_OPENAI",
        used: true,
        verifiedWithRules: false,
        verificationSummary: null,
        fallbackReason: output.fallbackReason,
        requestId: output.requestId,
      },
      metadata: {
        summarySource: output.source,
        guidanceCount: input.retrievedGuidance.length,
      },
    };
  },
};

export async function runFraudTriageWorkflow(
  alertInput: FraudTriageRequest,
): Promise<TriageResult> {
  const caseAlert = toCaseAlert(alertInput);
  const runId = randomUUID();
  const mode = getTriageMode();
  const openAiConfigured = isOpenAIConfigured();
  const startedAtDate = new Date();
  const events: TriageResult["trace"]["events"] = [];
  const context = {
    runId,
    caseId: caseAlert.caseId,
    mode,
    openAiConfigured,
  } as const;

  console.info(`[triage:${runId}] Starting triage workflow for ${caseAlert.caseId}`);

  const structuredAlert = await runAgentStep({
    agent: alertIntakeStep,
    input: caseAlert,
    context,
    events,
  });
  const signalDetection = await runAgentStep({
    agent: signalDetectionStep,
    input: structuredAlert,
    context,
    events,
  });
  const riskAssessment = await runAgentStep({
    agent: riskAssessmentStep,
    input: { structuredAlert, signalDetection },
    context,
    events,
  });
  const retrievedGuidance = await runAgentStep({
    agent: guidanceRetrievalStep,
    input: caseAlert,
    context,
    events,
  });
  const investigatorRecommendation = await runAgentStep({
    agent: recommendationStep,
    input: {
      structuredAlert,
      detectedSignals: signalDetection.signals,
      riskAssessment,
      mitigatingFactors: signalDetection.mitigatingFactors,
      retrievedGuidance,
    },
    context,
    events,
  });

  const resultWithoutSummary = {
    structuredAlert,
    detectedSignals: signalDetection.signals,
    riskAssessment,
    investigatorRecommendation,
    retrievedGuidance,
    whyFlagged: signalDetection.whyFlagged,
    mitigatingFactors: signalDetection.mitigatingFactors,
    limitations,
  };

  const summaryResult = await runAgentStep({
    agent: narrativeSummaryStep,
    input: resultWithoutSummary,
    context,
    events,
  });

  const completedAtDate = new Date();
  const trace: TriageResult["trace"] = {
    runId,
    caseId: caseAlert.caseId,
    mode,
    startedAt: startedAtDate.toISOString(),
    completedAt: completedAtDate.toISOString(),
    durationMs: completedAtDate.getTime() - startedAtDate.getTime(),
    providerSummary: {
      openAiConfigured,
      openAiAttemptCount: events.filter((event) => event.inference.attempted).length,
      openAiSuccessCount: events.filter((event) => event.inference.provider === "openai").length,
      fallbackCount: events.filter((event) => event.status === "fallback").length,
    },
    events,
  };

  console.info(
    `[triage:${runId}] Completed triage for ${caseAlert.caseId} in ${trace.durationMs}ms`,
  );

  return {
    ...resultWithoutSummary,
    caseSummary: summaryResult.summary,
    summarySource: summaryResult.source,
    trace,
  };
}
