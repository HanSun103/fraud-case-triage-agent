import { SampleCase } from "@/types/fraud";

export const sampleAlerts: SampleCase[] = [
  {
    id: "large-foreign-transaction",
    label: "High Risk: Large foreign transaction",
    expectedOutcome: "Likely High Risk",
    description:
      "Large cross-border purchase on a new device with low prior international activity.",
    alert: {
      customerName: "Jordan Lee",
      accountAgeDays: 45,
      homeLocation: "Toronto, Canada",
      transactionAmount: 2400,
      merchant: "Electronics World",
      transactionLocation: "Mexico City, Mexico",
      transactionTime: "2026-03-16T14:20",
      recentTransactionCount: 7,
      typicalTransactionAmount: 180,
      alertTriggerReason: "Unusual location + high amount",
      deviceStatus: "New",
      merchantFamiliarity: "New",
      accountHistoryNotes:
        "Customer typically transacts in Ontario. Low international activity in the past 12 months.",
    },
  },
  {
    id: "normal-domestic-transaction",
    label: "Low Risk: Normal domestic behavior",
    expectedOutcome: "Likely Low Risk",
    description:
      "Small in-pattern domestic transaction with a known device and usual merchant.",
    alert: {
      customerName: "Avery Smith",
      accountAgeDays: 620,
      homeLocation: "Vancouver, Canada",
      transactionAmount: 46,
      merchant: "Metro Grocery",
      transactionLocation: "Vancouver, Canada",
      transactionTime: "2026-03-16T09:15",
      recentTransactionCount: 2,
      typicalTransactionAmount: 52,
      alertTriggerReason: "Velocity threshold crossed",
      deviceStatus: "Known",
      merchantFamiliarity: "Usual",
      accountHistoryNotes:
        "Consistent domestic spend pattern. Regular grocery and transit purchases with the same device.",
    },
  },
  {
    id: "traveling-customer",
    label: "Medium/Low: Traveling customer",
    expectedOutcome: "False positive leaning Low or Medium",
    description:
      "Location mismatch alert on a trip where the customer history already hints at travel context.",
    alert: {
      customerName: "Morgan Patel",
      accountAgeDays: 410,
      homeLocation: "Toronto, Canada",
      transactionAmount: 210,
      merchant: "Airport Hotel",
      transactionLocation: "New York, USA",
      transactionTime: "2026-03-16T20:10",
      recentTransactionCount: 3,
      typicalTransactionAmount: 190,
      alertTriggerReason: "Location mismatch",
      deviceStatus: "Known",
      merchantFamiliarity: "New",
      accountHistoryNotes:
        "Customer called support about US travel this week. Moderate travel-related spend appears a few times each year.",
    },
  },
];
