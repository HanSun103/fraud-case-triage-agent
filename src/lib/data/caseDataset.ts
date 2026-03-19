import generatedCasesJson from "../../../data/cases/generated/generated-cases.json";
import importedCasesJson from "../../../data/cases/imported/imported-cases.json";
import sampleCasesJson from "../../../data/cases/sample/demo-cases.json";

import { sampleCaseDatasetSchema } from "@/lib/validation/fraudSchemas";
import { RiskLevel, SampleCase } from "@/types/fraud";

const sampleCases = sampleCaseDatasetSchema.parse(sampleCasesJson);
const generatedCases = sampleCaseDatasetSchema.parse(generatedCasesJson);
const importedCases = sampleCaseDatasetSchema.parse(importedCasesJson);

export const caseCollections = {
  sample: sampleCases,
  generated: generatedCases,
  imported: importedCases,
} as const;

export interface CaseListFilters {
  riskTier?: RiskLevel | "All";
  source?: keyof typeof caseCollections | "All";
  search?: string;
}

export function getAllCases(): SampleCase[] {
  return [...sampleCases, ...generatedCases, ...importedCases];
}

export function getCasesBySource(source: keyof typeof caseCollections): SampleCase[] {
  return [...caseCollections[source]];
}

export function getCaseById(caseId: string): SampleCase | undefined {
  return getAllCases().find((demoCase) => demoCase.id === caseId);
}

export function listCases(filters: CaseListFilters = {}): SampleCase[] {
  return getAllCases().filter((demoCase) => {
    const matchesRiskTier =
      !filters.riskTier ||
      filters.riskTier === "All" ||
      demoCase.expectedRiskTier === filters.riskTier;
    const matchesSource =
      !filters.source || filters.source === "All" || demoCase.source === filters.source;
    const searchTerm = filters.search?.trim().toLowerCase();
    const matchesSearch =
      !searchTerm ||
      [
        demoCase.label,
        demoCase.description,
        demoCase.scenarioType,
        demoCase.expectedOutcome,
        demoCase.alert.customer.customerName,
        demoCase.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm);

    return matchesRiskTier && matchesSource && matchesSearch;
  });
}

export function getRandomCase(filters: CaseListFilters = {}): SampleCase | undefined {
  const cases = listCases(filters);

  if (!cases.length) {
    return undefined;
  }

  return cases[Math.floor(Math.random() * cases.length)];
}

export function compareCases(leftCaseId: string, rightCaseId: string) {
  const left = getCaseById(leftCaseId);
  const right = getCaseById(rightCaseId);

  if (!left || !right) {
    return null;
  }

  return {
    left,
    right,
    rows: [
      {
        label: "Expected risk tier",
        left: left.expectedRiskTier,
        right: right.expectedRiskTier,
      },
      {
        label: "Scenario",
        left: left.scenarioType,
        right: right.scenarioType,
      },
      {
        label: "Amount",
        left: left.alert.transaction.amount,
        right: right.alert.transaction.amount,
      },
      {
        label: "Device status",
        left: left.alert.device.knownDevice ? "Known" : "New",
        right: right.alert.device.knownDevice ? "Known" : "New",
      },
      {
        label: "Merchant familiarity",
        left: left.alert.merchant.knownMerchant ? "Known" : "New",
        right: right.alert.merchant.knownMerchant ? "Known" : "New",
      },
      {
        label: "Travel notice",
        left: left.alert.customer.travelNoticeOnFile ? "On file" : "Not on file",
        right: right.alert.customer.travelNoticeOnFile ? "On file" : "Not on file",
      },
    ],
  };
}
