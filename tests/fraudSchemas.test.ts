import { beforeEach, describe, expect, it } from "vitest";

import { runFraudTriage } from "@/lib/triagePipeline";
import {
  sampleCaseDatasetSchema,
  triageRequestSchema,
  triageResultSchema,
} from "@/lib/validation/fraudSchemas";
import sampleCasesJson from "../data/cases/sample/demo-cases.json";
import { getAllCases } from "@/lib/data/caseDataset";

describe("fraud schemas", () => {
  beforeEach(() => {
    process.env.TRIAGE_MODE = "LOCAL_RULES_ONLY";
    delete process.env.OPENAI_API_KEY;
  });

  it("validates the sample dataset", () => {
    const parsed = sampleCaseDatasetSchema.parse(sampleCasesJson);

    expect(parsed.length).toBeGreaterThanOrEqual(30);
  });

  it("accepts a normalized case alert request", () => {
    const demoCase = getAllCases()[0];
    const parsed = triageRequestSchema.parse(demoCase.alert);

    expect("caseId" in parsed ? parsed.caseId : "").toBe(demoCase.alert.caseId);
  });

  it("validates a triage result envelope", async () => {
    const demoCase = getAllCases()[0];
    const result = await runFraudTriage(demoCase.alert);

    expect(triageResultSchema.parse(result).structuredAlert.caseId).toBe(demoCase.alert.caseId);
  });
});
