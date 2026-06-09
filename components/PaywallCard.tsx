"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export function PaywallCard({
  recurso = "Recurso Premium",
  descricao,
}: {
  recurso?: string;
  descricao: string;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px dashed var(--color-surface-border)",
        borderRadius: 20,
        padding: 32,
        textAlign: "center",
      }}
      className="flex flex-col items-center"
    >
      <div
        className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "rgba(255,101,0,0.08)", border: "1px solid rgba(255,101,0,0.15)" }}
      >
        <Lock size={32} style={{ color: "#ff6500" }} />
      </div>
      <h3 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{recurso}</h3>
      <p className="mt-1 max-w-[260px] text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>{descricao}</p>
      <Link
        href="/plano"
        className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.97]"
        style={{ background: "linear-gradient(135deg, #ff6500, #cc4c00)", boxShadow: "0 4px 16px rgba(255,101,0,0.3)" }}
      >
        Assinar Momo — R$ 29,90/mês
      </Link>
    </div>
  );
}
