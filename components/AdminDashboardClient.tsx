"use client";

import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Activity,
  Zap,
  Clock,
  ArrowRight,
  Building2,
  Users,
  GitBranch,
  ShieldAlert,
  ChevronRight,
  Share2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

const EMBER = "#ff6500";
const GATE_COLORS = [
  "#22c55e",  // Liberados — green
  "#f59e0b",  // Em risco — amber
  "#ef4444",  // Bloqueados — red
  "rgba(255,101,0,0.25)", // Novos
];

interface Metrics {

  totalUsers: number;
  newThisMonth: number;
  kFactor: number;
  gateBlocked: number;
  gateCleared: number;
  gateAtRisk: number;
  totalReferralInvites: number;
  activeUsers30d: number;
  activeUsers7d: number;
  activeUsersToday: number;
}

interface AdminDashboardClientProps {
  metrics: Metrics;
  growthChart: { date: string; value: number }[];
  invitesChart: { date: string; value: number }[];
  gateDistribution: { name: string; value: number }[];
  recentUsers: { id: string; nome: string; email: string; data: string; inviteCount: number }[];
  alerts: { type: "warning" | "info" | "danger"; text: string }[];
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as [number,number,number,number] } } };

const ALERT_STYLES = {
  danger:  { border: "border-red-500/20",   bg: "bg-red-500/10",   color: "text-red-500",   iconBg: "bg-red-500/20" },
  warning: { border: "border-amber-500/20", bg: "bg-amber-500/10", color: "text-amber-500", iconBg: "bg-amber-500/20" },
  info:    { border: "border-blue-500/20",  bg: "bg-blue-500/10",  color: "text-blue-500",  iconBg: "bg-blue-500/20" },
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-surface-border)",
    borderRadius: "16px",
    padding: "12px 16px",
    boxShadow: "var(--shadow-card)",
  },
  itemStyle: { color: EMBER, fontSize: "14px", fontWeight: "700" },
  labelStyle: { color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" as const, fontWeight: "600" },
};

