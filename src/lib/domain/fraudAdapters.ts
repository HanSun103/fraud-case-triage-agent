import {
  AlertSource,
  CaseAlert,
  DeviceStatus,
  FraudAlertInput,
  FraudTriageRequest,
  MerchantFamiliarity,
  StructuredAlert,
} from "@/types/fraud";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractCountry(location: string) {
  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.at(-1) ?? "Unknown";
}

function deriveDeviceStatus(knownDevice: boolean): DeviceStatus {
  return knownDevice ? "Known" : "New";
}

function deriveMerchantFamiliarity(knownMerchant: boolean): MerchantFamiliarity {
  return knownMerchant ? "Usual" : "New";
}

function detectTravelNotice(notes: string) {
  return /(travel|travelling|traveling|trip|vacation|airport)/i.test(notes);
}

function createCaseId(input: FraudAlertInput) {
  const customer = slugify(input.customerName) || "customer";
  const eventTime = slugify(input.transactionTime) || "event";

  return `case-${customer}-${eventTime}`;
}

function createTransactionId(input: FraudAlertInput) {
  const merchant = slugify(input.merchant) || "merchant";
  const eventTime = slugify(input.transactionTime) || "event";

  return `txn-${merchant}-${eventTime}`;
}

function inferAlertSource(triggerReason: string): AlertSource {
  const normalized = triggerReason.toLowerCase();

  if (normalized.includes("velocity")) {
    return "Velocity Rule";
  }

  if (normalized.includes("location")) {
    return "Location Rule";
  }

  return "Rules Engine";
}

export function isCaseAlert(input: FraudTriageRequest): input is CaseAlert {
  return "customer" in input && "transaction" in input && "device" in input;
}

export function toCaseAlert(input: FraudTriageRequest): CaseAlert {
  if (isCaseAlert(input)) {
    return input;
  }

  const customerHomeCountry = extractCountry(input.homeLocation);
  const merchantCountry = extractCountry(input.transactionLocation);

  return {
    caseId: createCaseId(input),
    alertSource: inferAlertSource(input.alertTriggerReason),
    alertTriggerReason: input.alertTriggerReason,
    analystNotes: input.accountHistoryNotes,
    customer: {
      customerId: `cust-${slugify(input.customerName) || "demo"}`,
      customerName: input.customerName,
      customerSegment: "Mass Retail",
      customerHomeCountry,
      homeLocation: input.homeLocation,
      accountAgeDays: Number(input.accountAgeDays) || 0,
      priorChargebackCount: 0,
      travelNoticeOnFile: detectTravelNotice(input.accountHistoryNotes),
      accountHistoryNotes: input.accountHistoryNotes,
      analystNotes: input.accountHistoryNotes,
    },
    transaction: {
      caseId: createCaseId(input),
      transactionId: createTransactionId(input),
      eventTime: input.transactionTime,
      amount: Number(input.transactionAmount) || 0,
      currency: "CAD",
      channel: "Card Not Present",
      merchantName: input.merchant,
      merchantCategory: "General Merchandise",
      merchantCountry,
      transactionLocation: input.transactionLocation,
      prior30dTxnCount: Number(input.recentTransactionCount) || 0,
      prior24hTxnCount: Number(input.recentTransactionCount) || 0,
      typicalTransactionAmount: Number(input.typicalTransactionAmount) || 0,
    },
    device: {
      deviceId: `device-${slugify(input.customerName) || "demo"}`,
      knownDevice: input.deviceStatus === "Known",
      deviceAgeDays: input.deviceStatus === "Known" ? 180 : 0,
    },
    merchant: {
      merchantName: input.merchant,
      merchantCategory: "General Merchandise",
      merchantCountry,
      knownMerchant: input.merchantFamiliarity === "Usual",
    },
    geolocation: {
      transactionLocation: input.transactionLocation,
      homeLocation: input.homeLocation,
      merchantCountry,
      customerHomeCountry,
    },
  };
}

export function toLegacyFraudAlertInput(caseAlert: CaseAlert): FraudAlertInput {
  return {
    customerName: caseAlert.customer.customerName,
    accountAgeDays: caseAlert.customer.accountAgeDays,
    homeLocation: caseAlert.geolocation.homeLocation,
    transactionAmount: caseAlert.transaction.amount,
    merchant: caseAlert.merchant.merchantName,
    transactionLocation: caseAlert.geolocation.transactionLocation,
    transactionTime: caseAlert.transaction.eventTime,
    recentTransactionCount:
      caseAlert.transaction.prior24hTxnCount || caseAlert.transaction.prior30dTxnCount,
    typicalTransactionAmount: caseAlert.transaction.typicalTransactionAmount,
    alertTriggerReason: caseAlert.alertTriggerReason,
    deviceStatus: deriveDeviceStatus(caseAlert.device.knownDevice),
    merchantFamiliarity: deriveMerchantFamiliarity(caseAlert.merchant.knownMerchant),
    accountHistoryNotes:
      caseAlert.customer.accountHistoryNotes || caseAlert.analystNotes || "",
  };
}

