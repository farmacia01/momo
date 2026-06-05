"use client";

import { useState } from "react";
import { m, Variants } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Droplet, Package, Calendar } from "lucide-react";

import { NotificationBell } from "./NotificationBell";
import { ShareProgressDrawer } from "./ShareProgressDrawer";
import { getTextoProximaDose, type CalculoDose } from "@/lib/utils/dose";
import { usePlano } from "@/hooks/usePlano";
import { BlurPaywall } from "./BlurPaywall";
import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { WeightCard } from "./WeightCard";

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

function MetricCard({ label, value, subValue }: { label: string, value: string, subValue?: string }) {
  return (
    <m.div variants={item} className="card flex h-full flex-col justify-center p-4 text-center">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tighter text-text-primary">{value}</p>
      {subValue && <p className="mt-1 text-xs text-text-secondary">{subValue}</p>}
    </m.div>
  );
}

function ListItem({ icon, title, value, subValue, iconColor, href }: { icon: React.ReactNode, title: string, value: string, subValue?: string, iconColor?: string, href?: string }) {
  const colors: Record<string, string> = {
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    default: 'bg-primary/10 text-primary'
  };
  const colorClass = colors[iconColor as keyof typeof colors] || colors.default;

  const content = (
    <div className="flex items-center gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-bold text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">{value}</p>
      </div>
      {subValue && <p className="text-sm font-medium text-text-secondary">{subValue}</p>}
    </div>
  );

  if (href) {
    return <Link href={href} className="block transition-transform active:scale-[0.98]">{content}</Link>
  }
  return content;
}

export function DashboardClient({
  userId,
  profile,
  calculoDose,
  weeksCompleted,
  lastWeight,
  weightDelta,
  totalAmpolas,
  weights,
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

  const pesoPerdido = Number(weightDelta) >= 0 ? Number(weightDelta) : 0;
  const mediaSemanal = weeksCompleted > 0 ? (pesoPerdido / weeksCompleted).toFixed(1) : "0.0";
  
  const alturaM = (profile?.altura_cm || 0) / 100;
  const imcShare = lastWeight?.peso_kg && alturaM > 0 ? lastWeight.peso_kg / (alturaM * alturaM) : 0;
  const firstWeight = weights?.[weights.length - 1];

  const shareData = {
    pesoPerdido,
    semanas: Math.max(1, weeksCompleted),
    imc: imcShare,
    pesoInicial: firstWeight?.peso_kg ?? profile?.peso_inicial ?? null,
    pesoAtual: lastWeight?.peso_kg ?? null,
    mediaSemana: parseFloat(mediaSemanal.toString()),
    serie: [...(weights || [])].reverse().map((w) => w.peso_kg).filter(Boolean),
  };
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <m.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      

      <BlurPaywall ativo={isExpirado} mensagem="Acompanhe doses, peso e estoque">
        <div className="space-y-6">
          <WeightCard 
            currentWeight={lastWeight?.peso_kg}
            weightDelta={pesoPerdido}
          />
          
          <div className="grid grid-cols-3 gap-4">
            <MetricCard 
              label="IMC"
              value={profile?.imc?.toFixed(1) || '--'}
            />
            <MetricCard 
              label="Perdido"
              value={`${pesoPerdido.toFixed(1)}`}
              subValue="kg"
            />
            <MetricCard 
              label="Média"
              value={`${mediaSemanal}`}
              subValue="kg/sem"
            />
          </div>

          <div className="card p-4 space-y-1">
            <ListItem 
              icon={<Calendar className="h-5 w-5" />} 
              iconColor={textosDose.cor}
              title="Próxima dose" 
              value={textosDose.principal}
              subValue={textosDose.secundario}
              href="/doses"
            />
            <ListItem 
              icon={<Package className="h-5 w-5" />}
              iconColor={totalAmpolas === 0 ? 'red' : undefined}
              title="Estoque"
              value={`${totalAmpolas} ampolas`}
              href="/estoque"
            />
            <ListItem 
              icon={<Droplet className="h-5 w-5" />}
              title="Dose semanal"
              value={`${profile?.dose_atual_mg || '2.5'} mg`}
              href="/configuracoes/tratamento"
            />
          </div>

          <m.div variants={item} className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">Evolução do peso</h3>
              <Link href="/saude" className="text-sm font-bold text-primary hover:underline">Ver tudo</Link>
            </div>
            <DashboardChart data={weights} />
          </m.div>

           {pesoPerdido >= 1 && (
              <m.div variants={item}>
                <button
                  onClick={() => setShareOpen(true)}
                  className="btn-primary w-full"
                >
                  🎉 Compartilhar Conquista
                </button>
              </m.div>
           )}
        </div>
      </BlurPaywall>
      
      <ShareProgressDrawer open={shareOpen} onClose={() => setShareOpen(false)} data={shareData} />
    </m.div>
  );
}
