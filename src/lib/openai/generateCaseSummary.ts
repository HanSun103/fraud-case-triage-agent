import OpenAI from "openai";

import { TriageResult } from "@/types/fraud";

export async function generateCaseSummaryWithOpenAI(
  triageResult: Omit<TriageResult, "caseSummary">,
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const completion = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You write concise fraud investigation summaries for human investigators. Keep it to 3-4 sentences, mention the main signals, the risk level, the recommended action, and note if context suggests a possible false positive. Do not use bullet points.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(triageResult, null, 2),
          },
        ],
      },
    ],
  });

  return completion.output_text.trim() || null;
}
