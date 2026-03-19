import { toCaseAlert, toStructuredAlert } from "@/lib/domain/fraudAdapters";
import { FraudTriageRequest, StructuredAlert } from "@/types/fraud";

// Step 1 normalizes raw alert input into a consistent structure for downstream agents.
export function AlertIntakeAgent(input: FraudTriageRequest): StructuredAlert {
  const caseAlert = toCaseAlert(input);

  return toStructuredAlert({
    ...caseAlert,
    alertTriggerReason: caseAlert.alertTriggerReason.trim(),
    analystNotes: caseAlert.analystNotes.trim(),
    customer: {
      ...caseAlert.customer,
      customerName: caseAlert.customer.customerName.trim(),
      homeLocation: caseAlert.customer.homeLocation.trim(),
      customerHomeCountry: caseAlert.customer.customerHomeCountry.trim(),
      accountHistoryNotes: caseAlert.customer.accountHistoryNotes.trim(),
      analystNotes: caseAlert.customer.analystNotes.trim(),
    },
    transaction: {
      ...caseAlert.transaction,
      merchantName: caseAlert.transaction.merchantName.trim(),
      merchantCategory: caseAlert.transaction.merchantCategory.trim(),
      merchantCountry: caseAlert.transaction.merchantCountry.trim(),
      transactionLocation: caseAlert.transaction.transactionLocation.trim(),
      amount: Number(caseAlert.transaction.amount) || 0,
      prior30dTxnCount: Number(caseAlert.transaction.prior30dTxnCount) || 0,
      prior24hTxnCount: Number(caseAlert.transaction.prior24hTxnCount) || 0,
      typicalTransactionAmount: Number(caseAlert.transaction.typicalTransactionAmount) || 0,
    },
    merchant: {
      ...caseAlert.merchant,
      merchantName: caseAlert.merchant.merchantName.trim(),
      merchantCategory: caseAlert.merchant.merchantCategory.trim(),
      merchantCountry: caseAlert.merchant.merchantCountry.trim(),
    },
    geolocation: {
      ...caseAlert.geolocation,
      transactionLocation: caseAlert.geolocation.transactionLocation.trim(),
      homeLocation: caseAlert.geolocation.homeLocation.trim(),
      merchantCountry: caseAlert.geolocation.merchantCountry.trim(),
      customerHomeCountry: caseAlert.geolocation.customerHomeCountry.trim(),
    },
    device: {
      ...caseAlert.device,
      deviceAgeDays: Number(caseAlert.device.deviceAgeDays) || 0,
    },
  });
}
