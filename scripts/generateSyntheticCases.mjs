import { mkdir, writeFile } from "fs/promises";
import path from "path";

const rootDir = process.cwd();
const sampleOutputPath = path.join(rootDir, "data", "cases", "sample", "demo-cases.json");
const generatedOutputPath = path.join(
  rootDir,
  "data",
  "cases",
  "generated",
  "generated-cases.json",
);
const importedOutputPath = path.join(
  rootDir,
  "data",
  "cases",
  "imported",
  "imported-cases.json",
);

const customerNames = [
  "Jordan Lee",
  "Avery Smith",
  "Morgan Patel",
  "Taylor Nguyen",
  "Riley Chen",
  "Casey Brown",
  "Jamie Wilson",
  "Quinn Davis",
  "Alex Martin",
  "Robin Taylor",
  "Drew Thompson",
  "Skyler Hall",
];

const domesticLocations = [
  { city: "Toronto", country: "Canada" },
  { city: "Vancouver", country: "Canada" },
  { city: "Calgary", country: "Canada" },
  { city: "Ottawa", country: "Canada" },
];

const foreignLocations = [
  { city: "New York", country: "USA" },
  { city: "Miami", country: "USA" },
  { city: "Mexico City", country: "Mexico" },
  { city: "London", country: "United Kingdom" },
  { city: "Paris", country: "France" },
  { city: "Tokyo", country: "Japan" },
];

const routineMerchants = [
  { name: "Metro Grocery", category: "Grocery" },
  { name: "City Transit", category: "Transit" },
  { name: "Neighborhood Pharmacy", category: "Pharmacy" },
  { name: "Corner Cafe", category: "Dining" },
];

const highRiskMerchants = [
  { name: "Electronics World", category: "Electronics" },
  { name: "Luxury Outlet", category: "Luxury Goods" },
  { name: "Fast Cash Transfers", category: "Money Transfer" },
  { name: "Airport Hotel", category: "Travel" },
];

