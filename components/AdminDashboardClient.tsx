"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  UserPlus, 
  UserMinus, 
  Percent, 
  Target,
  AlertCircle,
  Activity,
  Calendar,
  Layers,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

const COLORS = ["#22c55e", "#3b82f6", "#eab308", "#f43f5e", "#8b5cf6"];

interface Metrics {
  mrr: number;
  activeCustomers: number;
  newThisMonth: number;
  canceledThisMonth: number;
  churnRate: number;
  conversionRate: number;
  ticketMedio: number;
  activeUsers30d: number;
  activeUsers7d: number;
  activeUsersToday: number;
}

interface AdminDashboardClientProps {
  metrics: Metrics;
  revenueChart: { date: string; value: number }[];
  growthChart: { date: string; value: number }[];
  planDistribution: { name: string; value: number }[];
  recentCustomers: any[];
  alerts: { type: 'warning' | 'info' | 'danger'; text: string }[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
};

export function AdminDashboardClient({
  metrics,
  revenueChart,
  growthChart,
  planDistribution,
  recentCustomers,
  alerts,
}: AdminDashboardClientProps) {
  
  const cards = [
    { label: "MRR", value: formatBRL(metrics.mrr), sub: "Receita Recorrente", icon: DollarSign, color: "#22c55e", trend: "+12%" },
    { label: "Clientes Ativos", value: metrics.activeCustomers, sub: "Assinaturas Premium", icon: Users, color: "#3b82f6", trend: "+5%" },
    { label: "Novos (Mês)", value: metrics.newThisMonth, sub: "Cadastros recentes", icon: UserPlus, color: "#8b5cf6" },
    { label: "Churn Rate", value: `${metrics.churnRate.toFixed(1)}%`, sub: "Cancelamentos", icon: UserMinus, color: "#f43f5e" },
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-500/80 uppercase tracking-[0.2em]">Sistema Operacional</span>
          </div>
          <h1 className="text-[32px] font-black text-white tracking-tight leading-none a-text-gradient">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">Sincronização</p>
            <p className="text-[12px] text-white/70 font-mono">{format(new Date(), "HH:mm:ss")}</p>
          </div>
          <button className="h-10 px-4 rounded-xl bg-white text-black text-xs font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-white/5">
            <Zap size={14} fill="black" />
            Exportar Dados
          </button>
        </div>
      </div>

      {/* Alertas Inteligentes */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert, i) => (
            <motion.div 
              key={i}
              variants={item}
              className={`flex items-center gap-4 p-4 rounded-2xl border a-glass ${
                alert.type === 'danger' ? 'border-red-500/20 text-red-400' :
                alert.type === 'warning' ? 'border-amber-500/20 text-amber-400' :
                'border-blue-500/20 text-blue-400'
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                alert.type === 'danger' ? 'bg-red-500/10' :
                alert.type === 'warning' ? 'bg-amber-500/10' :
                'bg-blue-500/10'
              }`}>
                <AlertCircle size={16} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider leading-relaxed">{alert.text}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label} variants={item} className="a-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <card.icon size={80} />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}15`, border: `1px solid ${card.color}25` }}>
                <card.icon size={20} style={{ color: card.color }} strokeWidth={2.5} />
              </div>
              {card.trend && (
                <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                  {card.trend}
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{card.label}</p>
            <p className="text-[28px] font-black text-white tracking-tighter mt-1">{card.value}</p>
            <p className="text-[12px] font-medium text-white/40 mt-2">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Area Chart */}
        <motion.div variants={item} className="lg:col-span-8 a-card p-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h4 className="text-[16px] font-bold text-white tracking-tight">Performance Financeira</h4>
              <p className="text-[13px] text-white/30 mt-1">Faturamento bruto mensal consolidado</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-white/60 uppercase">Real</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 600 }} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 600 }} 
                  tickFormatter={(v) => `R$${v}`} 
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                  contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: '12px' }}
                  itemStyle={{ color: "#22c55e", fontSize: '12px', fontWeight: '800' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#22c55e" 
                  strokeWidth={4} 
                  fill="url(#revenueGradient)" 
                  activeDot={{ r: 8, fill: "#22c55e", stroke: "#000", strokeWidth: 4 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Plan Distribution Donut */}
        <motion.div variants={item} className="lg:col-span-4 a-card p-8 flex flex-col justify-between">
          <div>
            <h4 className="text-[16px] font-bold text-white tracking-tight">Market Share</h4>
            <p className="text-[13px] text-white/30 mt-1">Distribuição por plano</p>
          </div>
          
          <div className="h-[220px] my-6 relative flex items-center justify-center">
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Total</span>
              <span className="text-[32px] font-black text-white leading-none mt-1">
                {planDistribution.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1200}
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {planDistribution.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[12px] font-bold text-white/60">{p.name}</span>
                </div>
                <span className="text-[13px] font-black text-white">{p.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Engagement & Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users Stats */}
        <motion.div variants={item} className="a-card p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-white tracking-tight">Engajamento</h4>
              <p className="text-[13px] text-white/30">Usuários retidos (Doses/Peso)</p>
            </div>
          </div>

          <div className="flex gap-4 mb-10">
             {[
               { label: "Hoje", val: metrics.activeUsersToday, color: "bg-blue-500" },
               { label: "7 Dias", val: metrics.activeUsers7d, color: "bg-purple-500" },
               { label: "30 Dias", val: metrics.activeUsers30d, color: "bg-green-500" }
             ].map(eng => (
               <div key={eng.label} className="flex-1 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">{eng.label}</p>
                  <p className="text-[24px] font-black text-white tracking-tighter leading-none">{eng.val}</p>
                  <div className={`h-1 w-8 ${eng.color} rounded-full mx-auto mt-4 opacity-40`} />
               </div>
             ))}
          </div>

          <div className="h-[140px] w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthChart}>
                   <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} dy={10} />
                   <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Customers List */}
        <motion.div variants={item} className="a-card p-0 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.01]">
            <h4 className="text-[16px] font-bold text-white tracking-tight">Últimos Assinantes</h4>
            <button className="text-[11px] font-bold text-white/40 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest">
              Ver lista
              <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="divide-y divide-white/[0.03]">
            {recentCustomers.map((customer, i) => (
              <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-bold text-white/60 text-xs">
                    {customer.nome.substring(0, 1)}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white group-hover:text-green-400 transition-colors">{customer.nome}</p>
                    <p className="text-[11px] text-white/30 font-medium">{customer.email}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                      customer.status === 'ativo' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    }`}>
                      {customer.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/20 mt-1.5 font-bold uppercase tracking-tighter">
                    {format(new Date(customer.data), "dd 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-white/[0.02] mt-auto">
             <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                <ShieldCheck size={12} />
                Transações Seguras via Cakto
             </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
