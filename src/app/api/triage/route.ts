import { NextResponse } from "next/server";

import { runFraudTriage } from "@/lib/triagePipeline";
import { FraudAlertInput } from "@/types/fraud";

// API route that runs the full proof-of-concept triage workflow.
export async function POST(request: Request) {
  try {
    const alertInput = (await request.json()) as FraudAlertInput;
    const triageResult = await runFraudTriage(alertInput);

    return NextResponse.json(triageResult);
  } catch (error) {
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
