import { CaseSummaryGenerator } from "@/lib/agents/CaseSummaryGenerator";
import { TriageResult } from "@/types/fraud";

export async function NarrativeSummaryAgent(
  triageResult: Omit<TriageResult, "caseSummary" | "summarySource" | "trace">,
) {
  return CaseSummaryGenerator(triageResult);
}
