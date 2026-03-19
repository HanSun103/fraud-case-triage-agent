import { runFraudTriageWorkflow } from "@/lib/orchestration/runFraudTriageWorkflow";
import { FraudTriageRequest, TriageResult } from "@/types/fraud";

// This pipeline stitches the four demo agents together into one API-friendly workflow.
export async function runFraudTriage(alertInput: FraudTriageRequest): Promise<TriageResult> {
  return runFraudTriageWorkflow(alertInput);
}
