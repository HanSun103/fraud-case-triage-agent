import { getAllCases } from "@/lib/data/caseDataset";
import { CaseAlert, SampleCase } from "@/types/fraud";

export function getCaseByScenario(scenarioType: string) {
  const demoCase = getAllCases().find((candidate) => candidate.scenarioType === scenarioType);

  if (!demoCase) {
    throw new Error(`Unable to locate case for scenario "${scenarioType}".`);
  }

  return demoCase;
}

export function getCaseByTag(tag: string) {
  const demoCase = getAllCases().find((candidate) => candidate.tags.includes(tag));

  if (!demoCase) {
    throw new Error(`Unable to locate case with tag "${tag}".`);
  }

  return demoCase;
}

export function buildNoGuidanceCase(): CaseAlert {
  const baseCase = getAllCases()[0];

  return {
    ...baseCase.alert,
    caseId: "case-no-guidance",
    alertTriggerReason: "Glorb flux anomaly",
    analystNotes: "Zqxj plinth wobble snarp.",
    customer: {
      ...baseCase.alert.customer,
      customerId: "cust-no-guidance",
      customerName: "No Guidance",
      customerSegment: "Other",
      customerHomeCountry: "Nowhere",
      homeLocation: "Null Island, Nowhere",
      travelNoticeOnFile: false,
      accountHistoryNotes: "Blorf snarp qivet lorem.",
      analystNotes: "Zqxj plinth wobble snarp.",
    },
    transaction: {
      ...baseCase.alert.transaction,
      caseId: "case-no-guidance",
      transactionId: "txn-no-guidance",
      eventTime: "2026-03-18T12:00",
      amount: 111,
      channel: "Other",
      merchantName: "Obscure Kiosk",
      merchantCategory: "Flux Goods",
      merchantCountry: "Nowhere",
      transactionLocation: "Null Island, Nowhere",
      prior30dTxnCount: 1,
      prior24hTxnCount: 1,
      typicalTransactionAmount: 110,
    },
    device: {
      ...baseCase.alert.device,
      deviceId: "device-no-guidance",
      knownDevice: true,
      deviceAgeDays: 365,
    },
    merchant: {
      ...baseCase.alert.merchant,
      merchantName: "Obscure Kiosk",
      merchantCategory: "Flux Goods",
      merchantCountry: "Nowhere",
      knownMerchant: true,
    },
    geolocation: {
      transactionLocation: "Null Island, Nowhere",
      homeLocation: "Null Island, Nowhere",
      merchantCountry: "Nowhere",
      customerHomeCountry: "Nowhere",
    },
  };
}
