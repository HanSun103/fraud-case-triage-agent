"use client";

import { TriageTrace } from "@/types/fraud";

export function AgentTracePanel({ trace }: { trace: TriageTrace | null }) {
  if (!trace) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/30 p-6 text-sm leading-7 text-slate-300">
        Run a case to inspect the agent timeline, execution order, timing, and per-step summaries.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Run ID</p>
          <p className="mt-2 break-all text-sm text-white">{trace.runId}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Mode</p>
          <p className="mt-2 text-sm text-white">{trace.mode}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Case ID</p>
          <p className="mt-2 text-sm text-white">{trace.caseId}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Duration</p>
          <p className="mt-2 text-sm text-white">{trace.durationMs}ms</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">OpenAI configured</p>
          <p className="mt-2 text-sm text-white">
            {trace.providerSummary.openAiConfigured ? "Yes" : "No"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">OpenAI attempts</p>
          <p className="mt-2 text-sm text-white">{trace.providerSummary.openAiAttemptCount}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">OpenAI successes</p>
          <p className="mt-2 text-sm text-white">{trace.providerSummary.openAiSuccessCount}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Fallbacks</p>
          <p className="mt-2 text-sm text-white">{trace.providerSummary.fallbackCount}</p>
        </div>
      </div>

      <div className="space-y-3">
        {trace.events.map((event, index) => (
          <details
            key={`${event.agentName}-${event.startedAt}`}
            className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">
                    Step {index + 1}: {event.agentName}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{event.outputSummary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                    {event.status}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                    {event.inference.provider}
                  </span>
                  {event.inference.model ? (
                    <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-violet-100">
                      {event.inference.model}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
                    {event.durationMs}ms
                  </span>
                </div>
              </div>
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                <p className="font-medium text-white">Input summary</p>
                <p className="mt-2 leading-6">{event.inputSummary}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                <p className="font-medium text-white">Output summary</p>
                <p className="mt-2 leading-6">{event.outputSummary}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                <p className="font-medium text-white">Provider</p>
                <p className="mt-2 leading-6">{event.inference.provider}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                <p className="font-medium text-white">OpenAI attempted</p>
                <p className="mt-2 leading-6">{event.inference.attempted ? "Yes" : "No"}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                <p className="font-medium text-white">Verified with rules</p>
                <p className="mt-2 leading-6">
                  {event.inference.verifiedWithRules ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                <p className="font-medium text-white">Fallback reason</p>
                <p className="mt-2 leading-6">{event.inference.fallbackReason ?? "None"}</p>
              </div>
            </div>
            {(event.inference.verificationSummary || event.inference.requestId) ? (
              <div className="mt-4 rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                <p className="font-medium text-white">Inference diagnostics</p>
                <div className="mt-2 space-y-1 leading-6">
                  <p>Verification: {event.inference.verificationSummary ?? "Not provided"}</p>
                  <p>Request ID: {event.inference.requestId ?? "Not available"}</p>
                </div>
              </div>
            ) : null}
            {event.details ? (
              <div className="mt-4 rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                <p className="font-medium text-white">Details</p>
                <p className="mt-2 leading-6">{event.details}</p>
              </div>
            ) : null}
            {event.metadata ? (
              <div className="mt-4 rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                <p className="font-medium text-white">Metadata</p>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs leading-6 text-slate-300">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            ) : null}
          </details>
        ))}
      </div>
    </div>
  );
}
