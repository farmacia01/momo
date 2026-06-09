"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Card, Field, TextInput, SelectInput, SaveButton } from "../ui";

interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function maskCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function EnderecoClient({
  userId,
  initial,
}: {
  userId: string;
  initial: Endereco;
}) {
  const [form, setForm] = useState<Endereco>(initial);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  function set<K extends keyof Endereco>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCep(value: string) {
    const masked = maskCep(value);
    set("cep", masked);

    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setLookingUp(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      setForm((f) => ({
        ...f,
        cep: masked,
        logradouro: data.logradouro || f.logradouro,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
        estado: data.uf || f.estado,
      }));
    } catch {
      toast.error("Erro ao buscar o CEP.");
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const endereco = { ...form };
      const { error } = await supabase
        .from("profiles")
        .update({
          // jsonb é o campo padrão usado pelos pedidos…
          endereco,
          // …e mantemos as colunas planas em sincronia para o checkout existente.
          cep: form.cep,
          logradouro: form.logradouro,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
        })
        .eq("id", userId);
      if (error) throw error;
      toast.success("Endereço salvo!");
    } catch {
      toast.error("Erro ao salvar endereço.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-32">
      <PageHeader title="Endereço de Entrega" />

      <Card className="space-y-5 p-6">
        <Field label="CEP" hint="Preenchemos o resto automaticamente">
          <div className="relative">
            <TextInput
              value={form.cep}
              onChange={handleCep}
              placeholder="00000-000"
              inputMode="numeric"
              maxLength={9}
            />
            {lookingUp && (
              <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ember" />
            )}
          </div>
        </Field>

        <Field label="Rua / Logradouro">
          <TextInput
            value={form.logradouro}
            onChange={(v) => set("logradouro", v)}
            placeholder="Rua, Avenida..."
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Número">
            <TextInput value={form.numero} onChange={(v) => set("numero", v)} placeholder="123" />
          </Field>
          <Field label="Complemento">
            <TextInput
              value={form.complemento}
              onChange={(v) => set("complemento", v)}
              placeholder="Apto, Bloco"
            />
          </Field>
        </div>

        <Field label="Bairro">
          <TextInput value={form.bairro} onChange={(v) => set("bairro", v)} />
        </Field>

        <div className="grid grid-cols-[1fr_auto] gap-4">
          <Field label="Cidade">
            <TextInput value={form.cidade} onChange={(v) => set("cidade", v)} />
          </Field>
          <Field label="Estado">
            <SelectInput
              value={form.estado}
              onChange={(v) => set("estado", v)}
              placeholder="UF"
              options={UFS.map((uf) => ({ value: uf, label: uf }))}
            />
          </Field>
        </div>

        <SaveButton loading={saving} onClick={handleSave}>
          Salvar endereço
        </SaveButton>
        <p className="text-center text-[11px] font-medium text-dim">
          Este endereço é usado como padrão ao fazer pedidos.
        </p>
      </Card>
    </div>
  );
}
