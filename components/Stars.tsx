import { Star } from "lucide-react";

/** Read-only star rating (rounds to nearest whole star). */
export function Stars({
  rating,
  size = 16,
  count,
  showValue = false,
}: {
  rating: number;
  size?: number;
  /** Number of reviews, shown in parentheses when provided. */
  count?: number;
  showValue?: boolean;
}) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={
              i < rounded ? "fill-amber-400 text-amber-400" : "text-slate-300"
            }
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs font-bold text-slate-700">
          {rating.toFixed(1)}
        </span>
      )}
      {typeof count === "number" && (
        <span className="text-xs text-slate-400">({count})</span>
      )}
    </div>
  );
}
