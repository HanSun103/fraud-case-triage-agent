import { retrieveGuidanceForAlert } from "@/lib/rag/retrieveGuidance";
import { CaseAlert, RetrievedPassage } from "@/types/fraud";

export async function GuidanceRetrievalAgent(alert: CaseAlert): Promise<RetrievedPassage[]> {
  return retrieveGuidanceForAlert(alert, { topK: 4 });
}
