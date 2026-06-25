"use client";

import { useState, useEffect } from "react";
import { m, Variants } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Droplet, Package, Scale, Zap } from "lucide-react";
import Link from "next/link";
import { WeekTracker } from "./WeekTracker";
import { NotificationBell } from "./NotificationBell";
import { ShareProgressDrawer } from "./ShareProgressDrawer";
import { getTextoProximaDose, type CalculoDose } from "@/lib/utils/dose";
import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { usePlano } from "@/hooks/usePlano";
import { PaywallCard } from "./PaywallCard";
import { getPushStatus, pushSupported, subscribeToPush } from "@/lib/push-client";
import toast from "react-hot-toast";
import { useTheme } from "@/app/providers";

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
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
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

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isExpirado } = usePlano();
  const textosDose = getTextoProximaDose(calculoDose);
  const [showPushBanner, setShowPushBanner] = useState(false);

  useEffect(() => {
    if (pushSupported()) {
      getPushStatus().then(enabled => {
        if (!enabled && Notification.permission !== "denied") setShowPushBanner(true);
      });
    }
  }, []);

  const handleEnablePush = async () => {
    try {
      await subscribeToPush(userId);
      setShowPushBanner(false);
      toast.success("Notificações ativadas!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao ativar notificações");
    }
  };

  const [shareOpen, setShareOpen] = useState(false);
  const pesoPerdido = Number(weightDelta) > 0 ? Number(weightDelta) : 0;
  const semanasShare = Math.max(1, weeksCompleted);
  const alturaM = (profile?.altura_cm || 0) / 100;
  const imcShare = lastWeight?.peso_kg && alturaM > 0 ? lastWeight.peso_kg / (alturaM * alturaM) : 0;
  const firstWeight = weights?.[weights.length - 1];
  const startDate = profile?.data_inicio_tratamento ? new Date(profile.data_inicio_tratamento) : new Date();
  const diasTratamento = Math.max(1, differenceInDays(new Date(), startDate));
  const shareData = {
    pesoPerdido,
    semanas: semanasShare,
    dias: diasTratamento,
    imc: imcShare,
    pesoInicial: firstWeight?.peso_kg ?? profile?.peso_inicial ?? null,
    pesoAtual: lastWeight?.peso_kg ?? null,
    mediaSemana: semanasShare > 0 ? pesoPerdido / semanasShare : 0,
    serie: [...(weights || [])].reverse().map((w) => w.peso_kg).filter(Boolean),
    nome: profile?.nome ?? undefined,
    pesoMeta: profile?.peso_meta ?? null,
  };

  const doseColor =
    textosDose.cor === 'red' ? '#ef4444' :
    textosDose.cor === 'green' ? '#22c55e' :
    textosDose.cor === 'yellow' ? '#f59e0b' :
    '#ff6500';

  const heroCardBg = isDark
    ? "linear-gradient(135deg, #1a0a00 0%, #2d1000 40%, #1a0800 100%)"
    : "linear-gradient(135deg, #fff4ed 0%, #ffead4 40%, #fff7ed 100%)";
  const heroSubtextColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(255,101,0,0.7)";
  const lastDoseCardBg = isDark
    ? "linear-gradient(135deg, #1a0a00, #2d1200)"
    : "linear-gradient(135deg, #fff4ed, #ffe8cc)";
  const lastDoseSubtextColor = isDark ? "rgba(255,255,255,0.4)" : "var(--color-text-muted)";

  if (isExpirado) {
    return (
      <div className="space-y-5 pb-32">
        <div className="flex justify-between items-center pt-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#ff6500" }}>
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <h1 className="text-[26px] font-bold tracking-tight leading-tight" style={{ color: "var(--color-text)" }}>
              Olá, {firstName}
            </h1>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #ff6500, #cc4c00)" }}
          >
            {initials}
          </div>
        </div>
        <PaywallCard
          recurso="Dashboard Momo Premium"
          descricao="Assine para acompanhar doses, peso e evolução do seu tratamento."
        />
      </div>
    );
  }

  return (
    <m.div variants={container} initial="hidden" animate="show" className="space-y-5 pb-32">

      {/* Top row */}
      <m.div variants={item} className="flex justify-between items-center pt-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#ff6500" }}>
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <h1 className="text-[26px] font-bold tracking-tight leading-tight" style={{ color: "var(--color-text)" }}>
            Olá, {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell userId={userId} />
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #ff6500, #cc4c00)" }}
          >
            {initials}
          </div>
        </div>
      </m.div>

      {/* Push Banner */}
      {showPushBanner && (
        <m.div
          variants={item}
          className="flex items-center justify-between gap-4 p-4 rounded-3xl"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,101,0,0.15)", color: "#ff6500" }}
            >
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: "var(--color-text)" }}>Ativar Notificações</p>
              <p className="text-[11px] leading-tight mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Receba lembretes importantes do seu tratamento.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPushBanner(false)}
              className="px-3 py-2 text-[11px] font-bold"
              style={{ color: "var(--color-text-dim)" }}
            >
              Depois
            </button>
            <button
              onClick={handleEnablePush}
              className="px-4 py-2 text-white text-[11px] font-bold rounded-xl active:scale-95 transition-all"
              style={{ background: "#ff6500", boxShadow: "0 4px 12px rgba(255,101,0,0.35)" }}
            >
              Ativar
            </button>
          </div>
        </m.div>
      )}

      {/* Hero — Week Tracker */}
      <m.div
        variants={item}
        className="rounded-[24px] p-6"
        style={{
          background: heroCardBg,
          border: "1px solid rgba(255,101,0,0.2)",
          boxShadow: "0 8px 32px rgba(255,101,0,0.1)",
        }}
      >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1.5 w-6 rounded-full" style={{ background: "#ff6500" }} />
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: heroSubtextColor }}>
              Semana {weeksCompleted + 1} de tratamento
            </p>
          </div>
          <WeekTracker doseDates={doses?.map(d => d.data_aplicacao) || []} nextDoseDate={calculoDose.data} />
      </m.div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 gap-3">
          <MetricCard
            variants={item}
            icon={<Calendar className="w-4 h-4" />}
            label="Próxima dose"
            value={textosDose.principal}
            subValue={textosDose.secundario}
            badge={textosDose.badge}
            accentColor={doseColor}
            iconBg={`rgba(${doseColor === '#ef4444' ? '239,68,68' : doseColor === '#22c55e' ? '34,197,94' : '255,101,0'},0.12)`}
            iconColor={doseColor}
          />
          <MetricCard
            variants={item}
            icon={<Scale className="w-4 h-4" />}
            label="Peso atual"
            value={`${lastWeight?.peso_kg || '--'}`}
            subValue="kg"
            badge={Number(weightDelta) > 0 ? `-${weightDelta}kg total` : undefined}
            accentColor="#ff6500"
            iconBg="rgba(255,101,0,0.12)"
            iconColor="#ff6500"
            footer={
              pesoPerdido >= 1 ? (
                <button
                  onClick={() => setShareOpen(true)}
                  className="mt-2 self-start rounded-full px-3 py-1 text-[11px] font-bold transition-transform active:scale-95"
                  style={{ background: "rgba(255,101,0,0.15)", color: "#ff7a1a" }}
                >
                  Compartilhar conquista
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
            accentColor="#ff6500"
            iconBg="rgba(255,101,0,0.12)"
            iconColor="#ff6500"
          />
          <MetricCard
            variants={item}
            icon={<Package className="w-4 h-4" />}
            label="Estoque"
            value={`${totalAmpolas}`}
            subValue="ampolas restantes"
            badge={totalAmpolas <= 1 ? "Comprar" : undefined}
            accentColor={totalAmpolas === 0 ? "#ef4444" : "#ff6500"}
            iconBg={totalAmpolas === 0 ? "rgba(239,68,68,0.12)" : "rgba(255,101,0,0.12)"}
            iconColor={totalAmpolas === 0 ? "#ef4444" : "#ff6500"}
          />
        </div>

      {/* Last Dose Card */}
      <m.div
        variants={item}
        className="rounded-[20px] p-4"
        style={{ background: lastDoseCardBg, border: "1px solid rgba(255,101,0,0.2)" }}
      >
          <div className="flex w-full justify-between items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: lastDoseSubtextColor }}>
                Última aplicação
              </p>
              <h3 className="text-lg font-bold mt-0.5" style={{ color: "var(--color-text)" }}>
                {lastDose?.local_aplicacao || 'Não registrada'}
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: lastDoseSubtextColor }}>
                {lastDose
                  ? `Há ${differenceInDays(new Date(), new Date(lastDose.data_aplicacao))} dias · ${lastDose.dose_mg}mg`
                  : '---'}
              </p>
            </div>
            <Link
              href="/doses"
              className="px-4 py-2 rounded-full text-white text-xs font-bold transition-all"
              style={{ background: "#ff6500", boxShadow: "0 4px 12px rgba(255,101,0,0.35)" }}
            >
              + Registrar
            </Link>
          </div>
      </m.div>

      {/* Weight Evolution */}
      <m.div
        variants={item}
        className="rounded-[20px] p-5"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[15px] font-bold" style={{ color: "var(--color-text)" }}>Evolução do peso</h3>
          <Link href="/saude" className="text-[11px] font-bold" style={{ color: "#ff6500" }}>Ver tudo</Link>
        </div>
        <DashboardChart data={weights} />
      </m.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStatCard variants={item} label="IMC atual" value={imcShare > 0 ? imcShare.toFixed(1) : '--'} delta={imcShare > 0 ? (imcShare < 25 ? 'Normal' : imcShare < 30 ? 'Sobrepeso' : 'Obesidade') : ''} />
        <MiniStatCard variants={item} label="Semana atual" value={`${weeksCompleted + 1}`} />
        <MiniStatCard variants={item} label="Perdido" value={`${weightDelta}kg`} delta="total" />
      </div>

      <ShareProgressDrawer open={shareOpen} onClose={() => setShareOpen(false)} data={shareData} />
    </m.div>
  );
}

