"use client";

import { RetrievedPassage } from "@/types/fraud";

export function GuidancePanel({ passages }: { passages: RetrievedPassage[] }) {
  if (!passages.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/30 p-6 text-sm leading-7 text-slate-300">
        No relevant guidance was retrieved for this alert. The triage result still uses the local
        rule-based workflow and degrades gracefully when the knowledge match is weak.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {passages.map((passage) => (
        <div key={passage.chunkId} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">{passage.citation.title}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                {passage.citation.sourceType} | {passage.citation.jurisdiction} | chunk{" "}
                {passage.citation.chunkIndex + 1}
              </p>
            </div>
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
              score {passage.score}
            </span>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-200">{passage.text}</p>
          {passage.interpretation ? (
            <div className="mt-3 rounded-2xl bg-cyan-500/8 px-3 py-3 text-sm leading-6 text-cyan-50">
              <p className="font-medium">Why this guidance matters</p>
              <p className="mt-2">
                {passage.interpretation}
                {passage.interpretationSource ? ` (${passage.interpretationSource})` : ""}
              </p>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {passage.matchedTerms.map((term) => (
              <span
                key={`${passage.chunkId}-${term}`}
                className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-slate-300"
              >
                {term}
              </span>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-white/5 px-3 py-3 text-xs text-slate-400">
            <p>Topic: {passage.citation.topic}</p>
            <p>Published: {passage.citation.publicationDate}</p>
            <p>Path: {passage.citation.sourcePath}</p>
            <p>
              Source URL:{" "}
              {passage.citation.sourceUrl ? (
                <a
                  href={passage.citation.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-200 underline decoration-cyan-300/40 underline-offset-4"
                >
                  {passage.citation.sourceUrl}
                </a>
              ) : (
                "Local-only"
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
