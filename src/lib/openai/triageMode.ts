import { TriageMode } from "@/types/fraud";

export function getTriageMode(): TriageMode {
  return process.env.TRIAGE_MODE === "HYBRID_OPENAI"
    ? "HYBRID_OPENAI"
    : "LOCAL_RULES_ONLY";
}
