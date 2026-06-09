"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, Field, TextInput, SelectInput, SaveButton } from "../ui";

interface Form {
  nome: string;
  data_nascimento: string;
  sexo: string;
  altura_cm: string;
}

export function UsuarioClient({
  userId,
  email,
  initial,
}: {
  userId: string;
  email: string;
  initial: Form;
}) {
  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  function set<K extends keyof Form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: form.nome.trim() || null,
          data_nascimento: form.data_nascimento || null,
          sexo: form.sexo || null,
          altura_cm: form.altura_cm ? Number(form.altura_cm) : null,
        })
        .eq("id", userId);
      if (error) throw error;
      toast.success("Alterações salvas!");
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw error;
      toast.success("Link enviado para seu e-mail");
    } catch {
      toast.error("Não foi possível enviar o link.");
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <div className="space-y-6 pb-32">
      <PageHeader title="Usuário" />

      <Card className="space-y-5 p-6">
        <Field label="Nome completo">
          <TextInput value={form.nome} onChange={(v) => set("nome", v)} placeholder="Seu nome" />
        </Field>

        <Field label="Email">
          <TextInput value={email} readOnly />
        </Field>

        <Field label="Data de nascimento">
          <TextInput
            type="date"
            value={form.data_nascimento}
            onChange={(v) => set("data_nascimento", v)}
          />
        </Field>

        <Field label="Sexo">
          <SelectInput
            value={form.sexo}
            onChange={(v) => set("sexo", v)}
            placeholder="Selecione"
            options={[
              { value: "masculino", label: "Masculino" },
              { value: "feminino", label: "Feminino" },
              { value: "nao_informar", label: "Prefiro não informar" },
            ]}
          />
        </Field>

        <Field label="Altura (cm)">
          <TextInput
            type="number"
            inputMode="numeric"
            value={form.altura_cm}
            onChange={(v) => set("altura_cm", v)}
            placeholder="170"
          />
        </Field>

        <SaveButton loading={saving} onClick={handleSave}>Salvar</SaveButton>
      </Card>

      <Card className="p-6">
        <button
          onClick={handlePasswordReset}
          disabled={sendingReset}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-surface py-4 text-sm font-bold text-ember transition-colors hover:bg-surface-mid disabled:opacity-50"
        >
          {sendingReset ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <KeyRound size={18} /> Alterar senha
            </>
          )}
        </button>
        <p className="mt-3 text-center text-[11px] font-medium text-dim">
          Enviaremos um link de redefinição para {email}
        </p>
      </Card>
    </div>
  );
}
