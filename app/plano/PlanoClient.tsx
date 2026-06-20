"use client";

import { useState, useEffect } from "react";
import { StripeCheckout } from "@/components/StripeCheckout";
import {
  Bell, TrendingUp, Utensils, Star, Package, ShieldCheck,
  Check, ChevronLeft, Zap, Clock, FlameKindling,
} from "lucide-react";

type PlanType = "mensal" | "trimestral";

const PLANOS = {
  mensal: {
    label: "Mensal",
    preco: "R$ 29,90",
    precoMes: "29,90/mês",
    detalhe: "7 dias grátis — cancele quando quiser",
    badge: null,
    trial: true,
  },
  trimestral: {
    label: "Trimestral",
    preco: "R$ 69,90",
    precoMes: "23,30/mês",
    detalhe: "Equivale a R$ 23,30/mês — sem trial",
    badge: "MAIS POPULAR",
    economia: "22% OFF",
    trial: false,
  },
};

const BENEFICIOS = [
  { icon: Bell,        titulo: "Lembrete de dose",         desc: "Notificação no dia e horário certos do seu ciclo" },
  { icon: TrendingUp,  titulo: "Gráfico de evolução",       desc: "Peso, IMC e medidas semana a semana" },
  { icon: Utensils,    titulo: "Receitas para sua fase",    desc: "IA que conhece o Mounjaro e as suas restrições" },
  { icon: Star,        titulo: "Relatório para o médico",   desc: "Histórico completo em um clique" },
  { icon: Package,     titulo: "Alerta de estoque",         desc: "Aviso antes de ficar sem ampola" },
];

export function PlanoClient({
  status,
  diasRestantesTrial,
  assinaturaExpiraEm,
}: {
  status: "trial" | "premium" | "expirado";
  diasRestantesTrial: number;
  assinaturaExpiraEm: string | null;
}) {
  const [syncing, setSyncing] = useState(false);
  const [plan, setPlan] = useState<PlanType>("trimestral");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1" && status !== "premium") {
      setSyncing(true);
      setTimeout(() => window.location.replace("/plano"), 2500);
    }
  }, []);

  if (syncing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6" style={{ background: "#0d0d0d" }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4" style={{ borderColor: "rgba(255,101,0,0.2)", borderTopColor: "#ff6500" }} />
        <p className="text-base font-bold text-white">Ativando sua assinatura...</p>
      </div>
    );
  }

  if (status === "premium") {
    return <PremiumAtivo assinaturaExpiraEm={assinaturaExpiraEm} />;
  }

  const planoAtual = PLANOS[plan];

  return (
    <div className="min-h-screen bg-bg pb-16">
      {/* Header */}
      <div
        className="relative overflow-hidden px-5 pb-8"
        style={{
          background: "linear-gradient(150deg, #160700 0%, #2e1100 55%, #160700 100%)",
          paddingTop: "calc(env(safe-area-inset-top) + 20px)",
          boxShadow: "0 10px 40px rgba(255,101,0,0.2)",
        }}
      >
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full opacity-10" style={{ background: "#ff6500", filter: "blur(60px)", transform: "translate(25%, -25%)" }} />
        <a href="/" className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
          <ChevronLeft size={16} strokeWidth={2.5} />
          Voltar
        </a>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(255,101,0,0.15)", border: "1px solid rgba(255,101,0,0.3)" }}>
            <FlameKindling size={12} style={{ color: "#ff6500" }} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#ff6500" }}>Acompanhamento Mounjaro</span>
          </div>

          <h1 className="text-[23px] font-black leading-[1.2] text-white">
            Você investe R$ 1.500/mês no Mounjaro. O Momo garante que vale.
          </h1>

          <p className="text-[13px] font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            {status === "trial"
              ? `Trial expira em ${diasRestantesTrial} dia${diasRestantesTrial === 1 ? "" : "s"} — assine e não perca seu histórico.`
              : "Seu acesso expirou. Assine e continue de onde parou."}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md space-y-5 px-5 pt-6">

        {/* Dores */}
        <div className="space-y-2.5">
          <p className="ml-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--color-text-dim)" }}>
            Sem acompanhamento
          </p>
          {[
            "Dose esquecida = semana de tratamento perdida. Sem lembrete, acontece.",
            "Você perdeu gordura ou músculo? Sem gráfico, é impossível saber.",
            "A dieta errada anula o Mounjaro — e você nem percebe.",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.13)" }}>
              <span className="mt-0.5 shrink-0 text-[15px]">⚠️</span>
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(255,101,0,0.1)", color: "#ff6500" }}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{b.titulo}</p>
                  <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--color-text-muted)" }}>{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seletor de plano */}
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

          {/* Trust signals */}
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

function PremiumAtivo({ assinaturaExpiraEm }: { assinaturaExpiraEm: string | null }) {
  const [loading, setLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const venc = assinaturaExpiraEm
    ? new Date(assinaturaExpiraEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "Renovação automática";

  async function handlePortal() {
    setLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalError(data.error || "Erro ao abrir portal.");
        setLoading(false);
      }
    } catch {
      setPortalError("Erro ao conectar com o servidor.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16" style={{ background: "#0d0d0d" }}>
      <div className="w-full max-w-sm space-y-4">
        <div className="rounded-[28px] p-8 text-center shadow-2xl" style={{ background: "#111", border: "1px solid rgba(255,101,0,0.15)" }}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(255,101,0,0.12)", border: "1px solid rgba(255,101,0,0.25)" }}>
            <Star size={28} style={{ color: "#ff6500", fill: "#ff6500" }} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>
            <Check size={13} strokeWidth={3} /> Premium ativo
          </span>
          <h1 className="mt-4 text-2xl font-black text-white">Tudo certo!</h1>
          <p className="mt-2 text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
            Você tem acesso completo ao Momo.
          </p>
          <div className="mt-6 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Próximo vencimento</p>
            <p className="mt-1 text-base font-bold text-white">{venc}</p>
          </div>
          <a href="/" className="mt-5 block w-full rounded-full py-3.5 text-sm font-black" style={{ background: "linear-gradient(135deg, #ff6500, #e05500)", color: "white", boxShadow: "0 4px 16px rgba(255,101,0,0.3)", textDecoration: "none" }}>
            Ir para o app
          </a>
          <button onClick={handlePortal} disabled={loading} className="mt-3 block w-full rounded-full py-3.5 text-sm font-bold transition-transform active:scale-[0.98] disabled:opacity-60" style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", background: "transparent" }}>
            {loading ? "Abrindo..." : "Gerenciar assinatura"}
          </button>
          {portalError && <p className="mt-2 text-xs text-red-400">{portalError}</p>}
        </div>
      </div>
    </div>
  );
}
