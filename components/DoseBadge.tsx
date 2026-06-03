/** Pill badge for a dose value — forest background, white bold 13px text. */
export function DoseBadge({
  mg,
  className = "",
}: {
  mg: number | string;
  className?: string;
}) {
  const label = typeof mg === "number" ? String(mg).replace(".", ",") : mg;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] font-bold text-white ${className}`}
      style={{ backgroundColor: "var(--color-forest)" }}
    >
      {label} mg
    </span>
  );
}
