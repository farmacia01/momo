"use client";

import { useState } from "react";
import { m, Variants  } from 'framer-motion';
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Droplet, Package, Scale } from "lucide-react";
import Link from "next/link";
import { WeekTracker } from "./WeekTracker";
import { NotificationBell } from "./NotificationBell";
import { ShareProgressDrawer } from "./ShareProgressDrawer";
import { getTextoProximaDose, type CalculoDose } from "@/lib/utils/dose";
import { usePlano } from "@/hooks/usePlano";
import { BlurPaywall } from "./BlurPaywall";
import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/ui/Skeleton";

const DashboardChart = dynamic(() => import("./DashboardChart").then(m => m.DashboardChart), {
  loading: () => <SkeletonChart height={200} />,
  ssr: false,
});

interface DashboardClientProps {
  userId: string;
  profile: any;
  lastDose: any;
  calculoDose: CalculoDose;
  weeksCompleted: number;
  lastWeight: any;
  weightDelta: string | number;
  daysSinceLastWeight: number | null;
  totalAmpolas: number;
  weights: any[];
  doses: any[];
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export function DashboardClient({
  userId,
  profile,
  lastDose,
  calculoDose,
  weeksCompleted,
  lastWeight,
  weightDelta,
  daysSinceLastWeight,
  totalAmpolas,
  weights,
  doses,
}: DashboardClientProps) {
  const name = profile?.nome || 'Usuário';
  const firstName = name.split(' ')[0];
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  const textosDose = getTextoProximaDose(calculoDose);
  const { isExpirado } = usePlano();

  // Compartilhamento de conquista a partir do dashboard.
  const [shareOpen, setShareOpen] = useState(false);
  const pesoPerdido = Number(weightDelta) > 0 ? Number(weightDelta) : 0;
  const semanasShare = Math.max(1, weeksCompleted);
  const alturaM = (profile?.altura_cm || 0) / 100;
  const imcShare =
    lastWeight?.peso_kg && alturaM > 0 ? lastWeight.peso_kg / (alturaM * alturaM) : 0;
  const firstWeight = weights?.[weights.length - 1];
  const shareData = {
    pesoPerdido,
    semanas: semanasShare,
    imc: imcShare,
    pesoInicial: firstWeight?.peso_kg ?? profile?.peso_inicial ?? null,
    pesoAtual: lastWeight?.peso_kg ?? null,
    mediaSemana: pesoPerdido / semanasShare,
    serie: [...(weights || [])].reverse().map((w) => w.peso_kg).filter(Boolean),
  };

  return (
    <m.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-32"
    >
      {/* Top row */}
      <m.div variants={item} className="flex justify-between items-center">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Olá, {firstName} 👋
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell userId={userId} />
          <div className="w-10 h-10 rounded-full bg-surface-mid text-forest flex items-center justify-center font-bold text-sm">
            {initials}
          </div>
        </div>
      </m.div>

      {/* Hero Section with Week Tracker */}
      <m.div 
        variants={item}
        className="bg-gradient-to-br from-[#1c4d2e] to-[#2d7a4f] rounded-[24px] p-6 text-white shadow-lg"
      >
        <BlurPaywall ativo={isExpirado} mensagem="Veja suas doses semanais no plano Premium">
          <p className="text-[13px] font-bold opacity-70 uppercase tracking-widest mb-4">
            Semana {weeksCompleted + 1} de tratamento
          </p>
          <WeekTracker doseDates={doses?.map(d => d.data_aplicacao) || []} nextDoseDate={calculoDose.data} />
        </BlurPaywall>
      </m.div>

      {/* Metric Grid 2x2 */}
      <BlurPaywall ativo={isExpirado} mensagem="Acompanhe peso, dose e estoque">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard 
            variants={item}
            icon={<Calendar className="w-4 h-4" />}
            label="Próxima dose"
            value={textosDose.principal}
            subValue={textosDose.secundario}
            badge={textosDose.badge}
            badgeColor={
              textosDose.cor === 'red' ? 'bg-red-50 border border-red-200 text-red-600' :
              textosDose.cor === 'green' ? 'bg-green-50 border border-green-200 text-green-600 animate-pulse' :
              textosDose.cor === 'yellow' ? 'bg-yellow-50 border border-yellow-200 text-yellow-600' :
              undefined
            }
            valueColor={textosDose.cor === 'red' ? 'text-red-600' : textosDose.cor === 'green' ? 'text-green-600' : undefined}
            iconBg={textosDose.cor === 'red' ? 'bg-red-50' : textosDose.cor === 'green' ? 'bg-green-50' : 'bg-[#e8f5ee]'}
            iconColor={textosDose.cor === 'red' ? 'text-red-600' : textosDose.cor === 'green' ? 'text-green-600' : 'text-[#16a34a]'}
          />
          <MetricCard
            variants={item}
            icon={<Scale className="w-4 h-4" />}
            label="Peso atual"
            value={`${lastWeight?.peso_kg || '--'}`}
            subValue="kg"
            badge={Number(weightDelta) > 0 ? `-${weightDelta}kg total` : undefined}
            iconBg="bg-[#e8f5ee]"
            iconColor="text-[#16a34a]"
            footer={
              pesoPerdido >= 1 ? (
                <button
                  onClick={() => setShareOpen(true)}
                  className="mt-2 self-start rounded-full bg-[#e8f5ee] px-3 py-1 text-[11px] font-bold text-[#1c4d2e] transition-transform active:scale-95"
                >
                  🎉 Compartilhar conquista
                </button>
              ) : undefined
            }
          />
          <MetricCard 
            variants={item}
            icon={<Droplet className="w-4 h-4" />}
            label="Dose mg"
            value={`${profile?.dose_atual_mg || '2.5'}`}
            subValue="mg por semana"
            iconBg="bg-[#e8f5ee]"
            iconColor="text-[#16a34a]"
          />
          <MetricCard 
            variants={item}
            icon={<Package className="w-4 h-4" />}
            label="Estoque"
            value={`${totalAmpolas}`}
            subValue="ampolas restantes"
            badge={totalAmpolas <= 1 ? "Comprar" : undefined}
            badgeColor={totalAmpolas <= 1 ? "bg-red-100 text-red-600" : undefined}
            iconBg={totalAmpolas === 0 ? "bg-red-50" : "bg-[#e8f5ee]"}
            iconColor={totalAmpolas === 0 ? "text-red-600" : "text-[#16a34a]"}
          />
        </div>
      </BlurPaywall>

      {/* Last Dose Card */}
      <m.div 
        variants={item}
        className="bg-gradient-to-br from-[#1c4d2e] to-[#2d7a4f] rounded-[20px] p-4 flex justify-between items-center shadow-premium"
      >
        <BlurPaywall ativo={isExpirado} mensagem="Gerencie suas doses no plano Premium">
          <div className="flex w-full justify-between items-center">
            <div>
              <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Última aplicação</p>
              <h3 className="text-lg font-bold text-white mt-0.5">{lastDose?.local_aplicacao || 'Não registrada'}</h3>
              <p className="text-[11px] text-white/50 mt-0.5">
                {lastDose ? `Há ${differenceInDays(new Date(), new Date(lastDose.data_aplicacao))} dias · ${lastDose.dose_mg}mg` : '---'}
              </p>
            </div>
            <Link href="/doses" className="bg-white/15 border border-white/20 px-4 py-2 rounded-full text-white text-xs font-bold hover:bg-white/25 transition-all">
              + Registrar
            </Link>
          </div>
        </BlurPaywall>
      </m.div>

      {/* Weight Evolution */}
      <m.div 
        variants={item}
        className="bg-white rounded-[20px] p-5 shadow-premium"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-[15px] font-bold text-gray-900">Evolução do peso</h3>
          <Link href="/saude" className="text-[11px] font-bold text-[#16a34a] hover:underline">Ver tudo</Link>
        </div>
        <BlurPaywall ativo={isExpirado} mensagem="Veja a evolução do seu peso">
          <DashboardChart data={weights} />
        </BlurPaywall>
      </m.div>

      {/* Stats Row */}
      <BlurPaywall ativo={isExpirado}>
        <div className="grid grid-cols-3 gap-3">
          <MiniStatCard 
            variants={item}
            label="IMC atual"
            value={`${profile?.imc || '--'}`}
            delta="Normal"
          />
          <MiniStatCard 
            variants={item}
            label="Semanas"
            value={`${weeksCompleted}`}
          />
          <MiniStatCard
            variants={item}
            label="Perdido"
            value={`${weightDelta}kg`}
            delta="total"
          />
        </div>
      </BlurPaywall>

      <ShareProgressDrawer open={shareOpen} onClose={() => setShareOpen(false)} data={shareData} />
    </m.div>
  );
}

function MetricCard({ icon, label, value, subValue, badge, badgeColor, iconBg, iconColor, valueColor, variants, footer }: any) {
  return (
    <m.div
      variants={variants}
      className="bg-white rounded-[20px] p-4 shadow-premium flex flex-col justify-between"
    >
      <div className="flex justify-between items-start">
        <div className={`h-8 w-8 rounded-[10px] ${iconBg} ${iconColor} flex items-center justify-center`}>
          {icon}
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor || 'bg-[#e8f5ee] text-[#16a34a]'}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col">
        <p className="text-[11px] font-medium text-gray-400">{label}</p>
        <div className="flex flex-col mt-0.5">
          <h4 className={`text-[18px] font-bold tracking-tight line-clamp-1 ${valueColor || 'text-gray-900'}`}>{value}</h4>
          <span className="text-[11px] font-medium text-gray-400">{subValue}</span>
        </div>
        {footer}
      </div>
    </m.div>
  );
}

function MiniStatCard({ label, value, delta, variants }: any) {
  return (
    <m.div 
      variants={variants}
      className="bg-white rounded-[16px] p-3 shadow-premium"
    >
      <p className="text-[10px] font-medium text-gray-400">{label}</p>
      <h5 className="text-[17px] font-bold text-gray-900 mt-1 tracking-tight">{value}</h5>
      {delta && <p className="text-[10px] font-bold text-[#16a34a] mt-0.5">{delta}</p>}
    </m.div>
  );
}
