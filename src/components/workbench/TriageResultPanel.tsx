"use client";

import { RiskBadge } from "@/components/ui/RiskBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils/fraudFormatting";
import { TriageResult } from "@/types/fraud";

export function TriageResultPanel({
  result,
  error,
}: {
  result: TriageResult | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
        {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/30 p-8 text-sm leading-7 text-slate-300">
        Load or edit a case, then run triage to review rule-based signals, guidance retrieval,
        investigator recommendation, and agent trace output.
      </div>
    );
  }

  const openAiAgents = result.trace.events.filter((event) => event.inference.provider === "openai");
  const fallbackAgents = result.trace.events.filter((event) => event.status === "fallback");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <RiskBadge level={result.riskAssessment.riskLevel} />
        <span className="rounded-full bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
          {result.investigatorRecommendation.recommendedAction}
        </span>
        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
          Score {result.riskAssessment.score}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
          Summary {result.summarySource}
        </span>
        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-violet-100">
          Recommendation {result.investigatorRecommendation.generatedBy}
        </span>
      </div>

      {result.trace.mode === "HYBRID_OPENAI" ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          OpenAI primary mode is active for intake, signal detection, guidance interpretation,
          recommendation, and narrative summary. Final scoring still remains rule-based.
          {fallbackAgents.length
            ? ` ${fallbackAgents.length} agent step(s) fell back to local logic in this run.`
            : " No agent fallbacks were needed in this run."}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">OpenAI agents used</p>
          <p className="mt-2 text-lg font-semibold text-white">{openAiAgents.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">OpenAI fallbacks</p>
          <p className="mt-2 text-lg font-semibold text-white">{fallbackAgents.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Run mode</p>
          <p className="mt-2 text-lg font-semibold text-white">{result.trace.mode}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Customer</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {result.structuredAlert.customerName}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Case status</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {result.investigatorRecommendation.status}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-sm font-semibold text-white">Structured Alert Summary</p>
          <dl className="mt-3 space-y-3 text-sm text-slate-300">
            <div className="flex justify-between gap-4">
              <dt>Transaction Amount</dt>
              <dd>{formatCurrency(result.structuredAlert.transactionAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Merchant</dt>
              <dd>{result.structuredAlert.merchant}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Location</dt>
              <dd>{result.structuredAlert.transactionLocation}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Home Location</dt>
              <dd>{result.structuredAlert.homeLocation}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Trigger</dt>
              <dd>{result.structuredAlert.alertTrigger}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Time</dt>
              <dd>{formatDateTime(result.structuredAlert.transactionTime)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-sm font-semibold text-white">Triggered Signals</p>
          <div className="mt-3 space-y-3">
            {result.detectedSignals.length ? (
              result.detectedSignals.map((signal) => (
                <div key={signal.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{signal.title}</p>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                      {signal.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{signal.explanation}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">No strong suspicious signals were detected.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-sm font-semibold text-white">Risk And Recommendation</p>
          <div className="mt-4 grid gap-4">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Risk rationale</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{result.riskAssessment.reason}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Investigator recommendation
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {result.investigatorRecommendation.rationale}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                Generated by {result.investigatorRecommendation.generatedBy}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-sm font-semibold text-white">Score Breakdown</p>
          <div className="mt-3 space-y-3">
            {result.riskAssessment.scoreBreakdown.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{item.label}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${
                      item.delta >= 0
                        ? "bg-rose-500/10 text-rose-100"
                        : "bg-emerald-500/10 text-emerald-100"
                    }`}
                  >
                    {item.delta > 0 ? "+" : ""}
                    {item.delta}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <p className="text-sm font-semibold text-white">Summary Narrative</p>
        <p className="mt-3 text-sm leading-7 text-slate-200">{result.caseSummary}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-sm font-semibold text-white">Why this was flagged</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {result.whyFlagged.map((reason) => (
              <li key={reason} className="rounded-xl bg-white/5 px-3 py-2">
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-sm font-semibold text-white">Context and caveats</p>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            {result.mitigatingFactors.length ? (
              result.mitigatingFactors.map((factor) => (
                <p key={factor} className="rounded-xl bg-emerald-500/10 px-3 py-2">
                  {factor}
                </p>
              ))
            ) : (
              <p className="rounded-xl bg-white/5 px-3 py-2">
                No mitigating context was detected from the provided alert details.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
