"use client";

import { CaseDisposition } from "@/types/fraud";

export function InvestigatorActionsPanel({
  note,
  disposition,
  onNoteChange,
  onDispositionChange,
}: {
  note: string;
  disposition: CaseDisposition["status"];
  onNoteChange: (value: string) => void;
  onDispositionChange: (value: CaseDisposition["status"]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {(["Pending Review", "Escalated", "Closed"] as CaseDisposition["status"][]).map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() => onDispositionChange(status)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                disposition === status
                  ? "bg-cyan-300 text-slate-950"
                  : "border border-white/10 bg-slate-950/50 text-slate-200 hover:border-cyan-300/40"
              }`}
            >
              {status}
            </button>
          ),
        )}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Investigator note</label>
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
          placeholder="Capture the final human review note or demo talking point here."
        />
      </div>
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/8 p-4">
        <p className="text-sm font-semibold text-cyan-50">Human in the loop</p>
        <p className="mt-2 text-sm leading-6 text-cyan-100/90">
          Analysts can capture a note, set a disposition, and explain whether they accepted or
          overrode the recommendation for the demo.
        </p>
      </div>
    </div>
  );
}
