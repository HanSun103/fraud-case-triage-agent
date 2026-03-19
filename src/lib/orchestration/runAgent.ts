import { AgentTraceEvent } from "@/types/fraud";

import { AgentRunContext, OrchestrationAgent } from "@/lib/orchestration/types";

export async function runAgentStep<Input, Output>(params: {
  agent: OrchestrationAgent<Input, Output>;
  input: Input;
  context: AgentRunContext;
  events: AgentTraceEvent[];
}) {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();

  try {
    const result = await params.agent.execute(params.input, params.context);
    const completedAtDate = new Date();
    const event: AgentTraceEvent = {
      runId: params.context.runId,
      caseId: params.context.caseId,
      agentName: params.agent.name,
      status: result.status ?? "completed",
      startedAt,
      completedAt: completedAtDate.toISOString(),
      durationMs: completedAtDate.getTime() - startedAtDate.getTime(),
      inputSummary: params.agent.summarizeInput(params.input),
      outputSummary: params.agent.summarizeOutput(result.output),
      inference: {
        provider: result.inference?.provider ?? "local",
        model: result.inference?.model ?? null,
        attempted: result.inference?.attempted ?? false,
        used: result.inference?.used ?? false,
        verifiedWithRules: result.inference?.verifiedWithRules ?? false,
        verificationSummary: result.inference?.verificationSummary ?? null,
        fallbackReason: result.inference?.fallbackReason ?? null,
        requestId: result.inference?.requestId ?? null,
      },
      details: result.details,
      metadata: result.metadata,
    };

    params.events.push(event);
    console.info(
      `[triage:${params.context.runId}] ${params.agent.name} ${event.status} in ${event.durationMs}ms`,
      event.metadata ?? {},
    );

    return result.output;
  } catch (error) {
    const completedAtDate = new Date();
    const failedEvent: AgentTraceEvent = {
      runId: params.context.runId,
      caseId: params.context.caseId,
      agentName: params.agent.name,
      status: "failed",
      startedAt,
      completedAt: completedAtDate.toISOString(),
      durationMs: completedAtDate.getTime() - startedAtDate.getTime(),
      inputSummary: params.agent.summarizeInput(params.input),
      outputSummary: "Agent execution failed.",
      inference: {
        provider: "local",
        model: null,
        attempted: false,
        used: false,
        verifiedWithRules: false,
        verificationSummary: null,
        fallbackReason: "AGENT_EXECUTION_ERROR",
        requestId: null,
      },
      details: error instanceof Error ? error.message : "Unknown agent error.",
    };

    params.events.push(failedEvent);
    console.error(
      `[triage:${params.context.runId}] ${params.agent.name} failed`,
      error,
    );
    throw error;
  }
}
