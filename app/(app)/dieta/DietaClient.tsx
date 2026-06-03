"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { format, isSameDay, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Utensils,
  Plus,
  Check,
  X,
  Trash2,
  Timer,
  Leaf,
  Sparkles,
  Flame,
} from "lucide-react";
import { MacroRing } from "@/components/MacroRing";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/PageHeader";
import toast from "react-hot-toast";
import {
  PLANOS,
  faseFromDose,
  TIPO_REFEICAO_LABEL,
  type TipoRefeicao,
  type FaseMounjaro,
} from "@/lib/diet-plans";

interface Refeicao {
  id: string;
  data: string;
  tipo: TipoRefeicao;
  descricao: string;
  calorias_estimadas: number | null;
  proteinas_g: number | null;
  carboidratos_g: number | null;
  gorduras_g: number | null;
  foto_url: string | null;
}

type Tab = "Hoje" | "Plano" | "Receitas";

export function DietaClient({
  userId,
  doseMg,
  initialRefeicoes,
}: {
  userId: string;
  doseMg: number;
  initialRefeicoes: Refeicao[];
}) {
  const [tab, setTab] = useState<Tab>("Hoje");
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>(initialRefeicoes);
  const [showForm, setShowForm] = useState(false);

  const fase = faseFromDose(doseMg);
  const plano = PLANOS[fase];

  async function handleDelete(id: string) {
    const { error } = await supabase.from("refeicoes_registradas").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover refeição.");
      return;
    }
    setRefeicoes((prev) => prev.filter((r) => r.id !== id));
    toast.success("Refeição removida.");
  }

  function handleAdded(nova: Refeicao) {
    setRefeicoes((prev) => [nova, ...prev]);
    setShowForm(false);
  }

  const refeicoesHoje = useMemo(
    () => refeicoes.filter((r) => isSameDay(parseISO(r.data), new Date())),
    [refeicoes],
  );

  const totaisHoje = useMemo(() => {
    return refeicoesHoje.reduce(
      (acc, r) => ({
        proteina_g: acc.proteina_g + (r.proteinas_g ?? 0),
        carbo_g: acc.carbo_g + (r.carboidratos_g ?? 0),
        gordura_g: acc.gordura_g + (r.gorduras_g ?? 0),
        calorias: acc.calorias + (r.calorias_estimadas ?? 0),
      }),
      { proteina_g: 0, carbo_g: 0, gordura_g: 0, calorias: 0 },
    );
  }, [refeicoesHoje]);

  const progressoPct = Math.min(100, Math.round((totaisHoje.calorias / plano.caloriasMax) * 100));

  return (
    <div className="space-y-6 pb-36">
      <PageHeader title="Minha Dieta" />

      {/* Hero Card */}
      <div className="bg-white p-6 rounded-[24px] shadow-premium border-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-forest/10 text-forest flex items-center justify-center">
            <Leaf size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Fase atual</p>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">Fase {fase}: {plano.nome}</h2>
          </div>
        </div>
        
        <div className="flex justify-between items-end mb-2">
          <p className="text-sm font-bold text-slate-900">{totaisHoje.calorias} <span className="text-slate-400 font-medium">/ {plano.caloriasMax} kcal</span></p>
          <p className="text-xs font-bold text-forest">{progressoPct}%</p>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-forest rounded-full transition-all duration-500" style={{ width: `${progressoPct}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white rounded-full shadow-premium gap-1 overflow-x-auto scrollbar-hide">
        {(["Hoje", "Plano", "Receitas"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 min-w-[70px] py-2.5 rounded-full text-[12px] font-bold transition-all ${
              tab === t ? "bg-forest text-white shadow-lg shadow-forest/20" : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            {t === "Receitas" ? (
              <span className="flex items-center justify-center gap-1">
                <Sparkles size={12} className={tab === t ? "text-amber-300" : ""} /> {t}
              </span>
            ) : t}
          </button>
        ))}
      </div>

      <div className="page-transition-enter">
        {tab === "Hoje" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-[24px] shadow-premium flex items-center justify-between">
              <div className="w-[120px] h-[120px]">
                <MacroRing 
                  macros={{
                    proteina_g: totaisHoje.proteina_g,
                    carbo_g: totaisHoje.carbo_g,
                    gordura_g: totaisHoje.gordura_g,
                  }} 
                  metaCalorias={plano.caloriasMax} 
                  size={120}
                  showLegend={false}
                />
              </div>
              <div className="flex-1 ml-6 space-y-2">
                <MacroLegend color="bg-[#16a34a]" label="Proteínas" value={`${totaisHoje.proteina_g}g`} />
                <MacroLegend color="bg-[#f59e0b]" label="Carbos" value={`${totaisHoje.carbo_g}g`} />
                <MacroLegend color="bg-[#6366f1]" label="Gorduras" value={`${totaisHoje.gordura_g}g`} />
              </div>
            </div>
            
            {/* Add meal */}
            <button
              onClick={() => setShowForm(true)}
              className="fixed bottom-[70px] left-5 right-5 z-[45] z-45 flex items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-white shadow-lg shadow-forest/20 transition-transform active:scale-[0.98]"
            >
              <Plus size={18} /> Registrar refeição
            </button>

            {/* List of meals */}
            <div className="space-y-3">
               {refeicoesHoje.length === 0 ? (
                 <EmptyState icon={<Utensils />} title="Nada ainda" description="Registre sua primeira refeição do dia." />
               ) : (
                 refeicoesHoje.map(r => (
                   <div key={r.id} className="bg-white p-4 rounded-[20px] shadow-premium flex justify-between items-center">
                     <div>
                       <p className="text-[10px] font-bold text-forest uppercase tracking-wider">{TIPO_REFEICAO_LABEL[r.tipo]}</p>
                       <p className="text-sm font-bold text-gray-900">{r.descricao}</p>
                       <p className="text-[11px] text-gray-400 mt-0.5">{r.calorias_estimadas} kcal · P:{r.proteinas_g}g C:{r.carboidratos_g}g</p>
                     </div>
                     <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {tab === "Plano" && <MeuPlano fase={fase} />}
        {tab === "Receitas" && <IAChef fase={fase} />}
      </div>

      {showForm && (
        <RefeicaoForm userId={userId} onClose={() => setShowForm(false)} onAdded={handleAdded} />
      )}
    </div>
  );
}

function RefeicaoForm({
  userId,
  onClose,
  onAdded,
}: {
  userId: string;
  onClose: () => void;
  onAdded: (r: Refeicao) => void;
}) {
  const [form, setForm] = useState({
    tipo: "almoco" as TipoRefeicao,
    descricao: "",
    calorias_estimadas: "",
    proteinas_g: "",
    carboidratos_g: "",
    gorduras_g: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!form.descricao.trim()) {
      toast.error("Descreva a refeição.");
      return;
    }
    setSaving(true);
    const payload = {
      user_id: userId,
      data: new Date().toISOString(),
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      calorias_estimadas: form.calorias_estimadas ? Number(form.calorias_estimadas) : null,
      proteinas_g: form.proteinas_g ? Number(form.proteinas_g) : null,
      carboidratos_g: form.carboidratos_g ? Number(form.carboidratos_g) : null,
      gorduras_g: form.gorduras_g ? Number(form.gorduras_g) : null,
    };
    const { data, error } = await supabase
      .from("refeicoes_registradas")
      .insert(payload)
      .select()
      .single();
    if (error || !data) {
      toast.error("Erro ao registrar refeição.");
      setSaving(false);
      return;
    }
    toast.success("Refeição registrada!");
    onAdded(data as Refeicao);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-6">
      <div className="relative z-[101] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-[32px] bg-white p-6 animate-slide-up sm:rounded-[32px]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900">Registrar refeição</h2>
          <button onClick={onClose} className="p-2 text-slate-400"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">Tipo</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(TIPO_REFEICAO_LABEL) as TipoRefeicao[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, tipo: t })}
                  className={`py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                    form.tipo === t ? "bg-forest text-white shadow-md" : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {TIPO_REFEICAO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="input-standard h-20 pt-3"
              placeholder="Ex: Frango grelhado com salada e arroz integral"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MacroInput label="Calorias (kcal)" value={form.calorias_estimadas} onChange={(v) => setForm({ ...form, calorias_estimadas: v })} />
            <MacroInput label="Proteínas (g)" value={form.proteinas_g} onChange={(v) => setForm({ ...form, proteinas_g: v })} />
            <MacroInput label="Carboidratos (g)" value={form.carboidratos_g} onChange={(v) => setForm({ ...form, carboidratos_g: v })} />
            <MacroInput label="Gorduras (g)" value={form.gorduras_g} onChange={(v) => setForm({ ...form, gorduras_g: v })} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-forest text-base font-bold text-white shadow-lg active:scale-95 disabled:opacity-70"
          >
            {saving ? <LoadingSpinner size="sm" /> : "Salvar refeição"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MacroInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="input-standard" placeholder="0" />
    </div>
  );
}

function IAChef({ fase }: { fase: FaseMounjaro }) {
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);

  async function generate(type: string) {
    setLoading(true);
    setRecipe(null);
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        body: JSON.stringify({ mealType: type, phase: fase }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecipe(data);
    } catch (err) {
      toast.error("Erro ao gerar receita. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-[24px] shadow-premium">
        <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> Chef Inteligente
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Gere receitas personalizadas para sua fase do tratamento, com foto realista.
        </p>
        
        <div className="grid grid-cols-3 gap-2 mt-5">
          {["Café", "Almoço", "Jantar"].map((t) => (
            <button
              key={t}
              disabled={loading}
              onClick={() => generate(t)}
              className="py-3 rounded-2xl bg-surface text-forest text-[11px] font-bold uppercase tracking-wider hover:bg-forest hover:text-white transition-all disabled:opacity-50"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-white p-10 rounded-[24px] shadow-premium text-center animate-pulse">
          <LoadingSpinner size="md" />
          <p className="mt-4 text-sm font-bold text-gray-900">O Chef está cozinhando...</p>
          <p className="text-[11px] text-gray-400 mt-1">Gerando receita e foto via DALL-E 3</p>
        </div>
      )}

      {recipe && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] shadow-premium overflow-hidden border-none"
        >
          {recipe.imageUrl && (
            <div className="aspect-square w-full relative">
              <img 
                src={recipe.imageUrl} 
                alt={recipe.nome} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-5 right-4">
                <h4 className="text-xl font-black text-white leading-tight">{recipe.nome}</h4>
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {recipe.tempoPreparo}
                  </span>
                  <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {recipe.calorias} kcal
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-4">
              <div className="text-center flex-1 border-r border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prot</p>
                <p className="text-sm font-black text-gray-900">{recipe.macros.proteina}g</p>
              </div>
              <div className="text-center flex-1 border-r border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Carb</p>
                <p className="text-sm font-black text-gray-900">{recipe.macros.carbo}g</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gord</p>
                <p className="text-sm font-black text-gray-900">{recipe.macros.gordura}g</p>
              </div>
            </div>

            <div>
              <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Ingredientes</h5>
              <ul className="space-y-2">
                {recipe.ingredientes.map((ing: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest mt-1.5 shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Preparo</h5>
              <div className="space-y-4">
                {recipe.preparo.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4">
                    <span className="w-6 h-6 rounded-lg bg-surface text-forest text-[11px] font-black flex items-center justify-center shrink-0 shadow-sm">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-600 leading-relaxed pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MacroLegend({ color, label, value }: { color: string, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <span className="text-xs font-bold text-slate-900">{value}</span>
    </div>
  );
}

function MeuPlano({ fase }: { fase: FaseMounjaro }) {
  const plano = PLANOS[fase];
  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-[24px] shadow-premium">
        <h3 className="font-bold text-slate-900 mb-2">{plano.foco}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{plano.resumo}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-[24px] shadow-premium">
           <h4 className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-3">Recomendados</h4>
           <ul className="text-xs text-slate-600 space-y-2">
             {plano.alimentosRecomendados.slice(0, 5).map(a => (
               <li key={a} className="flex items-start gap-2">
                 <Check size={12} className="mt-0.5 text-green-500 shrink-0" />
                 {a}
               </li>
             ))}
           </ul>
        </div>
        <div className="bg-white p-4 rounded-[24px] shadow-premium">
           <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Evitar</h4>
           <ul className="text-xs text-slate-600 space-y-2">
             {plano.alimentosEvitar.slice(0, 5).map(a => (
               <li key={a} className="flex items-start gap-2">
                 <X size={12} className="mt-0.5 text-red-400 shrink-0" />
                 {a}
               </li>
             ))}
           </ul>
        </div>
      </div>
    </div>
  );
}
