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
            <div className={`${t.visible ? "animate-fade-up" : "animate-fade-out"} bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] p-4 rounded-2xl shadow-2xl flex items-center gap-3`}>
              <div className="h-10 w-10 rounded-full bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80]">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Novo pedido!</p>
                <p className="text-[rgba(255,255,255,0.4)] text-xs">{payload.new.codigo}</p>
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
            <h2 className="text-lg font-bold text-white">{fornecedor.nome_fantasia || fornecedor.razao_social}</h2>
            <span className="f-badge-active">ATIVO</span>
          </div>
          <p className="text-[12px] font-medium text-[rgba(255,255,255,0.28)] mt-0.5">Painel do fornecedor</p>
        </div>
        <NotificationBell userId={userId} />
      </div>

      {/* Hero Billing Card */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="f-card-lg p-5 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-[140px] h-[140px] rounded-full bg-[radial-gradient(circle,rgba(74,222,128,0.1)_0%,transparent_70%)]" />
        
        <p className="text-[11px] font-bold text-[rgba(255,255,255,0.28)] uppercase tracking-[1px]">Faturamento do mês</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-[36px] font-[800] text-white tracking-[-1.5px]">{formatBRL(stats.faturamento)}</h3>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-[12px] font-medium text-[rgba(255,255,255,0.28)]">Junho de 2026</p>
          <div className="flex items-center gap-1.5 bg-[#4ade80]/10 border border-[#4ade80]/20 text-[#4ade80] px-2.5 py-1 rounded-full text-[11px] font-bold">
            <TrendingUp size={12} />
            +24% vs. mês anterior
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Pedidos novos", value: stats.novos, icon: ShoppingBag, color: "text-[#4ade80]", bg: "bg-[#4ade80]/10" },
          { label: "Total pedidos", value: stats.total, icon: ClipboardList, color: "text-[#60a5fa]", bg: "bg-[#60a5fa]/10" },
          { label: "Produtos ativos", value: stats.produtos, icon: Package, color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10" },
          { label: "Avaliação", value: "4.9", icon: Star, color: "text-[#4ade80]", bg: "bg-[#4ade80]/10" },
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
            <p className="text-[10px] font-bold text-[rgba(255,255,255,0.28)] uppercase tracking-[0.5px]">{item.label}</p>
            <div className="flex items-baseline justify-between mt-0.5">
              <p className="text-[22px] font-bold text-white tracking-[-0.5px]">{item.value}</p>
              <span className="text-[10px] font-bold text-[#4ade80] flex items-center">+5%</span>
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
          <h4 className="text-[13px] font-bold text-white">Desempenho de Vendas</h4>
          <div className="flex p-1 bg-[rgba(255,255,255,0.03)] rounded-full gap-1">
            {["7d", "30d", "3m"].map((t) => (
              <button 
                key={t}
                className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${
                  t === "7d" ? "bg-[#4ade80] text-[#052e16]" : "text-[rgba(255,255,255,0.28)] hover:text-white"
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
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '11px'
                }}
                itemStyle={{ color: '#4ade80' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#4ade80" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                activeDot={{ r: 4, fill: '#4ade80', stroke: '#0d0d0d', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-white">Pedidos Recentes</h4>
          <Link href="/fornecedor/pedidos" className="text-[11px] font-bold text-[#4ade80] flex items-center gap-1">
            VER TODOS <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="space-y-2.5">
          {pedidos.length === 0 ? (
             <div className="text-center py-10 bg-[#111111] rounded-2xl border border-dashed border-[rgba(255,255,255,0.1)]">
               <p className="text-[rgba(255,255,255,0.2)] text-xs">Nenhum pedido recente</p>
             </div>
          ) : (
            pedidos.map((p, i) => {
              const status = STATUS_PEDIDO[p.status as keyof typeof STATUS_PEDIDO];
              const statusColor = p.status === 'novo' ? '#60a5fa' : 
                                 p.status === 'cancelado' ? '#f87171' : 
                                 p.status === 'pendente' ? '#fbbf24' : '#4ade80';

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
                      <p className="text-[13px] font-bold text-white">{p.codigo}</p>
                      <p className="text-[10px] font-medium text-[rgba(255,255,255,0.28)]">
                        {p.produto ? `${TIPO_PRODUTO_LABEL[p.produto.tipo_produto]} · ${p.produto.dose_mg}mg` : 'Produto removido'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-white">{formatBRL(p.preco_total)}</p>
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
