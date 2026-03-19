# Demo Script

## 2-Minute Flow

### 1. Open the workstation

Say:

`This is a local-first fraud triage desk. The score stays rule-based, guidance is retrieved from local reference material, and every agent step is traceable.`

Point to:

- case browser
- intake form
- guidance panel
- trace panel

### 2. Show a clear high-risk case

Load:

- any `Cross-border anomalies` case

Say:

`This case has a location mismatch, a much larger-than-normal amount, and weak supporting context. The score is explainable because every rule contribution is visible in the score breakdown.`

Point to:

- risk badge
- score breakdown
- triggered signals
- recommendation

### 3. Show guidance citations

Say:

`The system also retrieves relevant guidance passages. These do not silently override the score. They enrich the explanation and help justify why the case should be escalated or reviewed.`

Point to:

- `Relevant Guidance`
- source title
- excerpt
- publication / source metadata

### 4. Show the agent trace

Say:

`Every step is logged as a lightweight multi-agent workflow: intake, signal detection, scoring, guidance retrieval, recommendation, and summary generation.`

Point to:

- run ID
- mode
- step timing
- expandable input/output summaries

### 5. Show a mitigation case

Load:

- any `Travel-context mitigations` case

Say:

`Here the location mismatch is real, but travel context and a known device reduce concern. The score stays rule-based, while the summary explains why the alert may be a false positive.`

Point to:

- mitigating context
- lower risk tier
- recommendation
- relevant guidance

### 6. Explain rule score vs LLM narrative

Say:

`The score and tier are always computed in code for transparency. In local demo mode, the summary is generated from a deterministic template. In hybrid mode, OpenAI can improve the narrative, but not the underlying score.`

## Good Cases To Show

- `Cross-border anomalies`: best for strong fraud story
- `Travel-context mitigations`: best for explainable false-positive story
- `Low-risk normal behavior`: best for showing safe close-out behavior

## If OpenAI Is Unavailable

Say:

`The demo still completes because the fallback summary is local. The trace makes that fallback visible instead of hiding it.`
