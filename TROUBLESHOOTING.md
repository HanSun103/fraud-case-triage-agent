# Troubleshooting

## Intermittent OpenAI Fallbacks

Based on live logs and replay, intermittent fallback appears more likely than a permanent pipeline failure. The evidence is consistent with output variability on one or two schema-constrained steps, especially because the same case can later succeed without code changes.

This does not prove the root cause is only the model. Prompt/schema brittleness or other nondeterministic application factors could also contribute.

## Current Working Theory

- strict schema validation is correctly rejecting malformed or drifting model output
- `gpt-5-mini` can succeed, but it appears less consistent than `gpt-4.1-mini` on repeated structured-output agent runs
- some failures may come from prompt/schema mismatch rather than raw model quality alone

## Best Next Checks

- verify the OpenAI call uses structured outputs such as `response_format: { type: "json_schema", ... strict: true }` or the equivalent Responses API path
- pin model versions for consistency-sensitive demos, since prompt behavior can vary across model snapshots
- run a small eval matrix such as `50-100` replays per case, per model, with the same settings
- log the exact validator failure type: parse error, missing key, enum drift, extra field, truncation, or timeout
- add one retry only for schema-validation failures before fallback

## Recommended Demo Default

If reliability matters more than experimenting with newer models, prefer:

```env
OPENAI_MODEL=gpt-4.1-mini
OPENAI_AGENT_MODEL=gpt-4.1-mini
```

Use `gpt-5-mini` only if occasional fallbacks are acceptable for the demo.
