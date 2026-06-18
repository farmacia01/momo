"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Star, ExternalLink, Calendar, CreditCard, AlertTriangle, ArrowRight, ShieldCheck, TrendingUp, Utensils, Bell, Package } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StripeCheckout } from "@/components/StripeCheckout";

interface PlanoClientProps {
  planoAtivo: string;
  assinatura: any;
}

const DORES = [
  { icon: <AlertTriangle size={18} />, text: "Uma dose esquecida zera semanas de progresso — e você nem percebe" },
  { icon: <TrendingUp size={18} />, text: "Sem gráfico de peso, você não sabe se está perdendo gordura ou músculo" },
  { icon: <Utensils size={18} />, text: "A dieta errada sabota o efeito do Mounjaro sem você notar" },
];

const SOLUCOES = [
  { icon: <Bell size={16} />, titulo: "Nunca perca uma dose", desc: "Lembretes automáticos no dia e horário certos" },
  { icon: <TrendingUp size={16} />, titulo: "Veja seu progresso real", desc: "Gráficos de peso, medidas e sintomas semana a semana" },
  { icon: <Utensils size={16} />, titulo: "Receitas que não sabotam", desc: "Geradas por IA para sua fase do tratamento" },
  { icon: <Star size={16} />, titulo: "Histórico para o médico", desc: "Tudo registrado, pronto para a consulta" },
  { icon: <Package size={16} />, titulo: "Alerta de estoque", desc: "Saiba quando comprar antes de ficar sem ampola" },
];

export function PlanoClient({ planoAtivo, assinatura }: PlanoClientProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const isPremium = planoAtivo === 'premium' && assinatura?.status === 'ativa';

  async function openPortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setLoadingPortal(false);
    }
  }

  if (isPremium) {
    return (
      <div className="space-y-6 pb-32">
        <PageHeader title="Meu Plano" />

        <div className="space-y-4 animate-fade-in">
          <div
            className="rounded-[24px] p-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1a0800, #2d1200)",
              border: "1px solid rgba(255,101,0,0.25)",
              boxShadow: "0 8px 24px rgba(255,101,0,0.15)",
            }}
          >
            <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full opacity-10" style={{ background: "#ff6500", filter: "blur(40px)" }} />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,101,0,0.15)", border: "1px solid rgba(255,101,0,0.3)" }}
              >
                <Star size={22} style={{ color: "var(--color-ember)", fill: "var(--color-ember)" }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Momo Premium</h2>
                <p className="text-xs font-medium text-white/60">
                  Assinatura {assinatura.plano}
                </p>
              </div>
            </div>

            <div
              className="space-y-3 rounded-2xl p-4 relative z-10"
              style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-surface-border)" }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <CreditCard size={15} />
                  <span>Status</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-success">
                  Ativa
                </span>
              </div>

              {assinatura.proximo_vencimento && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Calendar size={15} />
                    <span>Próxima renovação</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {format(parseISO(assinatura.proximo_vencimento), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}

              {assinatura.valor && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Star size={15} />
                    <span>Valor</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    R$ {assinatura.valor.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={openPortal}
            disabled={loadingPortal}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              color: "var(--color-text)",
            }}
          >
            <ExternalLink size={16} />
            {loadingPortal ? "Abrindo..." : "Gerenciar Assinatura"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <PageHeader title="Meu Plano" />

      <div className="space-y-5 animate-fade-in">
        {/* HERO */}
        <div
          className="rounded-[24px] p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a0800 0%, #2d1200 60%, #1a0800 100%)",
            boxShadow: "0 12px 40px rgba(255,101,0,0.2)",
          }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: "var(--color-ember)", filter: "blur(50px)", transform: "translate(20%, -20%)" }} />

          <div className="relative z-10 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ember opacity-80">
              Acompanhamento Mounjaro
            </p>
            <h1 className="text-[22px] font-black leading-[1.2] text-white">
              Você investe R$ 1.500/mês no tratamento. Sabe se está funcionando?
            </h1>
            <p className="text-[13px] font-medium leading-relaxed text-white/60">
              Sem dados, você está apostando no escuro.
            </p>
          </div>
        </div>

        {/* DORES */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] ml-1 text-text-dim">
            O que acontece sem acompanhamento
          </p>
          {DORES.map((dor, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <span className="shrink-0 mt-0.5 text-danger">{dor.icon}</span>
              <p className="text-sm font-medium leading-snug text-text">{dor.text}</p>
            </div>
          ))}
        </div>

        {/* SOLUÇÕES */}
        <div
          className="rounded-[24px] p-5 space-y-4"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-dim">
            O que o Momo resolve
          </p>
          {SOLUCOES.map((sol, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--color-ember-glow)", color: "var(--color-ember)" }}
              >
                {sol.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-text">{sol.titulo}</p>
                <p className="text-xs leading-snug mt-0.5 text-text-muted">{sol.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* PREÇO + CTA */}
        <div
          className="rounded-[24px] p-6 space-y-4"
          style={{ background: "var(--color-surface-mid)", border: "1px solid var(--color-surface-border)" }}
        >
          <div className="text-center space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-dim">
              Acesso completo
            </p>
            <div className="flex items-end justify-center gap-1">
              <span className="text-[36px] font-black tracking-tight text-text">R$ 29,90</span>
              <span className="text-sm font-medium mb-2 text-text-muted">/mês</span>
            </div>
          </div>

          {showCheckout ? (
            <StripeCheckout />
          ) : (
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-full text-base font-black text-white transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))",
                boxShadow: "var(--shadow-ember)",
              }}
            >
              Ativar meu acompanhamento
              <ArrowRight size={18} />
            </button>
          )}

          <div className="flex items-center justify-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-text-dim">
              <ShieldCheck size={13} className="text-ember" />
              Pagamento seguro
            </span>
            <span className="text-[11px] text-surface-border">·</span>
            <span className="text-[11px] font-medium text-text-dim">Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </div>
  );
}
