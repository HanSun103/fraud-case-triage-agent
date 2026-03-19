"use client";

import { RiskLevel, SampleCase } from "@/types/fraud";

export function CaseBrowserPanel({
  cases,
  selectedCaseId,
  compareWithCaseId,
  sourceFilter,
  riskTierFilter,
  search,
  onSourceFilterChange,
  onRiskTierFilterChange,
  onSearchChange,
  onLoadCase,
  onLoadRandomCase,
  onCompareWithCaseIdChange,
  comparisonRows,
}: {
  cases: SampleCase[];
  selectedCaseId: string;
  compareWithCaseId: string;
  sourceFilter: "All" | "sample" | "generated" | "imported";
  riskTierFilter: "All" | RiskLevel;
  search: string;
  onSourceFilterChange: (value: "All" | "sample" | "generated" | "imported") => void;
  onRiskTierFilterChange: (value: "All" | RiskLevel) => void;
  onSearchChange: (value: string) => void;
  onLoadCase: (caseId: string) => void;
  onLoadRandomCase: () => void;
  onCompareWithCaseIdChange: (caseId: string) => void;
  comparisonRows:
    | {
        label: string;
        left: string | number;
        right: string | number;
      }[]
    | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search cases, tags, customer..."
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 md:col-span-2"
        />
        <select
          value={sourceFilter}
          onChange={(event) =>
            onSourceFilterChange(event.target.value as "All" | "sample" | "generated" | "imported")
          }
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
        >
          <option value="All">All sources</option>
          <option value="sample">Sample</option>
          <option value="generated">Generated</option>
          <option value="imported">Imported</option>
        </select>
        <select
          value={riskTierFilter}
          onChange={(event) => onRiskTierFilterChange(event.target.value as "All" | RiskLevel)}
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
        >
          <option value="All">All risk tiers</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{cases.length} cases available in the browser.</p>
        <button
          type="button"
          onClick={onLoadRandomCase}
          className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
        >
          Load random case
        </button>
      </div>

      <div className="max-h-[26rem] space-y-3 overflow-auto pr-1">
        {cases.map((demoCase) => (
          <button
            key={demoCase.id}
            type="button"
            onClick={() => onLoadCase(demoCase.id)}
            className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
              selectedCaseId === demoCase.id
                ? "border-cyan-300/60 bg-cyan-400/10"
                : "border-white/10 bg-slate-950/40 hover:border-cyan-400/30 hover:bg-white/5"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-white">{demoCase.label}</p>
                <p className="mt-1 text-sm text-slate-300">{demoCase.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                    {demoCase.source}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                    {demoCase.expectedRiskTier}
                  </span>
                  {demoCase.tags.slice(0, 2).map((tag) => (
                    <span
                      key={`${demoCase.id}-${tag}`}
                      className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-cyan-100">
                {demoCase.expectedOutcome}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white">Compare two cases</p>
          <select
            value={compareWithCaseId}
            onChange={(event) => onCompareWithCaseIdChange(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/60"
          >
            <option value="">Select comparison case</option>
            {cases
              .filter((demoCase) => demoCase.id !== selectedCaseId)
              .map((demoCase) => (
                <option key={demoCase.id} value={demoCase.id}>
                  {demoCase.label}
                </option>
              ))}
          </select>
        </div>
        {comparisonRows ? (
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            {comparisonRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.2fr_1fr_1fr] gap-3 rounded-xl bg-white/5 px-3 py-2"
              >
                <span className="text-slate-400">{row.label}</span>
                <span>{String(row.left)}</span>
                <span>{String(row.right)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            Pick a second case to compare risk cues, device familiarity, and mitigation context.
          </p>
        )}
      </div>
    </div>
  );
}
