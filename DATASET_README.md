# Dataset Workflow

This demo uses a local, file-based case dataset workflow designed for explainable presentations rather than ML realism.

## Folder Structure

```text
data/
  cases/
    sample/
      demo-cases.json
    generated/
      generated-cases.json
    imported/
      imported-cases.json
      example-import.csv
      example-mapping.json
```

## Dataset Shape

Each dataset row is a `SampleCase`-style record with:

- `id`
- `label`
- `expectedOutcome`
- `expectedRiskTier`
- `description`
- `source`
- `scenarioType`
- `tags`
- `alert`

`alert` uses the richer `CaseAlert` model with:

- customer profile
- transaction event
- device context
- merchant context
- geolocation context

## Included Demo Data

The curated sample set covers:

- low-risk normal behavior
- cross-border anomalies
- rapid velocity bursts
- account takeover patterns
- new device + new merchant combinations
- travel-context mitigations
- false-positive style edge cases

The repository also includes generated cases and imported case examples.

## Generator

Use the synthetic generator to rebuild or extend the local demo dataset:

```bash
npm run generate:cases
```

Optional generated-case count:

```bash
node "scripts/generateSyntheticCases.mjs" --generated=25
```

Design goal:

- realistic enough to tell a credible story
- explicit enough to explain why a case scores low, medium, or high

## Loader Utilities

`src/lib/data/caseDataset.ts` exposes helpers for:

- listing cases
- filtering by source
- filtering by expected risk tier
- loading a random case
- loading by ID
- comparing two cases

This keeps the UI and tests on the same normalized dataset contract.

## CSV Import Workflow

Imported datasets should be adapted into the internal case schema rather than assumed to fit it.

Use:

```bash
npm run import:cases -- --input=data/cases/imported/example-import.csv --mapping=data/cases/imported/example-mapping.json
```

The mapping file uses internal field paths such as:

- `alert.customer.customerName`
- `alert.transaction.amount`
- `alert.device.knownDevice`
- `alert.geolocation.transactionLocation`

That makes the import layer generic enough for future external datasets without hardcoding Kaggle-specific column names.

## What Is And Is Not Covered

Covered:

- local JSON datasets
- generated synthetic scenarios
- CSV import via mapping
- shared schema validation through the app

Not covered:

- automatic external schema inference
- automatic deduplication or enrichment
- real-world transaction realism
- production-grade ETL pipelines
