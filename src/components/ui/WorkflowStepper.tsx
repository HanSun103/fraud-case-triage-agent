const steps = [
  "Fraud Alert",
  "Alert Intake Agent",
  "Signal Detection Agent",
  "Risk Assessment Agent",
  "Guidance Retrieval Agent",
  "Narrative Summary Agent",
  "Investigator Recommendation Agent",
  "Investigator Review",
];

export function WorkflowStepper() {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-2xl shadow-slate-950/30">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
        Multi-Agent Workflow
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-8">
        {steps.map((step, index) => (
          <div
            key={step}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center text-sm text-slate-200"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
              Step {index + 1}
            </p>
            <p className="mt-2 font-medium">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
