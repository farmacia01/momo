"use client";

import { motion } from "framer-motion";
import { ArrowLeft, User, Calendar, Syringe, Weight, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const formatBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const STATUS_COLOR: Record<string, string> = { novo: "#60a5fa", confirmado: "#4ade80", enviado: "#fbbf24", entregue: "#4ade80", cancelado: "#ef4444" };

export function AdminUserDetailClient({ usuario, doses, medicoes, pedidos, assinaturas, avaliacoes }: { usuario: any; doses: any[]; medicoes: any[]; pedidos: any[]; assinaturas: any[]; avaliacoes: any[] }) {
  const pesoData = [...medicoes].filter((m) => m.peso_kg).reverse().map((m) => ({ date: format(new Date(m.data_medicao), "dd/MM"), value: m.peso_kg }));

  return (
    <div className="space-y-6">
      <Link href="/admin/usuarios" className="flex items-center gap-2 text-[rgba(255,255,255,0.4)] hover:text-white text-[13px] font-semibold transition-colors">
        <ArrowLeft size={15} />Voltar para usuários
      </Link>

      <div className="a-card-lg p-5">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0">
            <span className="text-[18px] font-black text-[rgba(255,255,255,0.5)]">
              {(usuario.nome || "?").split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-[20px] font-black text-white">{usuario.nome || "Sem nome"}</h1>
            <p className="text-[13px] text-[rgba(255,255,255,0.4)]">{usuario.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={usuario.plano_ativo === "premium" ? "a-badge-green" : usuario.plano_ativo === "trial" ? "a-badge-yellow" : "a-badge-gray"}>
                {(usuario.plano_ativo || "–").toUpperCase()}
              </span>
              <span className="text-[11px] text-[rgba(255,255,255,0.3)]">Desde {format(new Date(usuario.created_at), "dd/MM/yyyy")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Altura", value: usuario.altura_cm ? `${usuario.altura_cm} cm` : "–", icon: User },
          { label: "Dose atual", value: usuario.dose_atual_mg ? `${usuario.dose_atual_mg} mg` : "–", icon: Syringe },
          { label: "Início trat.", value: usuario.data_inicio_tratamento ? format(new Date(usuario.data_inicio_tratamento), "MM/yyyy") : "–", icon: Calendar },
          { label: "Total pedidos", value: pedidos.length.toString(), icon: ShoppingBag },
        ].map((item) => (
          <div key={item.label} className="a-card p-4">
            <item.icon size={14} className="text-[rgba(255,255,255,0.3)] mb-2" />
            <p className="text-[10px] font-bold text-[rgba(255,255,255,0.28)] uppercase tracking-wide">{item.label}</p>
            <p className="text-[20px] font-black text-white mt-0.5 tracking-tight">{item.value}</p>
          </div>
        ))}
      </div>

      {pesoData.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="a-card p-5">
          <div className="flex items-center gap-2 mb-4"><Weight size={14} className="text-[rgba(255,255,255,0.3)]" /><h4 className="text-[13px] font-bold text-white">Evolução do peso</h4></div>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pesoData}>
                <defs><linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} /><stop offset="95%" stopColor="#60a5fa" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} dy={8} interval={Math.ceil(pesoData.length / 6)} />
                <YAxis domain={["auto", "auto"]} hide />
                <Tooltip formatter={(v: number) => [`${v} kg`, "Peso"]} contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "11px", color: "#fff" }} itemStyle={{ color: "#60a5fa" }} />
                <Area type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2} fill="url(#pesoGrad)" activeDot={{ r: 4, fill: "#60a5fa", stroke: "#0d0d0d", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {doses.length > 0 && (
        <div className="a-card-lg p-5">
          <h4 className="text-[13px] font-bold text-white mb-4 flex items-center gap-2"><Syringe size={14} className="text-[rgba(255,255,255,0.3)]" />Últimas doses</h4>
          <div className="space-y-2">
            {doses.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0">
                <div><p className="text-[13px] font-semibold text-white">{d.dose_mg} mg</p><p className="text-[11px] text-[rgba(255,255,255,0.35)]">{d.local_aplicacao || d.lado_corpo || "–"}</p></div>
                <p className="text-[11px] text-[rgba(255,255,255,0.3)]">{format(new Date(d.data_aplicacao), "dd/MM/yyyy")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {assinaturas.length > 0 && (
        <div className="a-card-lg p-5">
          <h4 className="text-[13px] font-bold text-white mb-4">Histórico de assinaturas</h4>
          <div className="space-y-2">
            {assinaturas.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0">
                <div><p className="text-[13px] font-semibold text-white">Mensal</p><p className="text-[11px] text-[rgba(255,255,255,0.35)]">Desde {format(new Date(a.criado_em), "dd/MM/yyyy")}</p></div>
                <div className="text-right">
                  <p className="text-[13px] font-bold text-white">{formatBRL(29.9)}</p>
                  <span className={a.status === "ativa" ? "a-badge-green" : a.status === "cancelada" ? "a-badge-red" : "a-badge-gray"}>{a.status?.toUpperCase() || "–"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pedidos.length > 0 && (
        <div className="a-card-lg p-5">
          <h4 className="text-[13px] font-bold text-white mb-4 flex items-center gap-2"><ShoppingBag size={14} className="text-[rgba(255,255,255,0.3)]" />Pedidos</h4>
          <div className="space-y-2">
            {pedidos.map((p) => {
              const color = STATUS_COLOR[p.status] || "#ffffff";
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0">
                  <div><p className="text-[13px] font-semibold text-white">{p.codigo}</p><p className="text-[11px] text-[rgba(255,255,255,0.35)]">{format(new Date(p.created_at), "dd/MM/yyyy")}</p></div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-white">{formatBRL(p.preco_total || 0)}</p>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>{p.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {avaliacoes.length > 0 && (
        <div className="a-card-lg p-5">
          <h4 className="text-[13px] font-bold text-white mb-4 flex items-center gap-2"><Star size={14} className="text-[rgba(255,255,255,0.3)]" />Avaliações deixadas</h4>
          <div className="space-y-3">
            {avaliacoes.map((a, i) => (
              <div key={i} className="bg-[rgba(255,255,255,0.03)] rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={11} fill={idx < a.nota ? "#fbbf24" : "transparent"} stroke={idx < a.nota ? "#fbbf24" : "rgba(255,255,255,0.2)"} />
                  ))}
                  <span className="text-[10px] text-[rgba(255,255,255,0.3)] ml-1">{format(new Date(a.created_at), "dd/MM/yyyy")}</span>
                </div>
                {a.comentario && <p className="text-[12px] text-[rgba(255,255,255,0.55)]">{a.comentario}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
