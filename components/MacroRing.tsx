"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { macroKcal, macroPercent, type Macros } from "@/lib/diet-plans";
import { useTheme } from "@/app/providers";

const COLORS = {
  proteina: "#ff6500",
  carbo: "#f59e0b",
  gordura: "#a78bfa",
} as const;

export function MacroRing({
  macros,
  metaCalorias,
  showLegend = true,
  size = 200,
}: {
  macros: Macros;
  metaCalorias?: number;
  showLegend?: boolean;
  size?: number;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const kcal = macroKcal(macros);
  const totalKcal = Math.round(kcal.proteina + kcal.carbo + kcal.gordura);
  const pct = macroPercent(macros);
  const isEmpty = totalKcal === 0;

  const emptyColor = isDark ? "#2a2a2a" : "#e2e8f0";

  const data = isEmpty
    ? [{ name: "vazio", value: 1, color: emptyColor }]
    : [
        { name: "Proteína", value: kcal.proteina, color: COLORS.proteina },
        { name: "Carboidrato", value: kcal.carbo, color: COLORS.carbo },
        { name: "Gordura", value: kcal.gordura, color: COLORS.gordura },
      ];

  const metaPct =
    metaCalorias && metaCalorias > 0
      ? Math.min(100, Math.round((totalKcal / metaCalorias) * 100))
      : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={isEmpty ? 0 : 2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{totalKcal}</span>
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>kcal hoje</span>
          {metaPct !== null && (
            <span className="mt-0.5 text-[11px] font-semibold" style={{ color: "#ff6500" }}>
              {metaPct}% da meta
            </span>
          )}
        </div>
      </div>

      {showLegend && (
        <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
          <LegendItem color={COLORS.proteina} label="Proteína" grams={macros.proteina_g} percent={isEmpty ? 0 : pct.proteina} />
          <LegendItem color={COLORS.carbo} label="Carbo" grams={macros.carbo_g} percent={isEmpty ? 0 : pct.carbo} />
          <LegendItem color={COLORS.gordura} label="Gordura" grams={macros.gordura_g} percent={isEmpty ? 0 : pct.gordura} />
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label, grams, percent }: { color: string; label: string; grams: number; percent: number }) {
  return (
    <div className="rounded-lg px-2 py-2" style={{ background: "var(--color-surface-mid)", border: "1px solid var(--color-surface-border)" }}>
      <div className="flex items-center justify-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      </div>
      <p className="mt-1 text-sm font-bold" style={{ color: "var(--color-text)" }}>{grams}g</p>
      <p className="text-[11px]" style={{ color: "var(--color-text-dim)" }}>{percent}%</p>
    </div>
  );
}
