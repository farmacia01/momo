import { type HTMLAttributes } from "react";

/** Base card: white, rounded-lg (20px), soft shadow, 18px/20px padding. */
export function Card({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[20px] bg-surface px-5 py-[18px] ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Soft highlight surface: pale green, rounded-lg, no shadow / border. */
export function SurfaceCard({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[20px] bg-[#e8f5ee] px-5 py-[18px] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
