# Fraud Triage Demo Upgrade Plan

## Goal

Upgrade the current Next.js + TypeScript proof-of-concept into a more polished, traceable multi-agent suspicious activity / fraud triage demo while keeping it:

- easy to explain in a live demo or class presentation
- reliable even when external APIs fail
- practical for a student project
- transparent about how decisions are made

This plan does **not** assume production infrastructure such as real banking integrations, queues, databases, or enterprise observability.

## Current State

### Architecture

The current app is a compact single-page Next.js App Router demo with one server API route and one main client workbench.

- `src/app/page.tsx` renders a single page UI
- `src/components/FraudTriageWorkbench.tsx` contains the full interactive workbench
- `src/app/api/triage/route.ts` accepts alert input and returns the triage result
- `src/lib/triagePipeline.ts` orchestrates the current four-step pipeline
- `src/lib/agents/*` contains the agent-style functions
- `src/lib/openai/generateCaseSummary.ts` handles optional OpenAI summary generation
- `src/data/sampleAlerts.ts` provides the full demo dataset

The current architecture is simple and readable:

1. client form collects or loads a synthetic alert
2. browser sends the alert to `/api/triage`
3. server runs a rule-based pipeline
4. server optionally asks OpenAI for a narrative summary
5. UI renders the output

### Current Data Flow

Current data flow is strictly request-response and entirely in memory.

1. A sample alert is loaded or edited in the browser.
2. The client posts a `FraudAlertInput` payload to `/api/triage`.
3. `AlertIntakeAgent` normalizes the raw input into `StructuredAlert`.
4. `RiskSignalDetectionAgent` identifies suspicious signals and mitigating factors.
5. `RiskAssessmentAgent` computes a numeric score, risk level, and recommended action.
6. `CaseSummaryGenerator` creates a human-readable narrative, optionally using OpenAI.
7. The server returns a `TriageResult`.
8. The UI displays structured alert details, detected signals, risk score, recommendation, summary, and caveats.

There is no persistence, trace log, run history, or retrieval step.

### Current Scoring / Rule Logic

The current scoring logic is intentionally transparent and demo-friendly.

- `AlertIntakeAgent` trims strings and coerces numbers
- `RiskSignalDetectionAgent` looks for:
  - unusual / cross-border location
  - high or elevated transaction amount
  - rapid recent transaction activity
  - new merchant
  - new device
  - low account age
  - travel-related mitigating context from free-text history notes
- `RiskAssessmentAgent`:
  - assigns `3` points to `strong` signals
  - assigns `1.5` points to `moderate` signals
  - adds combo bonuses for risky signal combinations
  - subtracts points for mitigating context
  - subtracts a small amount for known-device + usual-merchant patterns
  - maps score thresholds to `Low`, `Medium`, or `High`
  - maps risk level to a recommended action

This is good for explainability, but it is still a single hardcoded heuristic layer rather than a richer multi-source investigation flow.

### Current UI Flow

The UI is polished for a first demo and already tells a clear story.

- select a sample case
- edit the alert fields
- submit the alert
- review:
  - structured alert summary
  - detected risk signals
  - risk assessment
  - generated case summary
  - why flagged
  - mitigating context
  - POC limitations

The UI currently presents the workflow as multi-agent, but the user cannot inspect per-agent inputs, outputs, timing, or retrieved evidence.

### Current OpenAI Integration

OpenAI is currently optional and isolated to summary generation only.

- if `OPENAI_API_KEY` is missing, the app falls back to a local template summary
- if OpenAI fails, the app still returns a usable result
- OpenAI does **not** drive the fraud score or action

This is a good starting design because the core decision logic remains deterministic and explainable.

### Technical Debt And Demo Risks

The current demo is solid as a POC, but there are several risks that will become more visible as the demo grows.

- No input schema validation in the API route
- No traceability for how each agent arrived at its output
- No retrieval layer for supporting evidence or policy context
- Only three hardcoded sample alerts
- No notion of customer profile, transaction history, merchant context, or case documents
- No durable or replayable run history
- No automated tests
- Hardcoded geography logic is fragile
- Free-text account notes are lightly parsed with keyword matching only
- OpenAI receives the full triage JSON when enabled
- UI does not show confidence boundaries, fallback behavior, or execution trace
- “multi-agent” is mostly conceptual right now; the pipeline is linear and tightly coupled

## Target State

### Target Demo Architecture

The upgraded demo should remain simple, but become more traceable and evidence-driven.

Recommended target architecture:

1. **Client workbench**
   - alert editor
   - case selector
   - trace viewer
   - evidence viewer
   - result panel

2. **Server triage orchestration layer**
   - receives alert or case ID
   - loads demo dataset context
   - runs a sequence of explicit agents
   - records a structured trace for each step
   - returns both final decision and trace

