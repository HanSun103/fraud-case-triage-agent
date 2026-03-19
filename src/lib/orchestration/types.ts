import { AgentInference, AgentTraceEvent, TriageMode } from "@/types/fraud";

export interface AgentRunContext {
  runId: string;
  caseId: string;
  mode: TriageMode;
  openAiConfigured: boolean;
}

export interface AgentExecutionResult<Output> {
  output: Output;
  status?: AgentTraceEvent["status"];
  inference?: Partial<AgentInference>;
  details?: string;
  metadata?: Record<string, boolean | number | string | null>;
}

export interface OrchestrationAgent<Input, Output> {
  name: string;
  summarizeInput(input: Input): string;
  summarizeOutput(output: Output): string;
  execute(
    input: Input,
    context: AgentRunContext,
  ): Promise<AgentExecutionResult<Output>> | AgentExecutionResult<Output>;
}
