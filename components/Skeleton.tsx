import { type CSSProperties } from "react";

/**
 * Shimmering placeholder. The `.skeleton` class (gradient + shimmer keyframes)
 * lives in styles/design-system.css.
 *
 * <Skeleton className="h-4 w-32" />            // line
 * <Skeleton variant="circle" className="h-12 w-12" />
 */
export function Skeleton({
  className = "",
  variant = "rect",
  style,
}: {
  className?: string;
  variant?: "rect" | "circle" | "text";
  style?: CSSProperties;
}) {
  const radius =
    variant === "circle"
      ? "rounded-full"
      : variant === "text"
        ? "rounded"
        : "rounded-[16px]";

  return (
    <div
      className={`skeleton ${radius} ${className}`}
      style={style}
      aria-hidden
    />
  );
}