3. **Local demo data layer**
   - sample alerts
   - customer profiles
   - recent transaction histories
   - merchant reference data
   - policy / investigation guidance documents
   - optional previous case notes

4. **Retrieval layer**
   - retrieves relevant local documents for the current alert
   - supports explainable RAG without requiring external infrastructure

5. **LLM adapter layer**
   - `mock` mode for fully offline / deterministic demos
   - `openai` mode for optional narrative enhancement
   - graceful fallback when external access fails

### Recommended Multi-Agent Flow

Keep the orchestration sequential and easy to explain. Avoid autonomous agent loops for this project.

Recommended agent sequence:

1. `AlertIntakeAgent`
   - validates and normalizes the alert

2. `ContextRetrievalAgent`
   - retrieves related customer profile, transaction history, policy snippets, and case notes

3. `SignalDetectionAgent`
   - detects suspicious patterns using alert data plus retrieved context

4. `RiskScoringAgent`
   - computes transparent rule-based score and recommendation

5. `EvidenceReviewAgent`
   - organizes the strongest supporting and mitigating evidence

6. `NarrativeSummaryAgent`
   - produces a concise investigator-ready summary
   - uses mock or OpenAI provider

7. `TraceAssembler`
   - packages the run trace, evidence list, fallback information, and final result

This still behaves like a deterministic pipeline, but now each stage is explicit, inspectable, and demoable.

### RAG / Document Retrieval Design

For a student-friendly and reliable demo, start with **local explainable retrieval**, not full vector infrastructure.

Recommended approach:

- store demo documents as JSON or Markdown in the repo
- use simple lexical retrieval first:
  - location matches
  - merchant matches
  - device status
  - travel keywords
  - policy tags
  - customer ID / case ID matching
- score retrieved documents with transparent heuristics
- return top documents with reasons they were retrieved

Example retrievable document types:

- customer profile
- recent transaction history
- travel notice
- known merchant history
- fraud investigation policy
- previous case note
- analyst playbook

Why this approach is recommended:

- no external vector DB
- easier to debug live
- easier to explain to judges, classmates, or instructors
- lower chance of retrieval silently failing

If desired later, embeddings can be added behind the same retrieval interface, but they should be phase 3 or later, not phase 1.

### Richer Dataset Support

The upgraded demo should support a small but richer synthetic dataset with linked records.

Recommended demo entities:

- `alerts`
- `customers`
- `transactions`
- `merchants`
- `documents`
- `cases`

Each sample alert should be able to reference:

- a customer profile
- several recent transactions
- one or more supporting documents
- optional prior analyst notes

This allows the demo to show retrieval, evidence grounding, and more realistic triage reasoning without introducing a real backend database.

### Agent Trace Logging

Trace logging should be a first-class feature, not an afterthought.

Each triage run should produce a structured trace object like:

- `runId`
- `startedAt`
- `completedAt`
- `mode` (`demo-mock` or `openai`)
- `steps[]`

Each `step` should include:

- `name`
- `startedAt`
- `completedAt`
- `status`
- `inputSummary`
- `retrievedDocumentIds`
- `outputSummary`
- `fallbackUsed`
- `notes`

This should be returned to the UI so the demo can show:

- which agent ran
- what evidence it used
- what conclusion it produced
- whether an LLM fallback was used

This is the clearest way to make the “multi-agent” claim credible in a demo.

### Demo Reliability / No External Dependency Failure

The app should always work in demo mode, even with:

- no network
- no API key
- OpenAI errors
- invalid or missing optional documents

Recommended strategy:

- define an AI provider abstraction
- support at least:
  - `mock`
  - `openai`
- default to `mock` mode for the demo
- use OpenAI only when explicitly enabled
- ensure summaries and trace explanations remain available without the LLM

Practical environment model:

- `AI_PROVIDER=mock|openai`
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=...`

In `mock` mode:

- use deterministic narrative templates
- optionally use a few canned explanation variants to feel more natural
- never fail the overall triage run because of summary generation

## Recommended File Structure

One practical target structure is:

```text
src/
  app/
    api/
      triage/
        route.ts
    page.tsx
    globals.css
  components/
    FraudTriageWorkbench.tsx
    TraceTimeline.tsx
    EvidencePanel.tsx
    ResultSummary.tsx
    ui/
      RiskBadge.tsx
      WorkflowStepper.tsx
  data/
    demo/
      alerts.ts
      customers.ts
      transactions.ts
      merchants.ts
      documents.ts
      cases.ts
  lib/
    agents/
      AlertIntakeAgent.ts
      ContextRetrievalAgent.ts
      SignalDetectionAgent.ts
      RiskScoringAgent.ts
      EvidenceReviewAgent.ts
      NarrativeSummaryAgent.ts
    ai/
      provider.ts
      mockProvider.ts
      openaiProvider.ts
    retrieval/
      retrieveContext.ts
      rankDocuments.ts
      documentMatchers.ts
    orchestration/
      triageOrchestrator.ts
      trace.ts
    scoring/
      riskRules.ts
      scoreSignals.ts
    utils/
      fraudFormatting.ts
      ids.ts
      time.ts
  types/
    fraud.ts
    trace.ts
    retrieval.ts
