"use client";

import { m } from "framer-motion";

interface WeightCardProps {
  currentWeight: number | null;
  weightDelta: number;
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export function WeightCard({ currentWeight, weightDelta }: WeightCardProps) {
  const formattedWeight = currentWeight ? currentWeight.toFixed(1) : "--";
  const formattedDelta = Math.abs(weightDelta).toFixed(1);
  const deltaSymbol = weightDelta >= 0 ? "↓" : "↑";

  return (
    <m.div
      variants={item}
      className="card bg-card p-6 text-center"
    >
      <p className="text-sm font-medium text-text-secondary">Peso Atual</p>
      <div className="my-2 flex items-baseline justify-center gap-2">
        <span className="text-6xl font-extrabold text-text-primary tracking-tighter">
          {formattedWeight}
        </span>
        <span className="text-xl font-bold text-text-secondary">kg</span>
      </div>
      <div className="flex items-center justify-center gap-1 text-base font-semibold text-text-secondary">
        <span>{deltaSymbol}</span>
        <span>{formattedDelta} kg</span>
        <span className="hidden sm:inline">desde o início</span>
      </div>
    </m.div>
  );
}
