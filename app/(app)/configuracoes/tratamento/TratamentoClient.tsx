"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Card, Field, TextInput, SelectInput, SaveButton } from "../ui";

interface Form {
  dose_atual_mg: string;
  data_inicio_tratamento: string;
  medico_nome: string;
  peso_inicial: string;
  peso_meta: string;
  altura_cm: string;
}

const DOSES = ["2.5", "5", "7.5", "10", "12.5", "15"];

export function TratamentoClient({
  userId,
  initial,
}: {
  userId: string;
  initial: Form;
}) {
  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          dose_atual_mg: form.dose_atual_mg ? Number(form.dose_atual_mg) : null,
          data_inicio_tratamento: form.data_inicio_tratamento || null,
          medico_nome: form.medico_nome.trim() || null,
          peso_inicial: form.peso_inicial ? Number(form.peso_inicial) : null,
          peso_meta: form.peso_meta ? Number(form.peso_meta) : null,
          altura_cm: form.altura_cm ? Number(form.altura_cm) : null,
        })
        .eq("id", userId);
      if (error) throw error;
      toast.success("Tratamento atualizado!");
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-32">
      <PageHeader title="Dados do tratamento" />

      <Card className="space-y-5 p-6">
        <Field label="Dose atual">
          <SelectInput
            value={form.dose_atual_mg}
            onChange={(v) => set("dose_atual_mg", v)}
            placeholder="Selecione a dose"
            options={DOSES.map((d) => ({ value: d, label: `${d.replace(".", ",")} mg` }))}
          />
        </Field>

        <Field label="Data de início do tratamento">
          <TextInput
            type="date"
            value={form.data_inicio_tratamento}
            onChange={(v) => set("data_inicio_tratamento", v)}
          />
        </Field>

        <Field label="Médico responsável">
          <TextInput
            value={form.medico_nome}
            onChange={(v) => set("medico_nome", v)}
            placeholder="Dr(a). Nome"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Peso inicial (kg)">
            <TextInput
              type="number"
              inputMode="decimal"
              value={form.peso_inicial}
              onChange={(v) => set("peso_inicial", v)}
              placeholder="90"
            />
          </Field>
          <Field label="Peso meta (kg)">
            <TextInput
              type="number"
              inputMode="decimal"
              value={form.peso_meta}
              onChange={(v) => set("peso_meta", v)}
              placeholder="Opcional"
            />
          </Field>
          <Field label="Altura (cm)">
            <TextInput
              type="number"
              inputMode="decimal"
              value={form.altura_cm}
              onChange={(v) => set("altura_cm", v)}
              placeholder="Ex: 170"
            />
          </Field>
        </div>

        <SaveButton loading={saving} onClick={handleSave}>
          Salvar
        </SaveButton>
      </Card>
    </div>
  );
}
