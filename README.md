# Fraud Case Triage Agent

A simple but polished proof-of-concept web app that demonstrates how a GenAI-assisted fraud triage workflow could support fraud investigators.

This project is intentionally demo-oriented:

- It uses synthetic fraud alert data.
- It keeps rule-based detection logic visible and easy to explain.
- It optionally uses OpenAI to generate a more natural case summary.
- It keeps the human investigator in the loop for the final decision.

## What the app does

The app simulates a four-stage agent workflow:

1. `AlertIntakeAgent`
2. `RiskSignalDetectionAgent`
3. `RiskAssessmentAgent`
4. `CaseSummaryGenerator`

The UI lets you:

- load predefined synthetic sample alerts
- edit alert fields in a form
- submit an alert for triage
- review structured output, detected signals, risk level, next action, and generated summary

## Tech stack

- Next.js
- React
- Tailwind CSS
- Node.js API route
- OpenAI API for optional summary enhancement

## Folder structure

```text
fraud-case-triage-agent/
  src/
    app/
      api/triage/route.ts
      globals.css
      layout.tsx
      page.tsx
    components/
      FraudTriageWorkbench.tsx
      ui/
        RiskBadge.tsx
        WorkflowStepper.tsx
    data/
      sampleAlerts.ts
    lib/
      agents/
        AlertIntakeAgent.ts
        RiskSignalDetectionAgent.ts
        RiskAssessmentAgent.ts
        CaseSummaryGenerator.ts
      openai/
        generateCaseSummary.ts
      utils/
        fraudFormatting.ts
      triagePipeline.ts
    types/
      fraud.ts
  .env.example
  package.json
  README.md
```

## Main files

- `src/app/page.tsx`: main page entry
- `src/components/FraudTriageWorkbench.tsx`: polished single-page demo UI
- `src/app/api/triage/route.ts`: API endpoint that runs the workflow
- `src/lib/triagePipeline.ts`: orchestrates the four demo agents
- `src/lib/agents/AlertIntakeAgent.ts`: normalizes alert input
- `src/lib/agents/RiskSignalDetectionAgent.ts`: identifies suspicious fraud signals
- `src/lib/agents/RiskAssessmentAgent.ts`: assigns risk level and recommended action
- `src/lib/agents/CaseSummaryGenerator.ts`: creates investigator-friendly case narrative
- `src/data/sampleAlerts.ts`: synthetic example cases for demo use
- `src/types/fraud.ts`: shared data contracts

## Setup

## 1. Install Node.js

Install a current Node.js version first if it is not already available on your machine.

Recommended:

- Node.js 20 or newer

## 2. Install dependencies

From the project folder:

```bash
npm install
```

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

If no API key is provided, the app still works. It falls back to a local template-based case summary.

## 4. Run the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## How the logic works

The fraud decisioning logic is intentionally transparent and rule based.

Examples of signals:

- unusual location
- high transaction amount
- rapid transaction activity
- new merchant
- new device
- low account age
- abnormal amount relative to typical behavior

High-risk patterns include combinations such as:

- unusual international location plus high amount
- new device plus high amount
- several strong signals together

Mitigating context can reduce the score slightly. For example:

- travel-related history notes
- known device plus usual merchant

## OpenAI usage

OpenAI is used only for optional summary enhancement.

Core risk scoring remains in code so the workflow is easy to explain in a class presentation and does not depend entirely on the LLM.

## Sample demo cases

The app includes three starter examples:

1. Large foreign transaction: likely `High`
2. Small domestic normal behavior: likely `Low`
3. Traveling customer with location mismatch: likely `Low` or `Medium`

## POC limitations

- False positives can happen.
- Travel context may be incomplete or missing.
- Logic is simplified and not production-grade.
- The app is not suitable for real fraud operations without stronger controls, auditability, monitoring, and real data integrations.

## Notes for demo presentation

Helpful framing:

- This is a triage assistant, not an autonomous fraud decision-maker.
- It helps investigators review alerts faster and more consistently.
- Final disposition remains with the fraud investigator.
