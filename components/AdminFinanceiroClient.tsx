"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Users, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const PRECO_PLANO = 29.9;
const formatBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function downloadCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]).join(",");
  const body = rows.map((r) => Object.values(r).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function AdminFinanceiroClient({ premiumCount, assinaturasAtivas, mrrData, churnRate, totalAssinaturas }: {
  premiumCount: number; assinaturasAtivas: any[]; mrrData: { mes: string; mrr: number }[]; churnRate: string; totalAssinaturas: number;
}) {
  const mrr = premiumCount * PRECO_PLANO;
  const arr = mrr * 12;
  const totalRecebido = totalAssinaturas * PRECO_PLANO;

  const metricas = [
    { label: "MRR",             value: formatBRL(mrr),          sub: `${premiumCount} assinantes`,        icon: DollarSign,  color: "#4ade80" },
    { label: "ARR projetado",   value: formatBRL(arr),           sub: "MRR × 12",                          icon: TrendingUp,  color: "#60a5fa" },
    { label: "Total histórico", value: formatBRL(totalRecebido), sub: `${totalAssinaturas} assinaturas`,   icon: Users,       color: "#fbbf24" },
    { label: "Churn Rate",      value: `${churnRate}%`,          sub: "Cancelamentos no último mês",        icon: TrendingDown, color: Number(churnRate) > 5 ? "#ef4444" : "#4ade80" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-black text-white tracking-tight">Financeiro</h1>
          <p className="text-[rgba(255,255,255,0.35)] text-[13px] mt-0.5">Visão financeira completa</p>
        </div>
        <button onClick={() => {
          const rows = assinaturasAtivas.map((a) => ({
            nome: a.profiles?.nome || "", email: a.profiles?.email || "",
            status: a.status,
            valor: PRECO_PLANO,
            desde: a.criado_em ? format(new Date(a.criado_em), "dd/MM/yyyy") : "",
            proximo_venc: a.current_period_end ? format(new Date(a.current_period_end), "dd/MM/yyyy") : "",
          }));
          downloadCSV(rows, `momo-financeiro-${format(new Date(), "yyyyMM")}.csv`);
        }} className="a-btn-ghost flex items-center gap-2">
          <Download size={14} />Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricas.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="a-card p-4">
            <div className="h-[30px] w-[30px] rounded-[10px] flex items-center justify-center mb-3" style={{ background: `${m.color}18` }}>
              <m.icon size={16} strokeWidth={2.5} style={{ color: m.color }} />
            </div>
            <p className="text-[10px] font-bold text-[rgba(255,255,255,0.28)] uppercase tracking-wide">{m.label}</p>
            <p className="text-[20px] font-black text-white mt-0.5 tracking-tight leading-tight">{m.value}</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.25)] mt-1">{m.sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="a-card-lg p-5">
        <h4 className="text-[13px] font-bold text-white mb-4">MRR — últimos 12 meses</h4>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mrrData} barSize={20}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} dy={8} />
              <YAxis hide />
              <Tooltip formatter={(v: number) => [formatBRL(v), "MRR"]} contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "11px", color: "#fff" }} itemStyle={{ color: "#4ade80" }} />
              <Bar dataKey="mrr" fill="#4ade80" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="a-card-lg p-5">
        <h4 className="text-[13px] font-bold text-white mb-4">Assinaturas ativas ({assinaturasAtivas.length})</h4>
        {assinaturasAtivas.length === 0 ? (
          <p className="text-[rgba(255,255,255,0.2)] text-[13px] text-center py-8">Nenhuma assinatura ativa</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  {["Usuário", "Valor", "Desde", "Próx. vencto", "Status"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-[rgba(255,255,255,0.28)] uppercase tracking-wider pb-3 px-1">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assinaturasAtivas.map((a, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="py-3 px-1"><p className="text-white font-semibold truncate max-w-[140px]">{a.profiles?.nome || "–"}</p><p className="text-[rgba(255,255,255,0.3)] truncate max-w-[140px]">{a.profiles?.email || "–"}</p></td>
                    <td className="py-3 px-1 font-bold text-white">{formatBRL(PRECO_PLANO)}</td>
                    <td className="py-3 px-1 text-[rgba(255,255,255,0.4)]">{a.criado_em ? format(new Date(a.criado_em), "dd/MM/yyyy") : "–"}</td>
                    <td className="py-3 px-1 text-[rgba(255,255,255,0.4)]">{a.current_period_end ? format(new Date(a.current_period_end), "dd/MM/yyyy") : "–"}</td>
                    <td className="py-3 px-1"><span className={a.status === "ativa" ? "a-badge-green" : a.status === "cancelada" ? "a-badge-red" : "a-badge-gray"}>{a.status?.toUpperCase() || "–"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
