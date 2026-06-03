import { ArrowDown, ArrowUp } from "lucide-react";
import { type ReactNode } from "react";

export interface MetricDelta {
  /** Text shown next to the arrow, e.g. "-2.1 kg" or "+1 caneta". */
  label: string;
  direction: "up" | "down";
  /** Whether this change is good (green) or bad (red). Defaults: down = good. */
  positive?: boolean;
}

/**
 * Finance-style metric card: delta on top, big value, small muted label.
 */
export function MetricCard({
  value,
  label,
  delta,
  icon,
  className = "",
}: {
  value: ReactNode;
  label: string;
  delta?: MetricDelta;
  icon?: ReactNode;
  className?: string;
}) {
  const positive = delta?.positive ?? delta?.direction === "down";
  const Arrow = delta?.direction === "down" ? ArrowDown : ArrowUp;

  return (
    <div
      className={`rounded-[20px] bg-white px-5 py-[18px] ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start justify-between">
        {delta ? (
          <span
            className={`inline-flex items-center gap-1 text-[13px] font-semibold ${
              positive ? "text-[#16a34a]" : "text-[#ef4444]"
            }`}
          >
            <Arrow className="h-3.5 w-3.5" strokeWidth={2.5} />
            {delta.label}
          </span>
        ) : (
          <span />
        )}
        {icon && <span className="text-[#1a5c38]">{icon}</span>}
      </div>
      <div className="mt-2 text-[24px] font-bold leading-none tracking-tight text-[#111827]">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium text-[#6b7280]">{label}</div>
    </div>
  );
}