export function mergeLegacyFraudAlertInput(
  baseCaseAlert: CaseAlert,
  input: FraudAlertInput,
): CaseAlert {
  const normalizedInput = toCaseAlert(input);

  return {
    ...baseCaseAlert,
    alertTriggerReason: input.alertTriggerReason,
    analystNotes: input.accountHistoryNotes,
    customer: {
      ...baseCaseAlert.customer,
      customerName: input.customerName,
      homeLocation: input.homeLocation,
      customerHomeCountry: extractCountry(input.homeLocation),
      accountAgeDays: Number(input.accountAgeDays) || 0,
      travelNoticeOnFile: detectTravelNotice(input.accountHistoryNotes),
      accountHistoryNotes: input.accountHistoryNotes,
      analystNotes: input.accountHistoryNotes,
    },
    transaction: {
      ...baseCaseAlert.transaction,
      eventTime: input.transactionTime,
      amount: Number(input.transactionAmount) || 0,
      merchantName: input.merchant,
      merchantCategory:
        baseCaseAlert.transaction.merchantCategory ||
        normalizedInput.transaction.merchantCategory,
      merchantCountry: extractCountry(input.transactionLocation),
      transactionLocation: input.transactionLocation,
      prior30dTxnCount: Number(input.recentTransactionCount) || 0,
      prior24hTxnCount: Number(input.recentTransactionCount) || 0,
      typicalTransactionAmount: Number(input.typicalTransactionAmount) || 0,
    },
    device: {
      ...baseCaseAlert.device,
      knownDevice: input.deviceStatus === "Known",
      deviceAgeDays:
        input.deviceStatus === "Known" ? Math.max(baseCaseAlert.device.deviceAgeDays, 1) : 0,
    },
    merchant: {
      ...baseCaseAlert.merchant,
      merchantName: input.merchant,
      merchantCountry: extractCountry(input.transactionLocation),
      knownMerchant: input.merchantFamiliarity === "Usual",
    },
    geolocation: {
      ...baseCaseAlert.geolocation,
      transactionLocation: input.transactionLocation,
      homeLocation: input.homeLocation,
      merchantCountry: extractCountry(input.transactionLocation),
      customerHomeCountry: extractCountry(input.homeLocation),
    },
  };
}

export function toStructuredAlert(caseAlert: CaseAlert): StructuredAlert {
  return {
    caseId: caseAlert.caseId,
    transactionId: caseAlert.transaction.transactionId,
    eventTime: caseAlert.transaction.eventTime,
    transactionTime: caseAlert.transaction.eventTime,
    amount: caseAlert.transaction.amount,
    transactionAmount: caseAlert.transaction.amount,
    currency: caseAlert.transaction.currency,
    channel: caseAlert.transaction.channel,
    merchant: caseAlert.merchant.merchantName,
    merchantCategory: caseAlert.merchant.merchantCategory,
    merchantCountry: caseAlert.merchant.merchantCountry,
    transactionLocation: caseAlert.geolocation.transactionLocation,
    homeLocation: caseAlert.geolocation.homeLocation,
    customerHomeCountry: caseAlert.geolocation.customerHomeCountry,
    alertTrigger: caseAlert.alertTriggerReason,
    alertSource: caseAlert.alertSource,
    knownDevice: caseAlert.device.knownDevice,
    deviceAgeDays: caseAlert.device.deviceAgeDays,
    knownMerchant: caseAlert.merchant.knownMerchant,
    prior30dTxnCount: caseAlert.transaction.prior30dTxnCount,
    prior24hTxnCount: caseAlert.transaction.prior24hTxnCount,
    recentTransactionCount:
      caseAlert.transaction.prior24hTxnCount || caseAlert.transaction.prior30dTxnCount,
    priorChargebackCount: caseAlert.customer.priorChargebackCount,
    accountAgeDays: caseAlert.customer.accountAgeDays,
    typicalTransactionAmount: caseAlert.transaction.typicalTransactionAmount,
    travelNoticeOnFile: caseAlert.customer.travelNoticeOnFile,
    customerSegment: caseAlert.customer.customerSegment,
    accountHistory: caseAlert.customer.accountHistoryNotes,
    analystNotes: caseAlert.analystNotes,
    customerName: caseAlert.customer.customerName,
    deviceStatus: deriveDeviceStatus(caseAlert.device.knownDevice),
    merchantFamiliarity: deriveMerchantFamiliarity(caseAlert.merchant.knownMerchant),
  };
}
