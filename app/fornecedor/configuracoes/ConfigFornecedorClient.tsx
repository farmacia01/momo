"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Save, LogOut, Store, Bike, Banknote } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const TEMPOS_ENTREGA = ["30 min", "45 min", "1h", "1h30", "2h"];

export function ConfigFornecedorClient({ initial }: { initial: any }) {
  const [form, setForm] = useState({
    nome_fantasia: initial.nome_fantasia || "",
    descricao: initial.descricao || "",
    whatsapp: initial.whatsapp || "",
    telefone: initial.telefone || "",
    prazo_entrega_dias: initial.prazo_entrega_dias?.toString() || "",
    entrega_gratis_acima: initial.entrega_gratis_acima?.toString() || "",
  });
  const [regioes, setRegioes] = useState<string[]>(initial.regioes_entrega || []);
  const [loading, setLoading] = useState(false);

  // Entregas: Frete Full (motoboy) + COD
  const [freteFullAtivo, setFreteFullAtivo] = useState<boolean>(initial.frete_full_ativo ?? false);
  const [freteFullTaxa, setFreteFullTaxa] = useState<string>(initial.frete_full_taxa != null ? String(initial.frete_full_taxa) : "15.00");
  const [freteFullTempo, setFreteFullTempo] = useState<string>(initial.frete_full_tempo || "1h");
  const [codAtivo, setCodAtivo] = useState<boolean>(initial.cod_ativo ?? false);
  const [codTaxaAtiva, setCodTaxaAtiva] = useState<boolean>(initial.cod_taxa_adicional_ativa ?? false);
  const [codTaxaPct, setCodTaxaPct] = useState<string>(initial.cod_taxa_adicional_pct != null ? String(initial.cod_taxa_adicional_pct) : "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleRegiao = (uf: string) => {
    setRegioes((prev) => (prev.includes(uf) ? prev.filter((r) => r !== uf) : [...prev, uf]));
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("fornecedores")
      .update({
        nome_fantasia: form.nome_fantasia || null,
        descricao: form.descricao || null,
        whatsapp: form.whatsapp || null,
        telefone: form.telefone || null,
        prazo_entrega_dias: form.prazo_entrega_dias ? Number(form.prazo_entrega_dias) : null,
        entrega_gratis_acima: form.entrega_gratis_acima ? Number(form.entrega_gratis_acima) : null,
        regioes_entrega: regioes.length ? regioes : null,
      })
      .eq("id", initial.id);
    if (error) toast.error("Erro ao salvar.");
    else toast.success("Perfil atualizado!");
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-surface flex items-center justify-center text-forest">
          <Store size={22} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">{initial.razao_social}</h2>
          <p className="text-xs text-slate-400">CNPJ {initial.cnpj}</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-5 border border-slate-50 shadow-sm space-y-4">
        <Field label="Nome Fantasia">
          <input name="nome_fantasia" value={form.nome_fantasia} onChange={handleChange} className="input-standard" />
        </Field>
        <Field label="Descrição">
          <textarea name="descricao" value={form.descricao} onChange={handleChange} className="input-standard h-24 pt-3" placeholder="Conte ao paciente sobre sua empresa" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="WhatsApp">
            <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className="input-standard" placeholder="(11) 90000-0000" />
          </Field>
          <Field label="Telefone">
            <input name="telefone" value={form.telefone} onChange={handleChange} className="input-standard" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prazo de entrega (dias)">
            <input name="prazo_entrega_dias" type="number" value={form.prazo_entrega_dias} onChange={handleChange} className="input-standard" />
          </Field>
          <Field label="Frete grátis acima de (R$)">
            <input name="entrega_gratis_acima" type="number" value={form.entrega_gratis_acima} onChange={handleChange} className="input-standard" />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-5 border border-slate-50 shadow-sm">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Regiões de entrega</p>
        <div className="flex flex-wrap gap-2">
          {UFS.map((uf) => (
            <button
              key={uf}
              type="button"
              onClick={() => toggleRegiao(uf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                regioes.includes(uf) ? "bg-forest text-white" : "bg-slate-50 text-slate-500"
              }`}
            >
              {uf}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-forest text-base font-bold text-white shadow-lg active:scale-95 disabled:opacity-70"
      >
        {loading ? <LoadingSpinner size="sm" /> : (<><Save size={18} /> Salvar alterações</>)}
      </button>

      <button
        onClick={handleSignOut}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-red-500 border border-red-100"
      >
        <LogOut size={16} /> Sair
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">{label}</label>
      {children}
    </div>
  );
}
