import { RiskLevel } from "@/types/fraud";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function riskTone(level: RiskLevel) {
  if (level === "High") {
    return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/40";
  }

  if (level === "Medium") {
    return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/40";
  }

  return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40";
}

export function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}
