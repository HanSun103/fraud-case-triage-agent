import { RiskLevel } from "@/types/fraud";
import { riskTone } from "@/lib/utils/fraudFormatting";

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${riskTone(level)}`}
    >
      {level} Risk
    </span>
  );
}