function MetricCard({ icon, label, value, subValue, badge, accentColor, iconBg, iconColor, variants, footer }: any) {
  return (
    <m.div
      variants={variants}
      className="rounded-[20px] p-4 flex flex-col justify-between"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
    >
      <div className="flex justify-between items-start">
        <div
          className="h-8 w-8 rounded-[10px] flex items-center justify-center"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        {badge && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: `rgba(${accentColor === '#ef4444' ? '239,68,68' : accentColor === '#22c55e' ? '34,197,94' : '255,101,0'},0.12)`,
              color: accentColor,
              border: `1px solid ${accentColor}30`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col">
        <p className="text-[11px] font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</p>
        <div className="flex flex-col mt-0.5">
          <h4 className="text-[18px] font-bold tracking-tight line-clamp-1" style={{ color: "var(--color-text)" }}>{value}</h4>
          <span className="text-[11px] font-medium" style={{ color: "var(--color-text-dim)" }}>{subValue}</span>
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
      className="rounded-[16px] p-3"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
    >
      <p className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <h5 className="text-[17px] font-bold mt-1 tracking-tight" style={{ color: "var(--color-text)" }}>{value}</h5>
      {delta && <p className="text-[10px] font-bold mt-0.5" style={{ color: "#ff6500" }}>{delta}</p>}
    </m.div>
  );
}
