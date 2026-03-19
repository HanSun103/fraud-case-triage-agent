import { DetectedSignal, StructuredAlert } from "@/types/fraud";

interface SignalDetectionResult {
  signals: DetectedSignal[];
  whyFlagged: string[];
  mitigatingFactors: string[];
}

function includesAny(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function isCrossBorder(transactionLocation: string, homeLocation: string) {
  const tx = transactionLocation.toLowerCase();
  const home = homeLocation.toLowerCase();

  if (tx === home) {
    return false;
  }

  const countries = [
    "canada",
    "usa",
    "united states",
    "mexico",
    "uk",
    "united kingdom",
    "france",
    "japan",
  ];

  const txCountry = countries.find((country) => tx.includes(country));
  const homeCountry = countries.find((country) => home.includes(country));

  if (txCountry && homeCountry) {
    return txCountry !== homeCountry;
  }

  return !tx.includes(home.split(",")[0]?.trim() ?? "");
}

// Step 2 applies transparent, readable fraud heuristics to flag suspicious signals.
export function RiskSignalDetectionAgent(
  structuredAlert: StructuredAlert,
): SignalDetectionResult {
  const signals: DetectedSignal[] = [];
  const whyFlagged: string[] = [structuredAlert.alertTrigger];
  const mitigatingFactors: string[] = [];

  const amountRatio =
    structuredAlert.typicalTransactionAmount > 0
      ? structuredAlert.transactionAmount / structuredAlert.typicalTransactionAmount
      : 1;

  const crossBorder = isCrossBorder(
    structuredAlert.transactionLocation,
    structuredAlert.homeLocation,
  );

  const historyNotes = structuredAlert.accountHistory.toLowerCase();
  const travelContext =
    structuredAlert.travelNoticeOnFile ||
    includesAny(historyNotes, [
      "travel",
      "travelling",
      "traveling",
      "trip",
      "vacation",
      "airport",
    ]);

  if (crossBorder) {
    signals.push({
      id: "unusual-location",
      title: "Unusual location",
      explanation:
        "The transaction location differs from the customer's usual home market.",
      severity: travelContext ? "moderate" : "strong",
    });
    whyFlagged.push("Transaction took place outside the customer's usual geography.");
  }

  if (structuredAlert.transactionAmount >= 2000 || amountRatio >= 3) {
    signals.push({
      id: "high-transaction-amount",
      title: "High transaction amount",
      explanation:
        "The transaction value is materially above the customer's typical spend.",
      severity: "strong",
    });
    whyFlagged.push("Transaction amount is significantly above baseline behavior.");
  } else if (structuredAlert.transactionAmount >= 750 || amountRatio >= 1.8) {
    signals.push({
      id: "elevated-transaction-amount",
      title: "Higher-than-normal transaction amount",
      explanation:
        "The amount is elevated relative to the customer's usual transaction size.",
      severity: "moderate",
    });
  }

  if (structuredAlert.recentTransactionCount >= 6) {
    signals.push({
      id: "rapid-transaction-activity",
      title: "Rapid transaction activity",
      explanation:
        "The account shows unusually high recent transaction frequency.",
      severity: "strong",
    });
    whyFlagged.push("Recent transaction velocity is elevated.");
  } else if (structuredAlert.recentTransactionCount >= 4) {
    signals.push({
      id: "elevated-volume",
      title: "Abnormal recent transaction volume",
      explanation: "Recent transaction count is slightly above normal expectations.",
      severity: "moderate",
    });
  }

  if (!structuredAlert.knownMerchant) {
    signals.push({
      id: "new-merchant",
      title: "New merchant",
      explanation:
        "The transaction occurred with a merchant that is not part of the customer's usual pattern.",
      severity: "moderate",
    });
  }

  if (!structuredAlert.knownDevice) {
    signals.push({
      id: "new-device",
      title: "New device",
      explanation:
        "The transaction was initiated from a device not previously associated with the account.",
      severity: "strong",
    });
    whyFlagged.push("The alert originated from a newly observed device.");
  }

  if (structuredAlert.accountAgeDays <= 90) {
    signals.push({
      id: "low-account-age",
      title: "Low account age",
      explanation:
        "Newer accounts often carry more uncertainty and less stable behavioral history.",
      severity: "moderate",
    });
  }

  if (travelContext) {
    mitigatingFactors.push(
      "Account history suggests travel context may explain the location mismatch.",
    );
  }

  if (
    !signals.length &&
    structuredAlert.knownDevice &&
    structuredAlert.knownMerchant
  ) {
    mitigatingFactors.push(
      "Known device and usual merchant both align with established customer behavior.",
    );
  }

  return { signals, whyFlagged, mitigatingFactors };
}
