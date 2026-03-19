"use client";

import { FormEvent, useMemo, useState } from "react";

import { AlertIntakeForm } from "@/components/workbench/AlertIntakeForm";
import { AgentTracePanel } from "@/components/workbench/AgentTracePanel";
import { CaseBrowserPanel } from "@/components/workbench/CaseBrowserPanel";
import { GuidancePanel } from "@/components/workbench/GuidancePanel";
import { InvestigatorActionsPanel } from "@/components/workbench/InvestigatorActionsPanel";
import { TriageResultPanel } from "@/components/workbench/TriageResultPanel";
import { PanelCard } from "@/components/ui/PanelCard";
import { WorkflowStepper } from "@/components/ui/WorkflowStepper";
import { getAllCases, getCaseById, getRandomCase, listCases, compareCases } from "@/lib/data/caseDataset";
import {
  mergeLegacyFraudAlertInput,
  toLegacyFraudAlertInput,
} from "@/lib/domain/fraudAdapters";
import { CaseDisposition, FraudAlertInput, RiskLevel, TriageResult } from "@/types/fraud";

const initialCase = getAllCases()[0];
const initialAlert = toLegacyFraudAlertInput(initialCase.alert);

export function FraudTriageWorkbench() {
  const [formState, setFormState] = useState<FraudAlertInput>(initialAlert);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState(initialCase.id);
  const [compareWithCaseId, setCompareWithCaseId] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"All" | "sample" | "generated" | "imported">(
    "All",
  );
  const [riskTierFilter, setRiskTierFilter] = useState<"All" | RiskLevel>("All");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investigatorNote, setInvestigatorNote] = useState("");
  const [disposition, setDisposition] = useState<CaseDisposition["status"]>("Pending Review");

  const filteredCases = useMemo(
    () =>
      listCases({
        source: sourceFilter,
        riskTier: riskTierFilter,
        search,
      }),
    [riskTierFilter, search, sourceFilter],
  );
  const activeCase = useMemo(() => getCaseById(selectedCaseId) ?? initialCase, [selectedCaseId]);
  const comparison = useMemo(
    () =>
      compareWithCaseId && activeCase
        ? compareCases(activeCase.id, compareWithCaseId)
        : null,
    [activeCase, compareWithCaseId],
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

  function loadCase(caseId: string) {
    const selectedCase = getCaseById(caseId);

    if (!selectedCase) {
      return;
    }

    setSelectedCaseId(caseId);
    setFormState(toLegacyFraudAlertInput(selectedCase.alert));
    setInvestigatorNote(selectedCase.alert.analystNotes);
    setDisposition("Pending Review");
    setResult(null);
    setError(null);
  }

  function loadRandomCase() {
    const randomCase = getRandomCase({
      source: sourceFilter,
      riskTier: riskTierFilter,
      search,
    });

    if (!randomCase) {
      return;
    }

    loadCase(randomCase.id);
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
        body: JSON.stringify(
          activeCase
            ? mergeLegacyFraudAlertInput(activeCase.alert, {
                ...formState,
                accountAgeDays: Number(formState.accountAgeDays),
                transactionAmount: Number(formState.transactionAmount),
                recentTransactionCount: Number(formState.recentTransactionCount),
                typicalTransactionAmount: Number(formState.typicalTransactionAmount),
              })
            : {
                ...formState,
                accountAgeDays: Number(formState.accountAgeDays),
                transactionAmount: Number(formState.transactionAmount),
                recentTransactionCount: Number(formState.recentTransactionCount),
                typicalTransactionAmount: Number(formState.typicalTransactionAmount),
              },
        ),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "The triage API returned an error.");
      }

      setResult(payload as TriageResult);
      setDisposition((payload as TriageResult).investigatorRecommendation.status);
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
                Traceable fraud triage workstation for explainable live demos
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Browse synthetic or imported cases, run rule-based triage, inspect guidance
                citations, and step through the multi-agent trace without sacrificing demo
                reliability.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Data</p>
                <p className="mt-2 font-medium text-white">{getAllCases().length} local demo cases</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Logic</p>
                <p className="mt-2 font-medium text-white">Rule-based scoring + local guidance</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Trace</p>
                <p className="mt-2 font-medium text-white">Every agent step remains visible</p>
              </div>
            </div>
          </div>
        </section>

        <WorkflowStepper />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <PanelCard eyebrow="Case Browser" title="Browse demo cases">
              <CaseBrowserPanel
                cases={filteredCases}
                selectedCaseId={selectedCaseId}
                compareWithCaseId={compareWithCaseId}
                sourceFilter={sourceFilter}
                riskTierFilter={riskTierFilter}
                search={search}
                onSourceFilterChange={setSourceFilter}
                onRiskTierFilterChange={setRiskTierFilter}
                onSearchChange={setSearch}
                onLoadCase={loadCase}
                onLoadRandomCase={loadRandomCase}
                onCompareWithCaseIdChange={setCompareWithCaseId}
                comparisonRows={comparison?.rows ?? null}
              />
            </PanelCard>

            <PanelCard eyebrow="Input" title="Alert intake and analyst edits">
              <AlertIntakeForm
                formState={formState}
                updateField={updateField}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </PanelCard>

            <PanelCard eyebrow="Analyst Actions" title="Disposition and note">
              <InvestigatorActionsPanel
                note={investigatorNote}
                disposition={disposition}
                onNoteChange={setInvestigatorNote}
                onDispositionChange={setDisposition}
              />
            </PanelCard>
          </div>

          <div className="space-y-6">
            <PanelCard eyebrow="Output" title="Triage result">
              <TriageResultPanel result={result} error={error} />
            </PanelCard>

            <PanelCard eyebrow="Guidance" title="Relevant Guidance">
              <GuidancePanel passages={result?.retrievedGuidance ?? []} />
            </PanelCard>

            <PanelCard eyebrow="Trace" title="Agent trace">
              <AgentTracePanel trace={result?.trace ?? null} />
            </PanelCard>

            <PanelCard eyebrow="Limitations" title="POC limitations">
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
            </PanelCard>
          </div>
        </div>
      </div>
    </main>
  );
}
