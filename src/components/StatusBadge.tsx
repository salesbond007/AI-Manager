import { HEALTH_LABELS, HEALTH_TEXT_COLORS } from "@/lib/status-labels";

export function StatusBadge({ status }: { status: string }) {
  const label = HEALTH_LABELS[status] ?? status;
  const colorClass = HEALTH_TEXT_COLORS[status] ?? "text-slate-500 bg-slate-50";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
