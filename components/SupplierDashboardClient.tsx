"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  ClipboardList, 
  Package, 
  Star, 
  TrendingUp, 
  ChevronRight,
  ArrowUpRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { formatBRL, STATUS_PEDIDO, TIPO_PRODUTO_LABEL } from "@/lib/fornecedores";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { NotificationBell } from "./NotificationBell";

const data = [
  { name: "Seg", value: 400 },
  { name: "Ter", value: 300 },
  { name: "Qua", value: 600 },
  { name: "Qui", value: 800 },
  { name: "Sex", value: 500 },
  { name: "Sáb", value: 900 },
  { name: "Dom", value: 700 },
];

export function SupplierDashboardClient({
  userId,
  fornecedor,
  stats,
  recentes,
}: {
  userId: string;
  fornecedor: any;
  stats: any;
  recentes: any[];
}) {
  const [pedidos, setPedidos] = useState(recentes);

  useEffect(() => {
    const channel = supabase
      .channel("pedidos-fornecedor")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pedidos",
          filter: `fornecedor_id=eq.${fornecedor.id}`,
        },
        (payload) => {
          toast.custom((t) => (
            <div className={`${t.visible ? "animate-fade-up" : "animate-fade-out"} bg-surface border border-ember/30 p-4 rounded-2xl shadow-2xl flex items-center gap-3`}>
              <div className="h-10 w-10 rounded-full bg-ember/10 flex items-center justify-center text-ember">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-text font-bold text-sm">Novo pedido!</p>
                <p className="text-muted text-xs">{payload.new.codigo}</p>
              </div>
            </div>
          ));
          // Refresh logic would go here, for now we just prepend to list
          setPedidos(prev => [payload.new, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fornecedor.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text">{fornecedor.nome_fantasia || fornecedor.razao_social}</h2>
            <span className="f-badge-active">ATIVO</span>
          </div>
          <p className="text-[12px] font-medium text-muted mt-0.5">Painel do fornecedor</p>
        </div>
        <NotificationBell userId={userId} />
      </div>

      {/* Hero Billing Card */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="f-card-lg p-5 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-[140px] h-[140px] rounded-full bg-[radial-gradient(circle,var(--color-ember-glow-strong)_0%,transparent_70%)]" />
        
        <p className="text-[11px] font-bold text-muted uppercase tracking-[1px]">Faturamento do mês</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-[36px] font-[800] text-text tracking-[-1.5px]">{formatBRL(stats.faturamento)}</h3>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-[12px] font-medium text-muted">Junho de 2026</p>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-ember" style={{ background: "var(--color-ember-glow)", border: "1px solid var(--f-ember-bd)" }}>
            <TrendingUp size={12} />
            +24% vs. mês anterior
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Pedidos novos", value: stats.novos, icon: ShoppingBag, color: "text-ember", bg: "bg-ember/10" },
          { label: "Total pedidos", value: stats.total, icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Produtos ativos", value: stats.produtos, icon: Package, color: "text-warning", bg: "bg-warning/10" },
          { label: "Avaliação", value: "4.9", icon: Star, color: "text-warning", bg: "bg-warning/10" },
        ].map((item, i) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 + (i * 0.05) }}
            className="f-card p-4"
          >
            <div className={`h-[30px] w-[30px] rounded-[10px] ${item.bg} flex items-center justify-center ${item.color} mb-3`}>
              <item.icon size={16} strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.5px]">{item.label}</p>
            <div className="flex items-baseline justify-between mt-0.5">
              <p className="text-[22px] font-bold text-text tracking-[-0.5px]">{item.value}</p>
              <span className="text-[10px] font-bold text-ember flex items-center">+5%</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sales Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="f-card p-5"
      >
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[13px] font-bold text-text">Desempenho de Vendas</h4>
          <div className="flex p-1 bg-surface-mid rounded-full gap-1">
            {["7d", "30d", "3m"].map((t) => (
              <button 
                key={t}
                className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${
                  t === "7d" ? "bg-ember text-white" : "text-muted hover:text-text"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-ember)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--color-ember)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-surface-border)" strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-text-dim)', fontSize: 9 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface)', 
                  border: '1px solid var(--color-surface-border)',
                  borderRadius: '10px',
                  color: 'var(--color-text)',
                  fontSize: '11px'
                }}
                itemStyle={{ color: 'var(--color-ember)' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-ember)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
                activeDot={{ r: 4, fill: 'var(--color-ember)', stroke: 'var(--color-bg)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-text">Pedidos Recentes</h4>
          <Link href="/fornecedor/pedidos" className="text-[11px] font-bold text-ember flex items-center gap-1">
            VER TODOS <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="space-y-2.5">
          {pedidos.length === 0 ? (
             <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-surface-border">
               <p className="text-muted text-xs">Nenhum pedido recente</p>
             </div>
          ) : (
            pedidos.map((p, i) => {
              const status = STATUS_PEDIDO[p.status as keyof typeof STATUS_PEDIDO];
              const statusColor = p.status === 'novo' ? 'var(--color-ember)' :
                                 p.status === 'cancelado' ? 'var(--color-danger)' :
                                 p.status === 'pendente' ? 'var(--color-warning)' :
                                 p.status === 'enviado' ? '#60a5fa' : 'var(--color-success)';

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.05) }}
                  className="f-card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
                    <div>
                      <p className="text-[13px] font-bold text-text">{p.codigo}</p>
                      <p className="text-[10px] font-medium text-muted">
                        {p.produto ? `${TIPO_PRODUTO_LABEL[p.produto.tipo_produto]} · ${p.produto.dose_mg}mg` : 'Produto removido'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-text">{formatBRL(p.preco_total)}</p>
                    <span 
                      className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5"
                      style={{ backgroundColor: `${statusColor}1A`, color: statusColor }}
                    >
                      {status?.label || p.status}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