```

Notes:

- keep `types/` shared and small
- keep scoring rules isolated from orchestration
- keep provider-specific LLM code behind one interface
- keep retrieval logic separate from agents so it can evolve independently

## Phased Implementation Plan

### Phase 1: Refactor For Structure And Safety

Goal: improve maintainability without changing the overall demo behavior too much.

- add request validation for `/api/triage`
- split orchestration concerns from scoring concerns
- define shared trace types
- introduce a simple `runId`
- add a lightweight trace object even before adding RAG
- keep current UI mostly intact

Expected result:

- same demo behavior
- clearer architecture
- easier next phases

### Phase 2: Add Rich Demo Dataset

Goal: move from one flat alert to linked synthetic case context.

- expand `src/data/` into linked demo records
- create customer profiles, transaction histories, and policy docs
- allow each sample case to reference multiple context records
- keep all data local and static in-repo

Expected result:

- more realistic investigations
- stronger storytelling in the demo
- foundation for retrieval

### Phase 3: Add Retrieval / RAG

Goal: ground triage in retrieved supporting context.

- add retrieval utilities for demo documents
- retrieve top relevant documents for an alert
- show why each document was retrieved
- pass retrieved evidence into signal detection and summary generation

Expected result:

- evidence-backed reasoning
- visible RAG story without complex infra

### Phase 4: Promote The Pipeline To A Traceable Multi-Agent Demo

Goal: make the current “multi-agent” concept concrete and inspectable.

- split current pipeline into explicit agents with named responsibilities
- record per-agent inputs, outputs, evidence, and timings
- return full trace to the client
- add UI panels for trace and evidence review

Expected result:

- stronger explainability
- stronger multi-agent demo value
- easier presenter narrative

### Phase 5: Add Reliable AI Provider Abstraction

Goal: prevent external dependency failures from breaking the demo.

- add `mock` and `openai` providers
- default demo behavior to `mock`
- preserve deterministic fallback summaries
- clearly expose whether AI assistance was mocked or external

Expected result:

- dependable demos
- optional LLM enhancement
- no embarrassing live failure when OpenAI is unavailable

### Phase 6: Polish UX And Demo Storytelling

Goal: make the upgraded app presentation-ready.

- improve labels around “evidence,” “trace,” and “recommended action”
- show retrieved documents and cited evidence clearly
- show fallback status and processing mode
- add richer sample scenarios:
  - clear fraud
  - likely false positive
  - ambiguous case needing review

Expected result:

- cleaner narrative for judges or instructors
- stronger explainability
- more confidence during live demo

## Risks

### Scope Risk

The biggest risk is trying to simulate production-grade fraud systems. This project should remain a transparent, local, explainable demo.

### Over-Engineering Risk

Full agent autonomy, vector databases, authentication, persistent databases, streaming, and background jobs would add complexity quickly and are not necessary for the intended goal.

### Data Design Risk

If the synthetic dataset is too shallow, retrieval will feel fake. If it is too large, the project becomes content-heavy and hard to maintain. Aim for a small but linked dataset with 5 to 10 high-quality demo cases.

### Trace Noise Risk

If traces capture too much raw payload data, the UI becomes cluttered. Trace entries should summarize what each agent did, not dump entire objects everywhere.

### UX Risk

Adding traces, evidence, and multiple panels can overwhelm the page. The UI should keep a strong primary result while allowing deeper drill-down into the trace.

### LLM Risk

If the LLM becomes responsible for core scoring, explainability and reliability both get worse. Keep risk scoring deterministic and use AI only for explanation, organization, and narrative enhancement.

## Practical Recommendations

- Keep the current visible rule-based scoring model as the backbone.
- Add retrieval before adding more AI sophistication.
- Default to `mock` AI mode for class and demo reliability.
- Make trace logging a headline feature.
- Prefer local JSON/Markdown demo data over external services.
- Add a handful of higher-quality demo cases instead of many weak ones.
- Preserve the current polished single-page feel unless the trace UI becomes too crowded.

## Recommended Next Implementation Order

If implementation starts next, the most practical order is:

1. create shared trace types and a trace-aware orchestrator
2. add request validation
3. expand demo data into linked entities
4. add retrieval utilities and evidence output
5. split the pipeline into explicit traceable agents
6. add provider abstraction for `mock` and `openai`
7. enhance the UI with trace and evidence panels

This sequence keeps the app working at every step while steadily improving its demo value.
