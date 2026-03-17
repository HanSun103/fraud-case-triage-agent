"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";

import { sampleAlerts } from "@/data/sampleAlerts";
import { formatCurrency, formatDateTime } from "@/lib/utils/fraudFormatting";
import { FraudAlertInput, TriageResult } from "@/types/fraud";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { WorkflowStepper } from "@/components/ui/WorkflowStepper";

const initialAlert = sampleAlerts[0].alert;

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-200">{children}</label>
  );
}

function SectionCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/20">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200/80">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-1 text-xl font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function FraudTriageWorkbench() {
  const [formState, setFormState] = useState<FraudAlertInput>(initialAlert);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState(sampleAlerts[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleCaseMap = useMemo(
    () => new Map(sampleAlerts.map((sampleCase) => [sampleCase.id, sampleCase])),
    [],
  );

  function updateField<K extends keyof FraudAlertInput>(
    key: K,
    value: FraudAlertInput[K],
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function loadSample(sampleId: string) {
    const sample = sampleCaseMap.get(sampleId);

    if (!sample) {
      return;
    }

    setSelectedCaseId(sampleId);
    setFormState(sample.alert);
    setResult(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formState,
          accountAgeDays: Number(formState.accountAgeDays),
          transactionAmount: Number(formState.transactionAmount),
          recentTransactionCount: Number(formState.recentTransactionCount),
          typicalTransactionAmount: Number(formState.typicalTransactionAmount),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "The triage API returned an error.");
      }

      setResult(payload as TriageResult);
    } catch (submissionError) {
      setResult(null);
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to analyze the fraud alert.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_32%),linear-gradient(180deg,_#020617,_#0f172a)] px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-cyan-400/20 bg-slate-950/75 p-8 shadow-2xl shadow-slate-950/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                Fraud Case Triage Agent
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                Proof-of-concept fraud triage workflow for investigators
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-300">
                This demo uses synthetic alert data, transparent rules, and optional OpenAI
                summarization to show how GenAI can support alert triage while keeping the
                investigator in the loop.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Data</p>
                <p className="mt-2 font-medium text-white">Synthetic sample cases</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Logic</p>
                <p className="mt-2 font-medium text-white">Readable rule-based scoring</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Decisioning</p>
                <p className="mt-2 font-medium text-white">Human investigator remains final</p>
              </div>
            </div>
          </div>
        </section>

        <WorkflowStepper />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <SectionCard eyebrow="Input" title="Fraud alert intake">
              <div className="grid gap-3">
                {sampleAlerts.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => loadSample(sample.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      selectedCaseId === sample.id
                        ? "border-cyan-300/60 bg-cyan-400/10"
                        : "border-white/10 bg-slate-950/40 hover:border-cyan-400/30 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{sample.label}</p>
                        <p className="mt-1 text-sm text-slate-300">{sample.description}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-cyan-100">
                        {sample.expectedOutcome}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <FieldLabel>Customer name</FieldLabel>
                    <input
                      value={formState.customerName}
                      onChange={(event) => updateField("customerName", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none ring-0 transition focus:border-cyan-300/60"
                    />
                  </div>
                  <div>
                    <FieldLabel>Age of account (days)</FieldLabel>
                    <input
                      type="number"
                      value={formState.accountAgeDays}
                      onChange={(event) =>
                        updateField("accountAgeDays", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                    />
                  </div>
                  <div>
                    <FieldLabel>Home location</FieldLabel>
                    <input
                      value={formState.homeLocation}
                      onChange={(event) => updateField("homeLocation", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                    />
                  </div>
                  <div>
                    <FieldLabel>Transaction location</FieldLabel>
                    <input
                      value={formState.transactionLocation}
                      onChange={(event) =>
                        updateField("transactionLocation", event.target.value)
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                    />
                  </div>
                  <div>
                    <FieldLabel>Transaction amount</FieldLabel>
                    <input
                      type="number"
                      value={formState.transactionAmount}
                      onChange={(event) =>
                        updateField("transactionAmount", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                    />
                  </div>
                  <div>
                    <FieldLabel>Typical transaction amount</FieldLabel>
                    <input
                      type="number"
                      value={formState.typicalTransactionAmount}
                      onChange={(event) =>
                        updateField("typicalTransactionAmount", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                    />
                  </div>
                  <div>
                    <FieldLabel>Merchant</FieldLabel>
                    <input
                      value={formState.merchant}
                      onChange={(event) => updateField("merchant", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                    />
                  </div>
                  <div>
                    <FieldLabel>Transaction time</FieldLabel>
                    <input
                      type="datetime-local"
                      value={formState.transactionTime}
                      onChange={(event) => updateField("transactionTime", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                    />
                  </div>
                  <div>
                    <FieldLabel>Recent transaction count</FieldLabel>
                    <input
                      type="number"
                      value={formState.recentTransactionCount}
                      onChange={(event) =>
                        updateField("recentTransactionCount", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                    />
                  </div>
                  <div>
                    <FieldLabel>Alert trigger reason</FieldLabel>
                    <input
                      value={formState.alertTriggerReason}
                      onChange={(event) =>
                        updateField("alertTriggerReason", event.target.value)
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                    />
                  </div>
                  <div>
                    <FieldLabel>Device status</FieldLabel>
                    <select
                      value={formState.deviceStatus}
                      onChange={(event) =>
                        updateField(
                          "deviceStatus",
                          event.target.value as FraudAlertInput["deviceStatus"],
                        )
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                    >
                      <option value="Known">Known</option>
                      <option value="New">New</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Merchant familiarity</FieldLabel>
                    <select
                      value={formState.merchantFamiliarity}
                      onChange={(event) =>
                        updateField(
                          "merchantFamiliarity",
                          event.target.value as FraudAlertInput["merchantFamiliarity"],
                        )
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                    >
                      <option value="Usual">Usual</option>
                      <option value="New">New</option>
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel>Account history notes</FieldLabel>
                  <textarea
                    value={formState.accountHistoryNotes}
                    onChange={(event) =>
                      updateField("accountHistoryNotes", event.target.value)
                    }
                    rows={5}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Analyzing alert..." : "Run triage workflow"}
                  </button>
                  <p className="text-sm text-slate-400">
                    The rules stay visible for demo transparency. OpenAI is only used for
                    case-summary enhancement if an API key is configured.
                  </p>
                </div>
              </form>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard eyebrow="Output" title="Investigation result">
              {error ? (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              {!result ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/30 p-8 text-sm leading-7 text-slate-300">
                  Submit a synthetic fraud alert to generate the structured case summary,
                  detected signals, risk assessment, and investigator-ready recommendation.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <RiskBadge level={result.riskAssessment.riskLevel} />
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                      {result.riskAssessment.recommendedAction}
                    </span>
                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
                      Score {result.riskAssessment.score}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        Customer
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {result.structuredAlert.customerName}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        Triage recommendation
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {result.riskAssessment.recommendedAction}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-sm font-semibold text-white">
                        1. Structured Alert Summary
                      </p>
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
                          <dt>Alert Trigger</dt>
                          <dd>{result.structuredAlert.alertTrigger}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt>Time</dt>
                          <dd>{formatDateTime(result.structuredAlert.transactionTime)}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-sm font-semibold text-white">
                        2. Detected Risk Signals
                      </p>
                      <div className="mt-3 space-y-3">
                        {result.detectedSignals.length ? (
                          result.detectedSignals.map((signal) => (
                            <div
                              key={signal.id}
                              className="rounded-2xl border border-white/10 bg-white/5 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-medium text-white">{signal.title}</p>
                                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                                  {signal.severity}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-300">
                                {signal.explanation}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-300">
                            No strong suspicious signals were detected.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-sm font-semibold text-white">3. Risk Assessment</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                          Risk level
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {result.riskAssessment.riskLevel}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                          Recommended action
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {result.riskAssessment.recommendedAction}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                          Reasoning
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          {result.riskAssessment.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-sm font-semibold text-white">4. Generated Case Summary</p>
                    <p className="mt-3 text-sm leading-7 text-slate-200">
                      {result.caseSummary}
                    </p>
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

                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/8 p-4">
                    <p className="text-sm font-semibold text-cyan-50">Human in the loop</p>
                    <p className="mt-2 text-sm leading-6 text-cyan-100/90">
                      Final decision remains with the fraud investigator, who may approve or
                      override this recommendation after reviewing additional customer context.
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard eyebrow="Limitations" title="POC limitations">
              <ul className="space-y-3 text-sm leading-6 text-slate-300">
                <li className="rounded-2xl bg-white/5 px-4 py-3">
                  False positives can occur when important customer context is missing.
                </li>
                <li className="rounded-2xl bg-white/5 px-4 py-3">
                  Travel notifications may not be captured, so location mismatches can be
                  misleading.
                </li>
                <li className="rounded-2xl bg-white/5 px-4 py-3">
                  The scoring logic is intentionally simplified so it is easy to explain in a
                  class or live demo.
                </li>
                <li className="rounded-2xl bg-white/5 px-4 py-3">
                  This proof of concept is not suitable for production without stronger controls,
                  monitoring, policy review, and real data pipelines.
                </li>
              </ul>
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}
