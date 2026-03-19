import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { runFraudTriage } from "@/lib/triagePipeline";
import { triageRequestSchema } from "@/lib/validation/fraudSchemas";

// API route that runs the full proof-of-concept triage workflow.
export async function POST(request: Request) {
  try {
    const alertInput = triageRequestSchema.parse(await request.json());
    const triageResult = await runFraudTriage(alertInput);

    return NextResponse.json(triageResult);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid fraud alert payload.",
          issues: error.issues.map((issue) => issue.path.join(".") || issue.message),
        },
        { status: 400 },
      );
    }

    console.error("Fraud triage request failed", error);

    return NextResponse.json(
      {
        error:
          "Unable to process the alert. Check the payload shape and optional OpenAI configuration.",
      },
      { status: 500 },
    );
  }
}
