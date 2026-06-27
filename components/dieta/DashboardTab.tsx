"use client";

import { useMemo, useState } from "react";
import {
  Utensils,
  Trash2,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  History,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { PLANOS, type FaseMounjaro } from "@/lib/diet-plans";
import { type Refeicao, type FavoritoRefeicao, TIPO_LABELS } from "./types";

// ─────────────────────────────────────────────────────────
// Meal card with star + delete
// ─────────────────────────────────────────────────────────

function RefeicaoCard({
  r,
  isFavorito,
  onToggleFavorito,
  onRemover,
}: {
  r: Refeicao;
  isFavorito: boolean;
  onToggleFavorito: () => void;
  onRemover: () => void;
}) {
  return (
    <Card className="p-4 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-text capitalize truncate">{r.nome}</h4>
          {r.tipo && (
            <span className="text-[9px] font-bold text-muted shrink-0">
              {TIPO_LABELS[r.tipo]?.split(" ")[0]}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted mt-0.5">
          {r.calorias} kcal · P: {r.proteinas}g · C: {r.carboidratos}g · G: {r.gorduras}g
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggleFavorito}
          className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
            isFavorito ? "text-amber-400" : "text-dim hover:text-amber-400"
          }`}
        >
          <Star size={15} fill={isFavorito ? "currentColor" : "none"} />
        </button>
        <button
          onClick={onRemover}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-dim hover:text-red-500 transition-all"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Dashboard tab
// ─────────────────────────────────────────────────────────

interface DashboardTabProps {
  fase: FaseMounjaro;
  refeicoes: Refeicao[];
  hoje: string;
  favoritos: FavoritoRefeicao[];
  onRegistrar: () => void;
  onToggleFavorito: (r: Refeicao) => void;
  onRemoverRefeicao: (id: string) => void;
  weeksCompleted: number | null;
  imc: number | null;
}

export function DashboardTab({
  fase,
  refeicoes,
  hoje,
  favoritos,
  onRegistrar,
  onToggleFavorito,
  onRemoverRefeicao,
  weeksCompleted,
  imc,
}: DashboardTabProps) {
  const plano = PLANOS[fase];
  const [showPlanoDetalhamento, setShowPlanoDetalhamento] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

  const refeicoesHoje = useMemo(
    () => refeicoes.filter((r) => {
      if (!r.criado_em) return false;
      return new Date(r.criado_em).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }) === hoje;
    }),
    [refeicoes, hoje]
  );

  const totaisHoje = useMemo(
    () => refeicoesHoje.reduce(
      (acc, r) => ({
        calorias:     acc.calorias     + r.calorias,
        proteinas:    acc.proteinas    + r.proteinas,
        carboidratos: acc.carboidratos + r.carboidratos,
        gorduras:     acc.gorduras     + r.gorduras,
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    ),
    [refeicoesHoje]
  );

  const progressoPct = Math.min(
    100,
    Math.round((totaisHoje.calorias / (plano?.caloriasMax || 2000)) * 100)
  );

  const chartData7d = useMemo(() => {
    const days: Record<string, { proteinas: number; date: string }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      const label = d.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");
      days[key] = { proteinas: 0, date: label };
    }
    for (const r of refeicoes) {
      if (!r.criado_em) continue;
      const day = new Date(r.criado_em).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      if (days[day]) days[day].proteinas += r.proteinas;
    }
    return Object.values(days);
  }, [refeicoes]);

  const historico = useMemo(() => {
    const map: Record<string, Refeicao[]> = {};
    for (const r of refeicoes) {
      if (!r.criado_em) continue;
      const day = new Date(r.criado_em).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      if (day !== hoje) {
        if (!map[day]) map[day] = [];
        map[day].push(r);
      }
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7);
  }, [refeicoes, hoje]);

  const imcLabel = imc === null ? '' : imc < 18.5 ? 'Abaixo do peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidade';

  return (
    <div className="space-y-6">
      {/* Week + IMC stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[16px] p-3 bg-surface border border-surface-border">
          <p className="text-[10px] font-medium text-muted">Semana atual</p>
          <h5 className="text-[17px] font-bold mt-1 tracking-tight text-text">
            {weeksCompleted !== null ? weeksCompleted + 1 : '--'}
          </h5>
          <p className="text-[10px] font-bold mt-0.5 text-ember">de tratamento</p>
        </div>
        <div className="rounded-[16px] p-3 bg-surface border border-surface-border">
          <p className="text-[10px] font-medium text-muted">IMC atual</p>
          <h5 className="text-[17px] font-bold mt-1 tracking-tight text-text">
            {imc !== null ? imc.toFixed(1) : '--'}
          </h5>
          {imcLabel && (
            <p className="text-[10px] font-bold mt-0.5 text-ember">{imcLabel}</p>
          )}
        </div>
      </div>

      {/* Macro Dashboard */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Fase {fase}</p>
            <h2 className="text-xl font-black text-text">{plano?.nome}</h2>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Calorias</p>
            <p className="text-lg font-black text-text">
              {totaisHoje.calorias}{" "}
              <span className="text-sm font-medium text-dim">/ {plano?.caloriasMax} kcal</span>
            </p>
          </div>
        </div>

        <div className="flex justify-around items-center gap-4 py-2">
          <div className="text-center">
            <div className="h-14 w-14 rounded-full border-4 border-ember/20 flex items-center justify-center text-[11px] font-black text-ember">
              {totaisHoje.proteinas}g
            </div>
            <p className="text-[10px] font-bold uppercase text-muted mt-2">Prot</p>
          </div>
          <div className="text-center">
            <div className="h-14 w-14 rounded-full border-4 border-green-500/20 flex items-center justify-center text-[11px] font-black text-green-500">
              {totaisHoje.carboidratos}g
            </div>
            <p className="text-[10px] font-bold uppercase text-muted mt-2">Carb</p>
          </div>
          <div className="text-center">
            <div className="h-14 w-14 rounded-full border-4 border-amber-500/20 flex items-center justify-center text-[11px] font-black text-amber-500">
              {totaisHoje.gorduras}g
            </div>
            <p className="text-[10px] font-bold uppercase text-muted mt-2">Gord</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted">
            <span>Progresso do dia</span>
            <span className="text-ember">{progressoPct}%</span>
          </div>
          <div className="h-2 w-full bg-surface-border rounded-full overflow-hidden">
            <div
              className="h-full bg-ember transition-all duration-500"
              style={{ width: `${progressoPct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 7-day protein chart */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-ember" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted">Proteína — 7 dias</h3>
        </div>
        <div className="h-[90px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData7d} barCategoryGap="30%">
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-text-dim)", fontSize: 9, fontWeight: 700 }}
                dy={6}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,101,0,0.05)" }}
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-border)",
                  borderRadius: "12px",
                  padding: "8px 12px",
                  fontSize: "11px",
                }}
                formatter={(v: number) => [`${v}g`, "Proteína"]}
              />
              <Bar dataKey="proteinas" radius={[4, 4, 0, 0]} barSize={18}>
                {chartData7d.map((_, index) => (
                  <Cell
                    key={index}
                    fill={index === chartData7d.length - 1 ? "#ff6500" : "rgba(255,101,0,0.25)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Plano Detalhamento */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowPlanoDetalhamento(!showPlanoDetalhamento)}
          className="w-full p-4 flex items-center justify-between hover:bg-surface-hover transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-ember/10 flex items-center justify-center text-ember">
              <Utensils size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-text">Guia Nutricional</p>
              <p className="text-[10px] text-muted">O que comer na Fase {fase}</p>
            </div>
          </div>
          {showPlanoDetalhamento ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showPlanoDetalhamento && (
          <div className="p-4 border-t border-surface-border bg-surface-mid/50 space-y-4">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Foco da Fase</h4>
              <p className="text-xs text-text font-medium leading-relaxed">{plano?.resumo}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-2">Recomendados</h4>
                <ul className="space-y-1">
                  {plano?.alimentosRecomendados.slice(0, 4).map((a) => (
                    <li key={a} className="text-[10px] text-muted flex items-center gap-1">
                      <Check size={10} className="text-green-500" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">Evitar</h4>
                <ul className="space-y-1">
                  {plano?.alimentosEvitar.slice(0, 4).map((a) => (
                    <li key={a} className="text-[10px] text-muted flex items-center gap-1">
                      <span className="text-red-500">•</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>

      <button
        onClick={onRegistrar}
        className="w-full h-14 bg-ember text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-ember active:scale-95 transition-all"
      >
        <Sparkles size={20} fill="currentColor" />
        Registrar Refeição (IA)
      </button>

      {/* Today's meals */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted ml-1">Refeições de Hoje</h3>
        {refeicoesHoje.length === 0 ? (
          <EmptyState
            icon={<Utensils />}
            title="Nada ainda"
            description="Registre sua refeição com foto ou texto para estimar macros."
          />
        ) : (
          refeicoesHoje.map((r) => (
            <RefeicaoCard
              key={r.id}
              r={r}
              isFavorito={favoritos.some((f) => f.nome === r.nome)}
              onToggleFavorito={() => onToggleFavorito(r)}
              onRemover={() => onRemoverRefeicao(r.id)}
            />
          ))
        )}
      </div>

      {/* 7-day history */}
      {historico.length > 0 && (
        <Card className="overflow-hidden">
          <button
            onClick={() => setShowHistorico(!showHistorico)}
            className="w-full p-4 flex items-center justify-between hover:bg-surface-hover transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-surface-mid flex items-center justify-center text-muted">
                <History size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-text">Histórico</p>
                <p className="text-[10px] text-muted">Últimos 7 dias</p>
              </div>
            </div>
            {showHistorico
              ? <ChevronUp size={18} className="text-dim" />
              : <ChevronDown size={18} className="text-dim" />}
          </button>
          {showHistorico && (
            <div className="border-t border-surface-border divide-y divide-surface-border">
              {historico.map(([dia, refeicoesDia]) => {
                const totalDia = refeicoesDia.reduce((s, r) => s + r.calorias, 0);
                const protDia  = refeicoesDia.reduce((s, r) => s + r.proteinas, 0);
                const label = new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", {
                  weekday: "short", day: "numeric", month: "short",
                });
                return (
                  <div key={dia} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold text-text capitalize">{label}</p>
                      <div className="flex gap-3">
                        <span className="text-[10px] font-bold text-muted">🔥 {totalDia} kcal</span>
                        <span className="text-[10px] font-bold text-ember">💪 {protDia}g</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {refeicoesDia.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-[11px] text-muted">
                          <span className="capitalize truncate max-w-[60%]">{r.nome}</span>
                          <span>{r.calorias} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
