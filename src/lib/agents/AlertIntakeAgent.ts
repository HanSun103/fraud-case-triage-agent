import { FraudAlertInput, StructuredAlert } from "@/types/fraud";

// Step 1 normalizes raw alert input into a consistent structure for downstream agents.
export function AlertIntakeAgent(input: FraudAlertInput): StructuredAlert {
  return {
    customerName: input.customerName.trim(),
    transactionAmount: Number(input.transactionAmount) || 0,
    merchant: input.merchant.trim(),
    transactionLocation: input.transactionLocation.trim(),
    transactionTime: input.transactionTime,
    homeLocation: input.homeLocation.trim(),
    alertTrigger: input.alertTriggerReason.trim(),
    deviceStatus: input.deviceStatus,
    merchantFamiliarity: input.merchantFamiliarity,
    recentTransactionCount: Number(input.recentTransactionCount) || 0,
    accountAgeDays: Number(input.accountAgeDays) || 0,
    typicalTransactionAmount: Number(input.typicalTransactionAmount) || 0,
    accountHistory: input.accountHistoryNotes.trim(),
  };
}
