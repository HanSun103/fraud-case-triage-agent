# Local Guidance Retrieval

This project uses a local-first RAG layer to enrich triage explanations with guidance passages and visible citations.

## Folder Layout

```text
data/
  knowledge/
    raw/
      *.md
      *.txt
      *.json
    processed/
      guidance-store.json
src/
  lib/
    rag/
```

## How It Fits Into Triage

The retrieval layer is used by `GuidanceRetrievalAgent` during the triage pipeline.

High-level flow:

1. normalize alert input
2. retrieve top local guidance passages
3. attach citation-rich passages to the triage result
4. in `HYBRID_OPENAI`, optionally interpret the retrieved passages with OpenAI while preserving the raw citations
5. use those passages to enrich the investigator recommendation and summary narrative
6. keep the rule-based score unchanged for explainability

If retrieval finds nothing, the workflow still succeeds and returns an empty guidance list.

## Supported Raw Formats

### Markdown and text

Add a sidecar metadata file with the same basename and `.meta.json`.

Example:

```text
data/knowledge/raw/my-guidance.md
data/knowledge/raw/my-guidance.meta.json
```

### JSON

JSON guidance files can embed metadata directly and optionally use `sections`.

## Metadata Format

```json
{
  "id": "my-guidance",
  "title": "My Guidance Document",
  "sourceUrl": "https://example.com/guidance",
  "sourceType": "official-guidance",
  "jurisdiction": "Canada",
  "topic": "Suspicious transaction review",
  "publicationDate": "2026-03-18",
  "tags": ["fraud", "review", "cross-border"]
}
```

## Manual FINTRAC Guidance Ingestion

Do this manually. Do not scrape FINTRAC automatically.

Recommended workflow:

1. open the source page yourself
2. copy only the text you are allowed to store locally
3. save it into `data/knowledge/raw`
4. add matching metadata
5. keep excerpts short and retrieval-friendly

Helpful tag examples:

- `cross-border`
- `velocity`
- `new-device`
- `travel-context`
- `manual-review`

## Retrieval Strategy

`retrieveGuidanceForAlert(alert)`:

- normalizes the alert
- builds a query from alert trigger, geography, merchant category, device state, merchant familiarity, travel context, and amount / velocity clues
- scores chunks with:
  - keyword overlap
  - tag matches
  - lightweight similarity fallback
- returns top passages with:
  - excerpt text
  - score
  - matched terms
  - citation metadata

Returned citations include:

- source title
- source URL
- source type
- jurisdiction
- topic
- publication date
- source path
- chunk index

In hybrid mode, each returned passage may also include:

- `interpretation`
- `interpretationSource`

## Processed Store

The processed store is created automatically when retrieval runs and the raw files are newer than the last processed output.

Generated file:

```text
data/knowledge/processed/guidance-store.json
```

This keeps the system:

- database-free
- inspectable
- demo-friendly

## Example Usage

```ts
import { retrieveGuidanceForAlert } from "@/lib/rag";

const passages = await retrieveGuidanceForAlert(alert, { topK: 4 });
```

## Embeddings Later

The chunk format already reserves an `embedding` field so embeddings can be added later without changing the basic retrieval contracts.