export function AdminDashboardClient({
  metrics,
  growthChart,
  invitesChart,
  gateDistribution,
  recentUsers,
  alerts,
}: AdminDashboardClientProps) {

  const kpiCards = [
    {
      label: "Usuários Ativos (30d)",
      value: metrics.activeUsers30d,
      sub: "Engajamento mensal do app",
      icon: Activity,
      trend: metrics.activeUsers30d > 0 ? `${metrics.activeUsers30d} engajados` : "Nenhum ainda",
      trendUp: metrics.activeUsers30d > 0,
      href: "/admin/usuarios",
    },
    {
      label: "Total Usuários",
      value: metrics.totalUsers,
      sub: `+${metrics.newThisMonth} novos este mês`,
      icon: Users,
      trend: `+${metrics.newThisMonth} este mês`,
      trendUp: metrics.newThisMonth > 0,
      href: "/admin/usuarios",
    },
    {
      label: "K-Factor Viral",
      value: metrics.kFactor.toFixed(2),
      sub: `${metrics.totalReferralInvites} convites enviados no total`,
      icon: GitBranch,
      trend: metrics.kFactor >= 1 ? "Crescimento viral ✓" : metrics.kFactor > 0.3 ? "Crescendo" : "Baixo",
      trendUp: metrics.kFactor >= 0.5,
      href: "/admin/crescimento",
    },
    {
      label: "No Gate",
      value: metrics.gateBlocked,
      sub: `${metrics.gateAtRisk} em risco · ${metrics.gateCleared} liberados`,
      icon: ShieldAlert,
      trend: metrics.gateBlocked > 0 ? "Ação necessária" : "Tudo ok",
      trendUp: metrics.gateBlocked === 0,
      href: "/admin/crescimento",
    },
  ];

  const totalGate = gateDistribution.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 md:space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-[#ff6500] animate-pulse shadow-[0_0_8px_rgba(255,101,0,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff6500]">Sistema Operacional</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text">Command Center</h1>
          <p className="mt-1 text-sm text-text-muted">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface border border-surface-border">
            <Clock size={14} className="text-text-muted" />
            <span className="text-sm font-mono font-medium text-text">{format(new Date(), "HH:mm")}</span>
          </div>
          <Link
            href="/admin/crescimento"
            className="flex h-10 items-center gap-2 px-5 rounded-full text-white text-sm font-semibold transition-all hover:-translate-y-0.5 active:scale-95 bg-gradient-to-br from-[#ff7a1a] to-[#cc4c00] shadow-[0_4px_16px_rgba(255,101,0,0.30)]"
          >
            <TrendingUp size={14} />
            Crescimento
          </Link>
        </div>
      </motion.div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.map((alert, i) => {
            const s = ALERT_STYLES[alert.type];
            return (
              <motion.div key={i} variants={item} className={`flex items-center gap-4 p-4 rounded-2xl border ${s.bg} ${s.border}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${s.iconBg}`}>
                  <AlertTriangle size={16} className={s.color} />
                </div>
                <span className={`text-xs font-semibold leading-relaxed ${s.color}`}>{alert.text}</span>
                {alert.type === "danger" && (
                  <Link href="/admin/crescimento" className={`ml-auto text-xs font-bold underline shrink-0 ${s.color}`}>Ver →</Link>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <motion.div key={card.label} variants={item}>
            <Link
              href={card.href}
              className="group relative overflow-hidden rounded-[24px] p-6 bg-surface border border-surface-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff6500] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-text">
                <card.icon size={120} />
              </div>
              <div className="flex items-center justify-between mb-6 relative">
                <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-[#ff6500]/10 border border-[#ff6500]/20">
                  <card.icon size={18} className="text-[#ff6500]" strokeWidth={2.5} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  card.trendUp
                    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                    : "text-[#ff6500] bg-[#ff6500]/10 border-[#ff6500]/20"
                }`}>
                  {card.trend}
                </span>
              </div>
              <div className="relative flex-1">
                <p className="text-xs font-semibold text-text-muted mb-1">{card.label}</p>
                <p className="text-3xl font-bold tracking-tight text-text leading-none">{card.value}</p>
                <p className="text-xs text-text-dim mt-2 font-medium">{card.sub}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Sub-metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Ativos 30d",  value: metrics.activeUsers30d, icon: Users },
          { label: "Ativos 7d",     value: metrics.activeUsers7d,      icon: Activity },
          { label: "Ativos Hoje",   value: metrics.activeUsersToday,   icon: Zap },
        ].map((mini) => (
          <motion.div key={mini.label} variants={item} className="rounded-[20px] p-5 flex items-center gap-4 bg-surface border border-surface-border hover:bg-surface-hover transition-colors">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 bg-surface-mid border border-surface-border text-text-muted">
              <mini.icon size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">{mini.label}</p>
              <p className="text-xl font-bold text-text leading-tight tracking-tight">{mini.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* User growth area chart */}
        <motion.div variants={item} className="lg:col-span-8 rounded-[24px] p-6 sm:p-8 bg-surface border border-surface-border">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h4 className="text-lg font-bold text-text tracking-tight">Crescimento de Usuários</h4>
              <p className="text-sm text-text-muted mt-1">Novos cadastros por mês (últimos 6 meses)</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ff6500]/10 border border-[#ff6500]/20">
              <span className="h-2 w-2 rounded-full bg-[#ff6500]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff6500]">Cadastros</span>
            </div>
          </div>
          <div className="h-[240px] md:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthChart}>
                <defs>
                  <linearGradient id="emberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={EMBER} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-surface-border)" strokeDasharray="4 4" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontWeight: 600 }} dy={14} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontWeight: 600 }} width={36} />
                <Tooltip cursor={{ stroke: "var(--color-surface-border)", strokeWidth: 1, strokeDasharray: "4 4" }} {...tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke={EMBER} strokeWidth={3} fill="url(#emberGrad)" activeDot={{ r: 6, fill: EMBER, stroke: "var(--color-surface)", strokeWidth: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gate donut */}
        <motion.div variants={item} className="lg:col-span-4 rounded-[24px] p-6 sm:p-8 bg-surface border border-surface-border flex flex-col">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-text tracking-tight">Gate de Convites</h4>
            <p className="text-sm text-text-muted mt-1">Status dos usuários &gt;7 dias</p>
          </div>
          <div className="relative flex-1 flex items-center justify-center min-h-[180px]">
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Total</span>
              <span className="text-4xl font-bold text-text mt-1">{totalGate}</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={gateDistribution} innerRadius={68} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none" animationBegin={200} animationDuration={900} cornerRadius={5}>
                  {gateDistribution.map((_, i) => <Cell key={i} fill={GATE_COLORS[i % GATE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle.contentStyle} itemStyle={tooltipStyle.itemStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {gateDistribution.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-surface-mid border border-surface-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GATE_COLORS[i] }} />
                  <span className="text-xs font-semibold text-text-muted">{d.name}</span>
                </div>
                <span className="text-sm font-bold text-text">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Referral invites bar + Recent users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Invites bar chart */}
        <motion.div variants={item} className="rounded-[24px] p-6 sm:p-8 bg-surface border border-surface-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[#ff6500]/10 border border-[#ff6500]/20 text-[#ff6500]">
              <Share2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-text tracking-tight">Convites Enviados</h4>
              <p className="text-sm text-text-muted">Por mês — tração do programa referral</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Total",      val: metrics.totalReferralInvites },
              { label: "K-Factor",   val: metrics.kFactor.toFixed(2) },
              { label: "Ativos 30d", val: metrics.activeUsers30d },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-4 rounded-2xl bg-surface-mid border border-surface-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-text tracking-tight">{s.val}</p>
              </div>
            ))}
          </div>

          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invitesChart} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke="var(--color-surface-border)" strokeDasharray="3 3" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontWeight: 600 }} dy={10} />
                <Tooltip cursor={{ fill: "var(--color-surface-mid)" }} contentStyle={tooltipStyle.contentStyle} itemStyle={tooltipStyle.itemStyle} labelStyle={tooltipStyle.labelStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
                  {invitesChart.map((_, i) => (
                    <Cell key={i} fill={i === invitesChart.length - 1 ? EMBER : "rgba(255,101,0,0.25)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent users */}
        <motion.div variants={item} className="rounded-[24px] bg-surface border border-surface-border flex flex-col overflow-hidden">
          <div className="px-6 md:px-8 py-6 flex justify-between items-center border-b border-surface-border">
            <div>
              <h4 className="text-lg font-bold text-text tracking-tight">Novos Usuários</h4>
              <p className="text-sm text-text-muted mt-0.5">Cadastros mais recentes</p>
            </div>
            <Link href="/admin/usuarios" className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-[#ff6500] transition-colors">
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-surface-border flex-1">
            {recentUsers.map((u) => (
              <div key={u.id} className="px-6 md:px-8 py-3.5 flex items-center justify-between group hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold bg-[#ff6500]/10 text-[#ff6500] border border-[#ff6500]/20 shrink-0">
                    {u.nome.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text leading-tight group-hover:text-[#ff6500] transition-colors">{u.nome}</p>
                    <p className="text-xs text-text-muted mt-0.5">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      u.inviteCount >= 3
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        : u.inviteCount > 0
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        : "bg-surface-mid border-surface-border text-text-dim"
                    }`}>
                      {u.inviteCount >= 3 ? "✓ Gate ok" : u.inviteCount > 0 ? `${u.inviteCount}/3 conv.` : "0 convites"}
                    </span>
                    <p className="text-[11px] mt-1.5 font-medium text-text-dim">
                      {format(new Date(u.data), "dd MMM", { locale: ptBR })}
                    </p>
                  </div>
                  <Link
                    href={`/admin/usuarios?search=${encodeURIComponent(u.email)}`}
                    className="h-8 w-8 rounded-full bg-surface-mid border border-surface-border flex items-center justify-center text-text-muted hover:text-white hover:bg-[#ff6500] hover:border-[#ff6500] transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-surface-border bg-surface-mid">
            <Link href="/admin/crescimento" className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#ff6500] hover:underline">
              <TrendingUp size={13} />
              Ver análise completa de crescimento
            </Link>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
