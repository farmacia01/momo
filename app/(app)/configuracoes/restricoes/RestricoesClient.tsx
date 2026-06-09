"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { faseFromDose } from "@/lib/diet-plans";
import { Card, SaveButton } from "../ui";

const OPCOES = [
  { value: "vegetariano", label: "Vegetariano", emoji: "🥗" },
  { value: "vegano", label: "Vegano", emoji: "🌱" },
  { value: "sem_gluten", label: "Sem glúten", emoji: "🌾" },
  { value: "sem_lactose", label: "Sem lactose", emoji: "🥛" },
  { value: "sem_frutos_do_mar", label: "Sem frutos do mar", emoji: "🦐" },
];

export function RestricoesClient({
  userId,
  doseMg,
  initial,
}: {
  userId: string;
  doseMg: number;
  initial: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [saving, setSaving] = useState(false);

  function toggle(value: string) {
    setSelected((s) =>
      s.includes(value) ? s.filter((v) => v !== value) : [...s, value],
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ restricoes_alimentares: selected })
        .eq("id", userId);
      if (error) throw error;

      toast.success("Restrições salvas! Atualizando receitas...");

      // Regenera as receitas da fase atual com as novas restrições.
      const labels = selected.map(
        (v) => OPCOES.find((o) => o.value === v)?.label ?? v,
      );
      const res = await fetch("/api/receitas/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fase: faseFromDose(doseMg),
          dose_mg: doseMg,
          restricoes: labels,
        }),
      });
      if (res.ok) {
        toast.success("Receitas atualizadas para suas restrições!");
      } else {
        toast.error("Restrições salvas, mas falhou ao regenerar receitas.");
      }
    } catch {
      toast.error("Erro ao salvar restrições.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-32">
      <PageHeader title="Restrições alimentares" />

      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-50">
          {OPCOES.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <button
                key={o.value}
                onClick={() => toggle(o.value)}
                className="flex w-full items-center gap-4 p-4 text-left"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-xl">
                  {o.emoji}
                </span>
                <span className="flex-1 text-sm font-bold text-text">{o.label}</span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-colors ${
                    checked ? "border-forest bg-ember text-white" : "border-gray-200"
                  }`}
                >
                  {checked && <Check size={15} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center gap-2 px-2 text-[11px] font-medium text-dim">
        <Sparkles size={14} className="text-ember" />
        Ao salvar, suas receitas são geradas novamente respeitando as restrições.
      </div>

      <SaveButton loading={saving} onClick={handleSave}>
        {saving ? <LoadingSpinner size="sm" /> : "Salvar restrições"}
      </SaveButton>
    </div>
  );
}
