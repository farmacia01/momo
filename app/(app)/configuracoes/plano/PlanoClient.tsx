"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  Star, Calendar, CreditCard, ShieldCheck, TrendingUp, Utensils,
  Bell, Package, Zap, Check, Clock, FlameKindling,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StripeCheckout } from "@/components/StripeCheckout";

type PlanType = "mensal" | "trimestral";

interface PlanoClientProps {
  planoAtivo: string;
  assinatura: any;
}

const PLANOS = {
  mensal: {
    label: "Mensal",
    preco: "R$ 29,90",
    precoMes: "29,90/mês",
    detalhe: "7 dias grátis — cancele quando quiser",
    valorDisplay: "R$ 29,90",
    periodicidade: "mensal",
    badge: null,
    trial: true,
  },
  trimestral: {
    label: "Trimestral",
    preco: "R$ 69,90",
    precoMes: "23,30/mês",
    detalhe: "Equivale a R$ 23,30/mês — sem trial",
    economia: "22% OFF",
    valorDisplay: "R$ 69,90",
    periodicidade: "trimestral",
    badge: "MAIS POPULAR",
    trial: false,
  },
};

const BENEFICIOS = [
  { icon: Bell,       titulo: "Lembrete de dose",        desc: "Notificação no dia e horário certos do seu ciclo" },
  { icon: TrendingUp, titulo: "Gráfico de evolução",      desc: "Peso, IMC e medidas semana a semana" },
  { icon: Utensils,   titulo: "Receitas para sua fase",   desc: "IA que conhece o Mounjaro e suas restrições" },
  { icon: Star,       titulo: "Relatório para o médico",  desc: "Histórico completo em um clique" },
  { icon: Package,    titulo: "Alerta de estoque",        desc: "Aviso antes de ficar sem ampola" },
];

