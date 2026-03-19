import { AlertIntakeAgent } from "@/lib/agents/AlertIntakeAgent";
import { requestStructuredOpenAIResponse } from "@/lib/openai/shared";
import { structuredAlertSchema } from "@/lib/validation/fraudSchemas";
import { CaseAlert } from "@/types/fraud";

const partialStructuredAlertSchema = structuredAlertSchema.partial();

export async function generateStructuredAlertWithOpenAI(caseAlert: CaseAlert) {
  const localStructuredAlert = AlertIntakeAgent(caseAlert);
  const response = await requestStructuredOpenAIResponse({
    systemPrompt:
      "You normalize fraud case records into a StructuredAlert object for downstream scoring. Return only fields that should differ from the local reference and preserve all identifiers and enums exactly. Do not invent new facts.",
    userPayload: {
      caseAlert,
      localReference: localStructuredAlert,
    },
    schema: partialStructuredAlertSchema,
  });

  if (!response) {
    return response;
  }

  return {
    ...response,
    data: structuredAlertSchema.parse({
      ...localStructuredAlert,
      ...response.data,
    }),
  };
}