function parseArg(name, fallbackValue) {
  const argument = process.argv.find((value) => value.startsWith(`--${name}=`));
  if (!argument) {
    return fallbackValue;
  }

  const [, rawValue] = argument.split("=");
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isoTime(dayOffset, hour, minute) {
  const date = new Date(Date.UTC(2026, 2, 18 + dayOffset, hour, minute, 0, 0));
  return date.toISOString().slice(0, 16);
}

function locationLabel(location) {
  return `${location.city}, ${location.country}`;
}

function buildCase({
  id,
  label,
  description,
  expectedRiskTier,
  scenarioType,
  tags,
  customerName,
  home,
  merchant,
  txLocation,
  amount,
  typicalAmount,
  prior30dTxnCount,
  prior24hTxnCount,
  accountAgeDays,
  priorChargebackCount,
  knownDevice,
  deviceAgeDays,
  knownMerchant,
  travelNoticeOnFile,
  customerSegment,
  alertTriggerReason,
  alertSource = "Demo Scenario",
  analystNotes,
  accountHistoryNotes,
  channel = "Card Not Present",
  source = "sample",
}) {
  const caseId = `case-${id}`;
  const transactionId = `txn-${id}`;
  const eventTime = isoTime(id.length, 8 + (id.length % 10), 10 + (id.length % 40));
  const expectedOutcome = `Likely ${expectedRiskTier} Risk`;

  return {
    id,
    label,
    expectedOutcome,
    expectedRiskTier,
    description,
    source,
    scenarioType,
    tags,
    alert: {
      caseId,
      alertSource,
      alertTriggerReason,
      analystNotes,
      customer: {
        customerId: `cust-${slugify(customerName)}`,
        customerName,
        customerSegment,
        customerHomeCountry: home.country,
        homeLocation: locationLabel(home),
        accountAgeDays,
        priorChargebackCount,
        travelNoticeOnFile,
        accountHistoryNotes,
        analystNotes,
      },
      transaction: {
        caseId,
        transactionId,
        eventTime,
        amount,
        currency: "CAD",
        channel,
        merchantName: merchant.name,
        merchantCategory: merchant.category,
        merchantCountry: txLocation.country,
        transactionLocation: locationLabel(txLocation),
        prior30dTxnCount,
        prior24hTxnCount,
        typicalTransactionAmount: typicalAmount,
      },
      device: {
        deviceId: `device-${slugify(customerName)}-${slugify(merchant.name)}`,
        knownDevice,
        deviceAgeDays,
      },
      merchant: {
        merchantName: merchant.name,
        merchantCategory: merchant.category,
        merchantCountry: txLocation.country,
        knownMerchant,
      },
      geolocation: {
        transactionLocation: locationLabel(txLocation),
        homeLocation: locationLabel(home),
        merchantCountry: txLocation.country,
        customerHomeCountry: home.country,
      },
    },
  };
}

function pick(values, index) {
  return values[index % values.length];
}

function buildRoutineCase(index, source = "sample") {
  const customerName = pick(customerNames, index);
  const home = pick(domesticLocations, index);
  const merchant = pick(routineMerchants, index);

  return buildCase({
    id: `routine-${index + 1}`,
    label: `Low Risk: Routine domestic spend ${index + 1}`,
    description: "Known device, usual merchant, and in-pattern domestic activity.",
    expectedRiskTier: "Low",
    scenarioType: "Low-risk normal behavior",
    tags: ["routine", "known-device", "usual-merchant", "domestic"],
    customerName,
    home,
    merchant,
    txLocation: home,
    amount: 30 + index * 12,
    typicalAmount: 45 + index * 10,
    prior30dTxnCount: 2 + (index % 2),
    prior24hTxnCount: 1 + (index % 2),
    accountAgeDays: 220 + index * 35,
    priorChargebackCount: 0,
    knownDevice: true,
    deviceAgeDays: 120 + index * 40,
    knownMerchant: true,
    travelNoticeOnFile: false,
    customerSegment: "Mass Retail",
    alertTriggerReason: "Velocity threshold crossed",
    analystNotes: "Routine spend pattern aligned with historical domestic behavior.",
    accountHistoryNotes:
      "Customer regularly uses the same device at familiar local merchants with low dispute activity.",
    channel: index % 2 === 0 ? "Card Present" : "Mobile",
    source,
  });
}

function buildCrossBorderCase(index, source = "sample") {
  const customerName = pick(customerNames, index + 2);
  const home = pick(domesticLocations, index);
  const merchant = pick(highRiskMerchants, index);
  const txLocation = pick(foreignLocations, index);

  return buildCase({
    id: `cross-border-${index + 1}`,
    label: `High Risk: Cross-border anomaly ${index + 1}`,
    description: "Foreign transaction with elevated amount and weak historical support.",
    expectedRiskTier: "High",
    scenarioType: "Cross-border anomalies",
    tags: ["cross-border", "high-amount", "new-device", "new-merchant"],
    customerName,
    home,
    merchant,
    txLocation,
    amount: 1600 + index * 350,
    typicalAmount: 180 + index * 25,
    prior30dTxnCount: 6 + index,
    prior24hTxnCount: 4 + (index % 3),
    accountAgeDays: 35 + index * 20,
    priorChargebackCount: index % 2,
    knownDevice: false,
    deviceAgeDays: 0,
    knownMerchant: false,
    travelNoticeOnFile: false,
    customerSegment: "Mass Retail",
    alertTriggerReason: "Unusual location + high amount",
    analystNotes: "Limited prior international activity and no travel notice located.",
    accountHistoryNotes:
      "Customer typically transacts domestically with modest average ticket size and low foreign activity.",
    source,
  });
}

function buildVelocityCase(index, source = "sample") {
  const customerName = pick(customerNames, index + 4);
  const home = pick(domesticLocations, index + 1);
  const merchant = pick(highRiskMerchants, index + 1);

  return buildCase({
    id: `velocity-${index + 1}`,
    label: `Medium/High: Velocity burst ${index + 1}`,
    description: "Rapid repeat activity that compresses multiple transactions into a short window.",
    expectedRiskTier: index % 2 === 0 ? "High" : "Medium",
    scenarioType: "Rapid velocity bursts",
    tags: ["velocity", "rapid-transactions", "burst-pattern"],
    customerName,
    home,
    merchant,
    txLocation: home,
    amount: 280 + index * 90,
    typicalAmount: 85 + index * 10,
    prior30dTxnCount: 10 + index * 2,
    prior24hTxnCount: 6 + index,
    accountAgeDays: 150 + index * 28,
    priorChargebackCount: 0,
    knownDevice: index % 2 === 0 ? false : true,
    deviceAgeDays: index % 2 === 0 ? 0 : 180,
    knownMerchant: false,
    travelNoticeOnFile: false,
    customerSegment: "Mass Retail",
    alertTriggerReason: "Rapid transaction burst",
    analystNotes: "Transaction cadence accelerated sharply compared with the prior week.",
    accountHistoryNotes:
      "Customer generally uses the account a few times per week. Current same-day volume is unusual.",
    channel: "Online",
    source,
  });
}

function buildAccountTakeoverCase(index, source = "sample") {
  const customerName = pick(customerNames, index + 6);
  const home = pick(domesticLocations, index + 2);
  const merchant = pick(highRiskMerchants, index + 2);
  const txLocation = index % 2 === 0 ? pick(foreignLocations, index + 2) : home;

  return buildCase({
    id: `account-takeover-${index + 1}`,
    label: `High Risk: Account takeover pattern ${index + 1}`,
    description: "New-device behavior combined with abrupt change in spend and profile confidence.",
    expectedRiskTier: "High",
    scenarioType: "Account takeover patterns",
    tags: ["account-takeover", "new-device", "chargeback-history", "manual-review"],
    customerName,
    home,
    merchant,
    txLocation,
    amount: 950 + index * 210,
    typicalAmount: 120 + index * 15,
    prior30dTxnCount: 8 + index,
    prior24hTxnCount: 5 + (index % 2),
    accountAgeDays: 90 + index * 18,
    priorChargebackCount: 1 + (index % 2),
    knownDevice: false,
    deviceAgeDays: 0,
    knownMerchant: false,
    travelNoticeOnFile: false,
    customerSegment: index % 2 === 0 ? "Mass Retail" : "Affluent",
    alertTriggerReason: "Account access anomaly",
    analystNotes: "Device mismatch and elevated spend suggest possible account compromise.",
    accountHistoryNotes:
      "Customer usually transacts on a long-standing device and rarely exceeds baseline spend limits.",
    channel: "Mobile",
    source,
  });
}

function buildNewDeviceMerchantCase(index, source = "sample") {
  const customerName = pick(customerNames, index + 8);
  const home = pick(domesticLocations, index + 3);
  const merchant = pick(highRiskMerchants, index + 3);

  return buildCase({
    id: `new-device-merchant-${index + 1}`,
    label: `Medium/High: New device and merchant ${index + 1}`,
    description: "Fresh device activity paired with first-time merchant usage.",
    expectedRiskTier: index % 2 === 0 ? "High" : "Medium",
    scenarioType: "New device + new merchant combinations",
    tags: ["new-device", "new-merchant", "behavior-shift"],
    customerName,
    home,
    merchant,
    txLocation: home,
    amount: 540 + index * 120,
    typicalAmount: 110 + index * 8,
    prior30dTxnCount: 4 + index,
    prior24hTxnCount: 2 + (index % 3),
    accountAgeDays: 140 + index * 25,
    priorChargebackCount: 0,
    knownDevice: false,
    deviceAgeDays: 0,
    knownMerchant: false,
    travelNoticeOnFile: false,
    customerSegment: "Mass Retail",
    alertTriggerReason: "New device + new merchant",
    analystNotes: "Current merchant and device have no prior match in known customer behavior.",
    accountHistoryNotes:
      "Customer usually spends with recurring merchants using a previously registered device.",
    channel: "Online",
    source,
  });
}

function buildTravelMitigationCase(index, source = "sample") {
  const customerName = pick(customerNames, index + 1);
  const home = pick(domesticLocations, index);
  const merchant = pick(highRiskMerchants, index + 1);
  const txLocation = pick(foreignLocations, index + 1);

  return buildCase({
    id: `travel-mitigation-${index + 1}`,
    label: `Low/Medium: Travel context ${index + 1}`,
    description: "Location mismatch moderated by a plausible travel explanation and known behavior.",
    expectedRiskTier: index % 2 === 0 ? "Low" : "Medium",
    scenarioType: "Travel-context mitigations",
    tags: ["travel", "location-mismatch", "mitigation", "known-device"],
    customerName,
    home,
    merchant,
    txLocation,
    amount: 190 + index * 35,
    typicalAmount: 170 + index * 20,
    prior30dTxnCount: 3 + index,
    prior24hTxnCount: 2 + (index % 2),
    accountAgeDays: 260 + index * 30,
    priorChargebackCount: 0,
    knownDevice: true,
    deviceAgeDays: 260 + index * 20,
    knownMerchant: index % 2 === 0,
    travelNoticeOnFile: true,
    customerSegment: "Traveling Customer",
    alertTriggerReason: "Location mismatch",
    analystNotes: "Travel notice is on file and prior travel spend has been legitimate.",
    accountHistoryNotes:
      "Customer reported travel this week and shows recurring travel spend patterns several times each year.",
    channel: "Card Not Present",
    source,
  });
}

function buildFalsePositiveCase(index, source = "sample") {
  const customerName = pick(customerNames, index + 3);
  const home = pick(domesticLocations, index + 2);
  const merchant = pick(routineMerchants, index + 2);

  return buildCase({
    id: `false-positive-${index + 1}`,
    label: `Low/Medium: False-positive edge case ${index + 1}`,
    description: "A narrow anomaly exists, but the surrounding context mostly fits expected behavior.",
    expectedRiskTier: index % 2 === 0 ? "Low" : "Medium",
    scenarioType: "False-positive style edge cases",
    tags: ["false-positive", "edge-case", "manual-review"],
    customerName,
    home,
    merchant,
    txLocation: home,
    amount: 280 + index * 40,
    typicalAmount: 190 + index * 28,
    prior30dTxnCount: 3 + index,
    prior24hTxnCount: 1 + (index % 2),
    accountAgeDays: 320 + index * 45,
    priorChargebackCount: 0,
    knownDevice: true,
    deviceAgeDays: 365,
    knownMerchant: true,
    travelNoticeOnFile: false,
    customerSegment: "Mass Retail",
    alertTriggerReason: "Amount slightly above baseline",
    analystNotes: "Current transaction is elevated but still consistent with merchant and device history.",
    accountHistoryNotes:
      "Customer occasionally makes moderate one-off purchases at familiar domestic merchants without dispute activity.",
    channel: index % 2 === 0 ? "Card Present" : "Mobile",
    source,
  });
}

function buildSampleCases() {
  return [
    ...Array.from({ length: 5 }, (_, index) => buildRoutineCase(index)),
    ...Array.from({ length: 5 }, (_, index) => buildCrossBorderCase(index)),
    ...Array.from({ length: 5 }, (_, index) => buildVelocityCase(index)),
    ...Array.from({ length: 5 }, (_, index) => buildAccountTakeoverCase(index)),
    ...Array.from({ length: 5 }, (_, index) => buildNewDeviceMerchantCase(index)),
    ...Array.from({ length: 5 }, (_, index) => buildTravelMitigationCase(index)),
    ...Array.from({ length: 5 }, (_, index) => buildFalsePositiveCase(index)),
  ];
}

function buildGeneratedCases(count) {
  const factories = [
    buildRoutineCase,
    buildCrossBorderCase,
    buildVelocityCase,
    buildAccountTakeoverCase,
    buildNewDeviceMerchantCase,
    buildTravelMitigationCase,
    buildFalsePositiveCase,
  ];

  return Array.from({ length: count }, (_, index) => {
    const factory = factories[index % factories.length];
    const generatedCase = factory(index + 10, "generated");

    return {
      ...generatedCase,
      id: `generated-${generatedCase.id}`,
      label: generatedCase.label.replace(": ", ": Generated "),
      alert: {
        ...generatedCase.alert,
        caseId: `case-generated-${generatedCase.id}`,
        transaction: {
          ...generatedCase.alert.transaction,
          caseId: `case-generated-${generatedCase.id}`,
          transactionId: `txn-generated-${generatedCase.id}`,
        },
      },
    };
  });
}

async function writeJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

async function main() {
  const generatedCount = parseArg("generated", 14);
  const sampleCases = buildSampleCases();
  const generatedCases = buildGeneratedCases(generatedCount);

  await Promise.all([
    writeJson(sampleOutputPath, sampleCases),
    writeJson(generatedOutputPath, generatedCases),
    writeJson(importedOutputPath, []),
  ]);

  console.log(
    `Generated ${sampleCases.length} curated sample cases and ${generatedCases.length} generated cases.`,
  );
}

main().catch((error) => {
  console.error("Unable to generate synthetic cases.", error);
  process.exitCode = 1;
});
