import { ArrowDown, ArrowUp } from "lucide-react";
import { type ReactNode } from "react";

export interface MetricDelta {
  label: string;
  direction: "up" | "down";
  positive?: boolean;
}

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
      className={`rounded-[20px] px-5 py-[18px] ${className}`}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-start justify-between">
        {delta ? (
          <span
            className="inline-flex items-center gap-1 text-[13px] font-semibold"
            style={{ color: positive ? "#22c55e" : "#ef4444" }}
          >
            <Arrow className="h-3.5 w-3.5" strokeWidth={2.5} />
            {delta.label}
          </span>
        ) : (
          <span />
        )}
        {icon && <span style={{ color: "#ff6500" }}>{icon}</span>}
      </div>
      <div className="mt-2 text-[24px] font-bold leading-none tracking-tight" style={{ color: "var(--color-text)" }}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</div>
    </div>
  );
}
