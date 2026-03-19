"use client";

import { FormEvent } from "react";

import { FraudAlertInput } from "@/types/fraud";

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-2 block text-sm font-medium text-slate-200">{children}</label>;
}

export function AlertIntakeForm({
  formState,
  updateField,
  onSubmit,
  isLoading,
}: {
  formState: FraudAlertInput;
  updateField: <K extends keyof FraudAlertInput>(key: K, value: FraudAlertInput[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
}) {
  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
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
            onChange={(event) => updateField("accountAgeDays", Number(event.target.value))}
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
            onChange={(event) => updateField("transactionLocation", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
          />
        </div>
        <div>
          <FieldLabel>Transaction amount</FieldLabel>
          <input
            type="number"
            value={formState.transactionAmount}
            onChange={(event) => updateField("transactionAmount", Number(event.target.value))}
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
            onChange={(event) => updateField("recentTransactionCount", Number(event.target.value))}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
          />
        </div>
        <div>
          <FieldLabel>Alert trigger reason</FieldLabel>
          <input
            value={formState.alertTriggerReason}
            onChange={(event) => updateField("alertTriggerReason", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
          />
        </div>
        <div>
          <FieldLabel>Device status</FieldLabel>
          <select
            value={formState.deviceStatus}
            onChange={(event) =>
              updateField("deviceStatus", event.target.value as FraudAlertInput["deviceStatus"])
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
          onChange={(event) => updateField("accountHistoryNotes", event.target.value)}
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
          Rule-based scoring stays transparent. Guidance retrieval and optional OpenAI summary
          enrichment add explainability without overriding the score.
        </p>
      </div>
    </form>
  );
}
