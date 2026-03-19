import { getCasesBySource } from "@/lib/data/caseDataset";
import { SampleCase } from "@/types/fraud";

export const sampleAlerts: SampleCase[] = getCasesBySource("sample");
