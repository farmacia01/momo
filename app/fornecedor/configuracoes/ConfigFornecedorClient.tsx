"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Save, LogOut, Store, MapPin, X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { m, AnimatePresence  } from 'framer-motion';
import { LoadingSpinner } from "@/components/LoadingSpinner";

const RAIOS = [10, 20, 30, 50, 100];

export function ConfigFornecedorClient({ initial }: { initial: any }) {
  const [form, setForm] = useState({
    nome_fantasia: initial.nome_fantasia || "",
    descricao: initial.descricao || "",
    whatsapp: initial.whatsapp || "",
    telefone: initial.telefone || "",
    prazo_entrega_dias: initial.prazo_entrega_dias?.toString() || "",
    entrega_gratis_acima: initial.entrega_gratis_acima?.toString() || "",
  });
  
  const [raioEntrega, setRaioEntrega] = useState<number>(initial.raio_entrega_km || 50);
  const [cidadesEntrega, setCidadesEntrega] = useState<string[]>(initial.cidades_entrega || []);
  const [novaCidade, setNovaCidade] = useState("");
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addCidade = () => {
    if (!novaCidade.trim()) return;
    if (cidadesEntrega.includes(novaCidade.trim())) {
      toast.error("Cidade já adicionada");
      return;
    }
    setCidadesEntrega([...cidadesEntrega, novaCidade.trim()]);
    setNovaCidade("");
  };

  const removeCidade = (cidade: string) => {
    setCidadesEntrega(cidadesEntrega.filter(c => c !== cidade));
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
        raio_entrega_km: raioEntrega,
        cidades_entrega: cidadesEntrega,
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
    <div className="space-y-6 pb-32">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-surface flex items-center justify-center text-forest">
          <Store size={22} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">{initial.razao_social}</h2>
          <p className="text-xs text-slate-400">CNPJ {initial.cnpj}</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-5 pb-8 border border-slate-50 shadow-sm space-y-4 h-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dados Gerais</p>
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

      {/* ÁREA DE ENTREGA */}
      <div className="bg-white rounded-[24px] p-5 pb-8 border border-slate-50 shadow-sm space-y-6 h-auto">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-forest" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Área de Entrega</p>
        </div>

        <Field label="Cidade base">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              readOnly 
              value={`${initial.endereco_cidade}, ${initial.endereco_estado}`} 
              className="input-standard pl-11 bg-slate-50 text-slate-500 cursor-not-allowed" 
            />
          </div>
        </Field>

        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">Raio de entrega</label>
          <div className="flex flex-wrap gap-2">
            {RAIOS.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setRaioEntrega(km)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  raioEntrega === km ? "bg-forest text-white shadow-md" : "bg-slate-900 text-slate-400"
                }`}
              >
                {km}km
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">Cidades adicionais</label>
          <div className="flex gap-2">
            <input 
              placeholder="Ex: Contagem, MG" 
              value={novaCidade}
              onChange={(e) => setNovaCidade(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCidade()}
              className="input-standard flex-1" 
            />
            <button 
              onClick={addCidade}
              className="h-12 w-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <AnimatePresence>
              {cidadesEntrega.map((cidade) => (
                <m.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={cidade}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600"
                >
                  {cidade}
                  <button onClick={() => removeCidade(cidade)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </m.span>
              ))}
            </AnimatePresence>
          </div>
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