export function PlanoClient({ planoAtivo, assinatura }: PlanoClientProps) {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanType>("trimestral");

  const isPremium = planoAtivo === "premium" && assinatura?.status === "ativa";
  const isCancelScheduled = assinatura?.cancel_at_period_end === true;
  const planoContratado: PlanType = assinatura?.plano_tipo === "trimestral" ? "trimestral" : "mensal";
  const infoContratado = PLANOS[planoContratado];
  const planoAtual = PLANOS[plan];

  async function handlePortal() {
    setLoadingPortal(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalError(data.error || "Erro ao abrir portal.");
        setLoadingPortal(false);
      }
    } catch {
      setPortalError("Erro ao conectar com o servidor.");
      setLoadingPortal(false);
    }
  }

  /* ── PREMIUM ATIVO ── */
  if (isPremium) {
    return (
      <div className="space-y-6 pb-32">
        <PageHeader title="Meu Plano" />

        <div className="space-y-4 animate-fade-in">
          {/* Card do plano atual */}
          <div
            className="rounded-[24px] p-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #180900, #2e1200)",
              border: "1px solid rgba(255,101,0,0.22)",
              boxShadow: "0 8px 28px rgba(255,101,0,0.14)",
            }}
          >
            <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full opacity-10" style={{ background: "#ff6500", filter: "blur(50px)" }} />

            <div className="flex items-center gap-3 mb-5 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,101,0,0.15)", border: "1px solid rgba(255,101,0,0.28)" }}>
                <Star size={22} style={{ color: "#ff6500", fill: "#ff6500" }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white">Momo Premium</h2>
                  {planoContratado === "trimestral" && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black" style={{ background: "rgba(255,101,0,0.2)", color: "#ff6500" }}>
                      <Zap size={7} fill="currentColor" /> 22% OFF
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Assinatura {planoContratado === "trimestral" ? "Trimestral" : "Mensal"}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl p-4 relative z-10" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <CreditCard size={14} />
                  <span>Status</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider" style={{ color: "#4ade80" }}>
                  <Check size={12} strokeWidth={3} /> Ativa
                </span>
              </div>

              {assinatura?.current_period_end && (
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 text-sm min-w-0" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <Calendar size={14} className="shrink-0" />
                    <span className="truncate">
                      {isCancelScheduled ? "Encerra em" : "Próxima renovação"}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white shrink-0">
                    {format(parseISO(assinatura.current_period_end), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Star size={14} />
                  <span>Valor do plano</span>
                </div>
                <span className="text-sm font-bold text-white">{infoContratado.valorDisplay}</span>
              </div>
            </div>
          </div>

          {isCancelScheduled ? (
            <div className="w-full py-4 px-5 rounded-[16px] text-center text-sm font-medium" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(255,255,255,0.5)" }}>
              Cancelamento agendado para{" "}
              {assinatura.current_period_end
                ? format(parseISO(assinatura.current_period_end), "dd/MM/yyyy", { locale: ptBR })
                : "fim do período"}
              <br />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Você ainda tem acesso até essa data.
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={handlePortal}
                disabled={loadingPortal}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)", color: "var(--color-text-muted)" }}
              >
                {loadingPortal ? "Abrindo..." : "Gerenciar assinatura"}
              </button>
              {portalError && <p className="text-xs text-center text-red-400 mt-1">{portalError}</p>}
            </>
          )}
        </div>
      </div>
    );
  }

  /* ── UPGRADE / SEM PLANO ── */
  return (
    <div className="pb-32">
      <PageHeader title="Assinar Momo" />

      <div className="space-y-5 animate-fade-in">
        {/* Hero */}
        <div
          className="rounded-[24px] p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(150deg, #160700 0%, #2e1100 55%, #160700 100%)",
            boxShadow: "0 12px 40px rgba(255,101,0,0.18)",
          }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: "#ff6500", filter: "blur(55px)", transform: "translate(25%, -25%)" }} />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(255,101,0,0.15)", border: "1px solid rgba(255,101,0,0.3)" }}>
              <FlameKindling size={12} style={{ color: "#ff6500" }} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#ff6500" }}>Momo Premium</span>
            </div>
            <h1 className="text-[21px] font-black leading-[1.25] text-white">
              Você investe R$ 1.500/mês no Mounjaro. O Momo garante que vale.
            </h1>
            <p className="text-[13px] font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Sem dados, você está apostando no escuro.
            </p>
          </div>
        </div>

        {/* Dores */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: "var(--color-text-dim)" }}>
            Sem acompanhamento
          </p>
          {[
            "Dose esquecida = semana de tratamento perdida. Sem lembrete, acontece.",
            "Você perdeu gordura ou músculo? Sem gráfico, é impossível saber.",
            "A dieta errada anula o Mounjaro — e você nem percebe.",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
              <span className="mt-0.5 shrink-0">⚠️</span>
              <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-text)" }}>{text}</p>
            </div>
          ))}
        </div>

        {/* Benefícios */}
        <div className="rounded-[24px] p-5 space-y-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-text-dim)" }}>
            O que está incluído
          </p>
          {BENEFICIOS.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,101,0,0.1)", color: "#ff6500" }}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{b.titulo}</p>
                  <p className="text-xs leading-snug mt-0.5" style={{ color: "var(--color-text-muted)" }}>{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seletor + Checkout */}
        <div className="rounded-[24px] p-6 space-y-5" style={{ background: "var(--color-surface-mid)", border: "1px solid var(--color-surface-border)" }}>
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-text-dim)" }}>
              Escolha seu plano
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["trimestral", "mensal"] as PlanType[]).map((p) => {
                const info = PLANOS[p];
                const active = plan === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPlan(p)}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: "16px 14px 14px",
                      borderRadius: 18,
                      border: active ? "2px solid #ff6500" : "1.5px solid rgba(255,255,255,0.08)",
                      background: active
                        ? "linear-gradient(145deg, rgba(255,101,0,0.14), rgba(255,101,0,0.06))"
                        : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      textAlign: "left",
                      boxShadow: active ? "0 4px 16px rgba(255,101,0,0.18)" : "none",
                    }}
                  >
                    {info.badge && (
                      <span style={{
                        position: "absolute",
                        top: -11,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: 8,
                        fontWeight: 900,
                        letterSpacing: "0.1em",
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: "linear-gradient(135deg, #ff6500, #e05500)",
                        color: "#fff",
                        whiteSpace: "nowrap",
                      }}>
                        {info.badge}
                      </span>
                    )}
                    {"economia" in info && (
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 9,
                        fontWeight: 900,
                        letterSpacing: "0.06em",
                        padding: "2px 7px",
                        borderRadius: 99,
                        background: active ? "rgba(255,101,0,0.25)" : "rgba(255,255,255,0.07)",
                        color: active ? "#ff6500" : "rgba(255,255,255,0.4)",
                        marginBottom: 6,
                      }}>
                        <Zap size={8} fill="currentColor" /> {info.economia}
                      </span>
                    )}
                    {!("economia" in info) && <div style={{ marginBottom: 6, height: 21 }} />}

                    <span style={{ fontSize: 11, fontWeight: 800, color: active ? "#ff6500" : "rgba(255,255,255,0.4)", marginBottom: 3 }}>
                      {info.label}
                    </span>
                    <span style={{ fontSize: 21, fontWeight: 900, color: active ? "#fff" : "rgba(255,255,255,0.65)", letterSpacing: "-0.5px", lineHeight: 1 }}>
                      {info.preco}
                    </span>
                    <span style={{ fontSize: 10, color: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)", marginTop: 4, lineHeight: 1.3 }}>
                      R$ {info.precoMes}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <Clock size={11} style={{ color: "rgba(255,101,0,0.7)" }} />
              <p className="text-center text-[11px] font-medium" style={{ color: "rgba(255,101,0,0.7)" }}>
                {planoAtual.detalhe}
              </p>
            </div>
          </div>

          <StripeCheckout plan={plan} />

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {[
              { icon: <ShieldCheck size={12} style={{ color: "#ff6500" }} />, text: "Pagamento seguro" },
              { icon: <Check size={12} style={{ color: "#ff6500" }} />, text: "Sem fidelidade" },
              { icon: <Check size={12} style={{ color: "#ff6500" }} />, text: "Cancele quando quiser" },
            ].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--color-text-dim)" }}>
                {t.icon} {t.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
