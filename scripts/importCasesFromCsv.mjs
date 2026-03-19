import { readFile, writeFile } from "fs/promises";
import path from "path";

import { parse } from "csv-parse/sync";

const numberFields = new Set([
  "alert.customer.accountAgeDays",
  "alert.customer.priorChargebackCount",
  "alert.transaction.amount",
  "alert.transaction.prior30dTxnCount",
  "alert.transaction.prior24hTxnCount",
  "alert.transaction.typicalTransactionAmount",
  "alert.device.deviceAgeDays",
]);

const booleanFields = new Set([
  "alert.customer.travelNoticeOnFile",
  "alert.device.knownDevice",
  "alert.merchant.knownMerchant",
]);

function getArgument(name) {
  const argument = process.argv.find((value) => value.startsWith(`--${name}=`));
  return argument ? argument.split("=")[1] : null;
}

function toAbsolutePath(value) {
  return path.isAbsolute(value) ? value : path.join(process.cwd(), value);
}

function setPath(target, fieldPath, value) {
  const segments = fieldPath.split(".");
  let current = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    current[segment] ??= {};
    current = current[segment];
  }

  current[segments[segments.length - 1]] = value;
}

function coerceValue(fieldPath, value) {
  if (numberFields.has(fieldPath)) {
    return Number(value ?? 0);
  }

  if (booleanFields.has(fieldPath)) {
    return ["true", "1", "yes", "y"].includes(String(value).trim().toLowerCase());
  }

  return value ?? "";
}

function lookupValue(row, mappingValue) {
  if (Array.isArray(mappingValue)) {
    return mappingValue.map((key) => row[key]).find((value) => value !== undefined && value !== "");
  }

  return row[mappingValue];
}

function normalizeImportedRow(row, mappingConfig, index) {
  const output = structuredClone(mappingConfig.defaults ?? {});

  for (const [targetPath, sourceColumn] of Object.entries(mappingConfig.fieldMap ?? {})) {
    const rawValue = lookupValue(row, sourceColumn);

    if (rawValue === undefined) {
      continue;
    }

    setPath(output, targetPath, coerceValue(targetPath, rawValue));
  }

  output.id ??= `imported-case-${index + 1}`;
  output.label ??= `Imported case ${index + 1}`;
  output.description ??= "Imported external case.";
  output.expectedOutcome ??= "Imported case";
  output.expectedRiskTier ??= "Medium";
  output.source ??= "imported";
  output.scenarioType ??= "External import";
  output.tags ??= ["csv-import"];
  output.alert ??= {};
  output.alert.caseId ??= `case-${output.id}`;
  output.alert.alertSource ??= "Other";
  output.alert.alertTriggerReason ??= "Imported alert";
  output.alert.analystNotes ??= "";
  output.alert.customer ??= {};
  output.alert.customer.customerId ??= `cust-${output.id}`;
  output.alert.customer.customerName ??= output.label;
  output.alert.customer.customerSegment ??= "Other";
  output.alert.customer.customerHomeCountry ??= "Unknown";
  output.alert.customer.homeLocation ??= "Unknown";
  output.alert.customer.accountAgeDays ??= 0;
  output.alert.customer.priorChargebackCount ??= 0;
  output.alert.customer.travelNoticeOnFile ??= false;
  output.alert.customer.accountHistoryNotes ??= "";
  output.alert.customer.analystNotes ??= output.alert.analystNotes;
  output.alert.transaction ??= {};
  output.alert.transaction.caseId ??= output.alert.caseId;
  output.alert.transaction.transactionId ??= `txn-${output.id}`;
  output.alert.transaction.eventTime ??= "2026-03-18T12:00";
  output.alert.transaction.amount ??= 0;
  output.alert.transaction.currency ??= "CAD";
  output.alert.transaction.channel ??= "Other";
  output.alert.transaction.merchantName ??= "Unknown Merchant";
  output.alert.transaction.merchantCategory ??= "General Merchandise";
  output.alert.transaction.merchantCountry ??= "Unknown";
  output.alert.transaction.transactionLocation ??= output.alert.customer.homeLocation;
  output.alert.transaction.prior30dTxnCount ??= 0;
  output.alert.transaction.prior24hTxnCount ??= 0;
  output.alert.transaction.typicalTransactionAmount ??= 0;
  output.alert.device ??= {};
  output.alert.device.deviceId ??= `device-${output.id}`;
  output.alert.device.knownDevice ??= false;
  output.alert.device.deviceAgeDays ??= 0;
  output.alert.merchant ??= {};
  output.alert.merchant.merchantName ??= output.alert.transaction.merchantName;
  output.alert.merchant.merchantCategory ??= output.alert.transaction.merchantCategory;
  output.alert.merchant.merchantCountry ??= output.alert.transaction.merchantCountry;
  output.alert.merchant.knownMerchant ??= false;
  output.alert.geolocation ??= {};
  output.alert.geolocation.transactionLocation ??= output.alert.transaction.transactionLocation;
  output.alert.geolocation.homeLocation ??= output.alert.customer.homeLocation;
  output.alert.geolocation.merchantCountry ??= output.alert.transaction.merchantCountry;
  output.alert.geolocation.customerHomeCountry ??= output.alert.customer.customerHomeCountry;

  return output;
}

async function main() {
  const inputPath = getArgument("input");
  const mappingPath = getArgument("mapping");
  const outputPath =
    getArgument("output") ?? "data/cases/imported/imported-cases.json";

  if (!inputPath || !mappingPath) {
    throw new Error(
      'Usage: node "scripts/importCasesFromCsv.mjs" --input=path/to/file.csv --mapping=path/to/mapping.json [--output=data/cases/imported/imported-cases.json]',
    );
  }

  const [csvText, mappingText] = await Promise.all([
    readFile(toAbsolutePath(inputPath), "utf8"),
    readFile(toAbsolutePath(mappingPath), "utf8"),
  ]);
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const mappingConfig = JSON.parse(mappingText);
  const normalizedCases = rows.map((row, index) =>
    normalizeImportedRow(row, mappingConfig, index),
  );

  await writeFile(
    toAbsolutePath(outputPath),
    JSON.stringify(normalizedCases, null, 2),
    "utf8",
  );

  console.log(`Imported ${normalizedCases.length} cases to ${outputPath}.`);
}

main().catch((error) => {
  console.error("Unable to import cases from CSV.", error);
  process.exitCode = 1;
});
