import OpenAI from "openai";
import { ZodType } from "zod";

export interface OpenAIAgentResponse<T> {
  data: T;
  model: string;
  requestId: string | null;
}

function extractJson(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("OpenAI returned an empty response.");
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  return trimmed;
}

function buildParseCandidates(parsed: unknown): unknown[] {
  const candidates: unknown[] = [parsed];

  if (Array.isArray(parsed)) {
    return candidates;
  }

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;

    for (const key of [
      "data",
      "result",
      "output",
      "structuredAlert",
      "recommendation",
      "recommendationResult",
      "signalDetection",
      "signals",
      "interpretations",
    ]) {
      if (key in record) {
        candidates.push(record[key]);
      }
    }

    for (const value of Object.values(record)) {
      if (value && (typeof value === "object" || Array.isArray(value))) {
        candidates.push(value);
      }
    }
  }

  return candidates;
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

export function getOpenAIModel() {
  return process.env.OPENAI_AGENT_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function requestStructuredOpenAIResponse<T>(params: {
  systemPrompt: string;
  userPayload: unknown;
  schema: ZodType<T>;
  normalizeParsed?: (parsed: unknown) => unknown;
}) {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  const model = getOpenAIModel();
  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `${params.systemPrompt}\nReturn valid JSON only with no markdown fences.`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(params.userPayload, null, 2),
          },
        ],
      },
    ],
  });

  const parsed = JSON.parse(extractJson(response.output_text));
  const normalized = params.normalizeParsed ? params.normalizeParsed(parsed) : parsed;

  for (const candidate of buildParseCandidates(normalized)) {
    const result = params.schema.safeParse(candidate);

    if (result.success) {
      return {
        data: result.data,
        model,
        requestId: response.id ?? null,
      } satisfies OpenAIAgentResponse<T>;
    }
  }

  return {
    data: params.schema.parse(normalized),
    model,
    requestId: response.id ?? null,
  } satisfies OpenAIAgentResponse<T>;
}
