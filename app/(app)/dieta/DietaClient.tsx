"use client";

import { useEffect, useMemo, useState } from "react";
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
import { PaywallCard } from "@/components/PaywallCard";
import { usePlano } from "@/hooks/usePlano";
import toast from "react-hot-toast";
import { BlurPaywall } from "@/components/BlurPaywall";
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
  const { isExpirado } = usePlano();

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

      <BlurPaywall ativo={isExpirado} mensagem="Acompanhe sua dieta e tenha cardápios com IA no Premium">
        {/* Hero Card */}
        <div className="bg-surface p-6 rounded-[24px] shadow-premium border-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-ember/10 text-ember flex items-center justify-center">
              <Leaf size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-dim uppercase tracking-widest leading-none">Fase atual</p>
              <h2 className="text-base font-bold text-text mt-0.5">Fase {fase}: {plano.nome}</h2>
            </div>
          </div>
          
          <div className="flex justify-between items-end mb-2">
            <p className="text-sm font-bold text-text">{totaisHoje.calorias} <span className="text-dim font-medium">/ {plano.caloriasMax} kcal</span></p>
            <p className="text-xs font-bold text-ember">{progressoPct}%</p>
          </div>
          <div className="h-2.5 w-full bg-surface-border rounded-full overflow-hidden">
            <div className="h-full bg-ember rounded-full transition-all duration-500" style={{ width: `${progressoPct}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-surface rounded-full shadow-premium gap-1 overflow-x-auto scrollbar-hide">
          {(["Hoje", "Plano", "Receitas"] as Tab[]).map(t => {
            const isSoon = t === "Receitas";
            return (
              <button
                key={t}
                onClick={() => {
                  if (isSoon) {
                    toast("Em breve! Receitas personalizadas com IA estão chegando 🚀", {
                      icon: '⏳',
                      style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                        fontSize: '12px'
                      },
                    });
                    return;
                  }
                  setTab(t);
                }}
                className={`flex-1 min-w-[70px] py-2.5 rounded-full text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  tab === t ? "bg-ember text-white shadow-lg shadow-forest/20" : "text-dim hover:bg-surface-mid"
                } ${isSoon ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {t === "Receitas" ? (
                  <span className="flex items-center justify-center gap-1">
                    <Sparkles size={12} className={tab === t ? "text-amber-300" : ""} /> {t}
                  </span>
                ) : t}
                {isSoon && (
                  <span className="bg-surface-border text-dim text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none uppercase tracking-tighter shrink-0">
                    Breve
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="page-transition-enter">
          {tab === "Hoje" && (
            <div className="space-y-6">
              <div className="bg-surface p-5 rounded-[24px] shadow-premium flex items-center justify-between">
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
                className="fixed bottom-[70px] left-5 right-5 z-[45] z-45 flex items-center justify-center gap-2 rounded-2xl bg-ember py-3.5 text-sm font-bold text-white shadow-lg shadow-forest/20 transition-transform active:scale-[0.98]"
              >
                <Plus size={18} /> Registrar refeição
              </button>

              {/* List of meals */}
              <div className="space-y-3">
                 {refeicoesHoje.length === 0 ? (
                   <EmptyState icon={<Utensils />} title="Nada ainda" description="Registre sua primeira refeição do dia." />
                 ) : (
                   refeicoesHoje.map(r => (
                     <div key={r.id} className="bg-surface p-4 rounded-[20px] shadow-premium flex justify-between items-center">
                       <div>
                         <p className="text-[10px] font-bold text-ember uppercase tracking-wider">{TIPO_REFEICAO_LABEL[r.tipo]}</p>
                         <p className="text-sm font-bold text-text">{r.descricao}</p>
                         <p className="text-[11px] text-dim mt-0.5">{r.calorias_estimadas} kcal · P:{r.proteinas_g}g C:{r.carboidratos_g}g</p>
                       </div>
                       <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                     </div>
                   ))
                 )}
              </div>
            </div>
          )}

          {tab === "Plano" && <MeuPlano fase={fase} />}
          {tab === "Receitas" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
                <Sparkles size={40} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">Receitas com IA</h3>
                <p className="text-sm text-muted max-w-[260px] mx-auto mt-1">
                  Estamos finalizando o nosso motor de inteligência artificial para gerar cardápios perfeitos para sua fase do Mounjaro.
                </p>
              </div>
            </div>
          )}
        </div>
      </BlurPaywall>

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
      <div className="relative z-[101] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-[32px] bg-surface p-6 animate-slide-up sm:rounded-[32px]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-text">Registrar refeição</h2>
          <button onClick={onClose} className="p-2 text-dim"><X size={20} /></button>
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
                    form.tipo === t ? "bg-ember text-white shadow-md" : "bg-surface-mid text-slate-600"
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
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ember text-base font-bold text-white shadow-lg active:scale-95 disabled:opacity-70"
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

interface ReceitaIA {
  id: string;
  nome: string;
  tipo: TipoRefeicao;
  emoji: string;
  tempo_preparo: number;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  dificuldade: string;
  dica_mounjaro: string;
  ingredientes: string[];
  modo_preparo: string[];
  beneficios: string[];
}

const TIPO_COR: Record<TipoRefeicao, string> = {
  cafe: "#fef3c7",
  almoco: "#dcfce7",
  jantar: "#e0f2fe",
  lanche: "#fce7f3",
};

const FILTROS: { key: "todas" | TipoRefeicao; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "cafe", label: "☕ Café" },
  { key: "almoco", label: "🍗 Almoço" },
  { key: "jantar", label: "🌙 Jantar" },
  { key: "lanche", label: "🥜 Lanche" },
];

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

function ReceitasIA({
  userId,
  fase,
  doseMg,
}: {
  userId: string;
  fase: FaseMounjaro;
  doseMg: number;
}) {
  const [receitas, setReceitas] = useState<ReceitaIA[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | TipoRefeicao>("todas");
  const [selecionada, setSelecionada] = useState<ReceitaIA | null>(null);

  async function carregarReceitas(forcar = false) {
    setLoading(true);
    try {
      // 1. Tenta o cache (gerado há menos de 7 dias) para esta fase.
      if (!forcar) {
        const { data: cache } = await supabase
          .from("receitas_geradas")
          .select("receitas, gerado_em")
          .eq("user_id", userId)
          .eq("fase", fase)
          .maybeSingle();

        if (
          cache?.receitas &&
          cache.gerado_em &&
          Date.now() - new Date(cache.gerado_em).getTime() < SETE_DIAS_MS
        ) {
          setReceitas(cache.receitas as ReceitaIA[]);
          return;
        }
      }

      // 2. Sem cache válido (ou regeneração forçada): gera via IA.
      const res = await fetch("/api/receitas/gerar", {
        method: "POST",
        body: JSON.stringify({ fase, dose_mg: doseMg }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReceitas((data.receitas ?? []) as ReceitaIA[]);
    } catch {
      toast.error("Erro ao carregar receitas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarReceitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visiveis = useMemo(
    () => (filtro === "todas" ? receitas : receitas.filter((r) => r.tipo === filtro)),
    [receitas, filtro],
  );

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${
              filtro === f.key
                ? "bg-ember text-white shadow-lg shadow-forest/20"
                : "bg-surface text-muted shadow-premium"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-[20px] shadow-premium overflow-hidden">
              <div className="skeleton h-20 w-full" />
              <div className="p-3 space-y-2">
                <div className="skeleton h-3.5 w-4/5 rounded-full" />
                <div className="skeleton h-3 w-1/2 rounded-full" />
                <div className="skeleton h-8 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : visiveis.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="Nenhuma receita"
          description="Toque em “Gerar novas receitas” para criar seu cardápio."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {visiveis.map((r) => (
              <ReceitaCard key={r.id} receita={r} onClick={() => setSelecionada(r)} />
            ))}
          </div>

          <button
            onClick={() => carregarReceitas(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-forest text-ember text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <Sparkles size={16} /> Gerar novas receitas
          </button>
        </>
      )}

      {selecionada && (
        <ReceitaDrawer receita={selecionada} onClose={() => setSelecionada(null)} />
      )}
    </div>
  );
}

function ReceitaCard({ receita, onClick }: { receita: ReceitaIA; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-surface rounded-[20px] shadow-premium overflow-hidden text-left active:scale-[0.98] transition-transform"
    >
      {/* Topo colorido por tipo */}
      <div
        className="relative h-20 flex items-center justify-center"
        style={{ backgroundColor: TIPO_COR[receita.tipo] ?? "#f1f5f9" }}
      >
        <span className="text-[36px] leading-none">{receita.emoji}</span>
        <span className="absolute top-2 right-2 bg-surface text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          ⏱ {receita.tempo_preparo}min
        </span>
      </div>

      <div className="p-3 space-y-2">
        <p className="text-[14px] font-bold text-text leading-tight line-clamp-2">{receita.nome}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            🔥 {receita.calorias} kcal
          </span>
          <span className="bg-ember/10 text-ember text-[10px] font-bold px-2 py-0.5 rounded-full">
            💪 {receita.proteinas}g
          </span>
        </div>
        {receita.dica_mounjaro && (
          <p className="bg-ember/10 text-ember text-[10px] font-medium leading-snug rounded-lg px-2 py-1.5 line-clamp-2">
            💡 {receita.dica_mounjaro}
          </p>
        )}
      </div>
    </button>
  );
}

function ReceitaDrawer({ receita, onClose }: { receita: ReceitaIA; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header colorido */}
        <div
          className="relative h-28 flex items-center justify-center rounded-t-[32px]"
          style={{ backgroundColor: TIPO_COR[receita.tipo] ?? "#f1f5f9" }}
        >
          <span className="text-[48px] leading-none">{receita.emoji}</span>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-surface/70 text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-black text-text leading-tight">{receita.nome}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="flex items-center gap-1 bg-surface-border text-slate-600 text-[11px] font-bold px-2.5 py-1 rounded-full">
                <Timer size={12} /> {receita.tempo_preparo} min
              </span>
              <span className="bg-surface-border text-slate-600 text-[11px] font-bold px-2.5 py-1 rounded-full capitalize">
                {receita.dificuldade}
              </span>
            </div>
          </div>

          {/* Macros */}
          <div className="flex justify-between items-center bg-surface-mid rounded-2xl p-4">
            {[
              { label: "Kcal", val: receita.calorias },
              { label: "Prot", val: `${receita.proteinas}g` },
              { label: "Carb", val: `${receita.carboidratos}g` },
              { label: "Gord", val: `${receita.gorduras}g` },
            ].map((m, i, arr) => (
              <div key={m.label} className={`text-center flex-1 ${i < arr.length - 1 ? "border-r border-gray-200" : ""}`}>
                <p className="text-[10px] font-bold text-dim uppercase tracking-widest">{m.label}</p>
                <p className="text-sm font-black text-text">{m.val}</p>
              </div>
            ))}
          </div>

          {receita.dica_mounjaro && (
            <div className="bg-ember/10 rounded-2xl p-4">
              <p className="text-[10px] font-black text-ember uppercase tracking-[0.2em] mb-1">Dica Mounjaro</p>
              <p className="text-sm text-ember/90 leading-relaxed font-medium">💡 {receita.dica_mounjaro}</p>
            </div>
          )}

          <div>
            <h5 className="text-[11px] font-black text-dim uppercase tracking-[0.2em] mb-3">Ingredientes</h5>
            <ul className="space-y-2">
              {receita.ingredientes.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-ember mt-1.5 shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-[11px] font-black text-dim uppercase tracking-[0.2em] mb-3">Modo de preparo</h5>
            <div className="space-y-4">
              {receita.modo_preparo.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <span className="w-6 h-6 rounded-lg bg-surface text-ember text-[11px] font-black flex items-center justify-center shrink-0 shadow-sm">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600 leading-relaxed pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {receita.beneficios?.length > 0 && (
            <div>
              <h5 className="text-[11px] font-black text-dim uppercase tracking-[0.2em] mb-3">Benefícios</h5>
              <div className="flex flex-wrap gap-2">
                {receita.beneficios.map((b, i) => (
                  <span key={i} className="flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                    <Check size={12} /> {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MacroLegend({ color, label, value }: { color: string, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-xs font-medium text-muted">{label}</span>
      </div>
      <span className="text-xs font-bold text-text">{value}</span>
    </div>
  );
}

function MeuPlano({ fase }: { fase: FaseMounjaro }) {
  const plano = PLANOS[fase];
  return (
    <div className="space-y-4">
      <div className="bg-surface p-5 rounded-[24px] shadow-premium">
        <h3 className="font-bold text-text mb-2">{plano.foco}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{plano.resumo}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface p-4 rounded-[24px] shadow-premium">
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
        <div className="bg-surface p-4 rounded-[24px] shadow-premium">
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
