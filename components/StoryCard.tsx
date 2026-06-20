"use client";

import { forwardRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ShareProgressData {
  pesoPerdido: number;
  semanas: number;
  imc: number;
  pesoInicial: number | null;
  pesoAtual: number | null;
  mediaSemana: number;
  serie: number[];
  nome?: string;
  pesoMeta?: number | null;
}

export type TemplateType =
  | "weight"
  | "goal"
  | "record"
  | "streak"
  | "beforeafter"
  | "milestone"
  | "imc"
  | "weekly"
  | "halfway"
  | "clean";

export const TEMPLATES: { key: TemplateType; emoji: string; label: string }[] = [
  { key: "weight",      emoji: "🔥", label: "Peso perdido"      },
  { key: "beforeafter", emoji: "✨", label: "Antes e agora"     },
  { key: "clean",       emoji: "💫", label: "Minimalista"       },
  { key: "weekly",      emoji: "📈", label: "Ritmo semanal"     },
  { key: "imc",         emoji: "💪", label: "IMC em queda"      },
  { key: "halfway",     emoji: "🎯", label: "Rumo à meta"       },
  { key: "record",      emoji: "🏆", label: "Menor peso"        },
  { key: "streak",      emoji: "🗓️", label: "Dias em tratamento"},
  { key: "milestone",   emoji: "🏅", label: "Milestone"         },
  { key: "goal",        emoji: "🎉", label: "Meta batida"       },
];

// ── Color themes ───────────────────────────────────────────────────────────────

export interface ColorTheme {
  key: string;
  label: string;
  main: string;       // cor principal (números, títulos)
  soft: string;       // cor suave (labels, unidades)
  light: string;      // efeitos decorativos (sparkles, raios)
  divider: string;    // separadores
  accent: string;     // badge do logo
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    key: "gold",
    label: "Dourado",
    main: "#B8862B",
    soft: "#D4AE5A",
    light: "#E5C87A",
    divider: "#E0D0A8",
    accent: "#C8952E",
  },
  {
    key: "ember",
    label: "Laranja",
    main: "#CC5500",
    soft: "#E07020",
    light: "#FF9F50",
    divider: "#EECCAA",
    accent: "#FF6500",
  },
  {
    key: "rose",
    label: "Rosa",
    main: "#B5436E",
    soft: "#D4608A",
    light: "#F0A0B8",
    divider: "#E8C8D4",
    accent: "#E0507A",
  },
  {
    key: "ocean",
    label: "Azul",
    main: "#2B6CB0",
    soft: "#4A90D9",
    light: "#7BBAF5",
    divider: "#B0D0E8",
    accent: "#3182CE",
  },
  {
    key: "emerald",
    label: "Verde",
    main: "#276749",
    soft: "#48BB78",
    light: "#68D391",
    divider: "#B2DFC5",
    accent: "#38A169",
  },
  {
    key: "purple",
    label: "Roxo",
    main: "#6B46C1",
    soft: "#9B6FE0",
    light: "#C4A5F0",
    divider: "#D8C8E8",
    accent: "#805AD5",
  },
  {
    key: "dark",
    label: "Escuro",
    main: "#1A1A1A",
    soft: "#555555",
    light: "#888888",
    divider: "#CCCCCC",
    accent: "#333333",
  },
];

// ── Constants ──────────────────────────────────────────────────────────────────

export const CARD_W = 360;
export const CARD_H = 640;

// ── Sparkle SVG ────────────────────────────────────────────────────────────────

function Sparkle({ x, y, size = 14, color }: { x: number; y: number; size?: number; color: string }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      style={{
        position: "absolute", left: x, top: y,
        animation: "spSparkle 2.5s ease-in-out infinite",
      }}
    >
      <path
        d="M12 0C12 0 13.5 8.5 12 12C10.5 15.5 12 24 12 24C12 24 13.5 15.5 12 12C10.5 8.5 12 0 12 0Z"
        fill={color}
      />
      <path
        d="M0 12C0 12 8.5 10.5 12 12C15.5 13.5 24 12 24 12C24 12 15.5 10.5 12 12C8.5 13.5 0 12 0 12Z"
        fill={color}
      />
    </svg>
  );
}

// ── Light rays ─────────────────────────────────────────────────────────────────

function LightRays({ color }: { color: string }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: 180,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {[
        { rotate: -35, left: "10%", bottom: 10, w: 250 },
        { rotate: -25, left: "20%", bottom: 40, w: 180 },
        { rotate: -40, left: "5%",  bottom: 25, w: 280 },
        { rotate: -20, left: "30%", bottom: 5,  w: 220 },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.left,
            bottom: s.bottom,
            width: s.w,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            transform: `rotate(${s.rotate}deg)`,
            transformOrigin: "left center",
            animation: "spRayShimmer 4s ease-in-out infinite",
          }}
        />
      ))}

      {[
        { x: "22%", y: 35, size: 3 },
        { x: "38%", y: 70, size: 2 },
        { x: "62%", y: 25, size: 2.5 },
        { x: "78%", y: 55, size: 2 },
        { x: "48%", y: 90, size: 3 },
        { x: "85%", y: 80, size: 2 },
      ].map((p, i) => (
        <div
          key={`dot-${i}`}
          style={{
            position: "absolute",
            left: p.x,
            bottom: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: color,
            animation: "spDotFloat 3s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

// ── Momo Logo Badge ────────────────────────────────────────────────────────────

function MomoLogoBadge({ accentColor }: { accentColor: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 6,
    }}>
      <div style={{
        position: "relative",
        width: 64, height: 64,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          position: "absolute", inset: -3,
          borderRadius: "50%",
          border: `2px solid ${accentColor}`,
        }} />
        <div style={{
          position: "relative",
          width: 56, height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ff8c00, #ff6500)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img
            src="/logo.png"
            alt="Momo"
            style={{ width: 36, height: 36, objectFit: "contain" }}
          />
        </div>
      </div>

      <span style={{
        fontSize: 12,
        fontWeight: 800,
        color: accentColor,
        letterSpacing: "0.22em",
        fontFamily: "Syne,sans-serif",
      }}>
        MOMO
      </span>
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────────

function GoldDivider({ width = 140, color }: { width?: number; color: string }) {
  return (
    <div style={{
      width, height: 1, margin: "0 auto",
      background: color,
    }} />
  );
}

// ── StoryCard ──────────────────────────────────────────────────────────────────

interface CardProps {
  template: TemplateType;
  data: ShareProgressData;
  displayPeso: number;
  mesAno: string;
  colorTheme?: ColorTheme;
}

export const StoryCard = forwardRef<HTMLDivElement, CardProps>(
  function StoryCard({ template, data, displayPeso, mesAno, colorTheme }, ref) {
    const ct = colorTheme ?? COLOR_THEMES[0]; // fallback dourado
    const dias        = Math.round(data.semanas * 7);
    const milestoneKg = Math.floor(data.pesoPerdido / 5) * 5;
    const caloriasEconomizadas = Math.round(data.pesoPerdido * 7700);
    const firstName = data.nome?.split(" ")[0] || "";

    return (
      <div
        ref={ref}
        style={{
          width: CARD_W, height: CARD_H,
          position: "relative",
          fontFamily: "Syne,sans-serif",
          // SEM background — PNG transparente para figurinha no Story
        }}
      >
        {/* Animações — sem opacity, só transform (html2canvas safe) */}
        <style>{`
          @keyframes spSparkle {
            0%, 100% { transform: scale(0.85); }
            50%      { transform: scale(1.15); }
          }
          @keyframes spRayShimmer {
            0%, 100% { transform: scaleX(0.9); }
            50%      { transform: scaleX(1.1); }
          }
          @keyframes spDotFloat {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-6px); }
          }
          @keyframes spNumIn {
            from { transform: scale(0.7) translateY(10px); }
            to   { transform: scale(1)   translateY(0);    }
          }
          @keyframes spFadeUp {
            from { transform: translateY(8px); }
            to   { transform: translateY(0);   }
          }
          @keyframes spEmojiPop {
            0%   { transform: scale(0) rotate(-20deg); }
            70%  { transform: scale(1.25) rotate(6deg); }
            100% { transform: scale(1)   rotate(0deg); }
          }
        `}</style>

        {/* Sparkles */}
        <Sparkle x={210} y={60} size={18} color={ct.light} />
        <Sparkle x={245} y={38} size={13} color={ct.light} />
        <Sparkle x={275} y={72} size={10} color={ct.light} />

        {/* Light rays */}
        <LightRays color={ct.light} />

        {/* Content */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px 24px",
        }}>

          {/* Nome do usuário no topo (dados reais do banco) */}
          {firstName && (
            <div style={{
              flexShrink: 0,
              marginBottom: 12,
              textAlign: "center",
            }}>
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: ct.soft,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontFamily: "Outfit,sans-serif",
              }}>
                {firstName}
              </span>
            </div>
          )}

          {/* Hero — template content */}
          <div style={{
            flex: 1,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            width: "100%",
          }}>
            {template === "weight"      && <TplWeight data={data} displayPeso={displayPeso} dias={dias} calorias={caloriasEconomizadas} ct={ct} />}
            {template === "goal"        && <TplGoal data={data} calorias={caloriasEconomizadas} ct={ct} />}
            {template === "record"      && <TplRecord data={data} calorias={caloriasEconomizadas} ct={ct} />}
            {template === "streak"      && <TplStreak dias={dias} calorias={caloriasEconomizadas} ct={ct} />}
            {template === "beforeafter" && <TplBA data={data} dias={dias} calorias={caloriasEconomizadas} ct={ct} />}
            {template === "milestone"   && <TplMilestone milestoneKg={milestoneKg} calorias={caloriasEconomizadas} ct={ct} />}
            {template === "imc"         && <TplImc data={data} ct={ct} />}
            {template === "weekly"      && <TplWeekly data={data} ct={ct} />}
            {template === "halfway"     && <TplHalfway data={data} ct={ct} />}
            {template === "clean"       && <TplClean data={data} displayPeso={displayPeso} ct={ct} />}
          </div>

          {/* Bottom logo */}
          <div style={{ flexShrink: 0, marginTop: 8 }}>
            <MomoLogoBadge accentColor={ct.accent} />
          </div>
        </div>
      </div>
    );
  }
);

// ── Formatters ─────────────────────────────────────────────────────────────────

function formatKcal(n: number): string {
  if (n >= 1000) {
    return n.toLocaleString("pt-BR");
  }
  return String(n);
}

// ── MetricSection — sem opacity em nada ────────────────────────────────────────

function MetricSection({
  label,
  value,
  unit,
  emoji,
  valueFontSize = 64,
  ct,
}: {
  label: string;
  value: string;
  unit?: string;
  emoji?: string;
  valueFontSize?: number;
  ct: ColorTheme;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 6,
    }}>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: ct.soft,
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        fontFamily: "Outfit,sans-serif",
        display: "flex", alignItems: "center", gap: 5,
      }}>
        {emoji && <span style={{ fontSize: 13 }}>{emoji}</span>}
        {label}
      </span>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 6,
      }}>
        <span style={{
          fontSize: valueFontSize,
          fontWeight: 900,
          color: ct.main,
          letterSpacing: "0.01em",
          lineHeight: 1,
          fontFamily: "Syne,sans-serif",
        }}>
          {value}
        </span>
        {unit && (
          <span style={{
            fontSize: Math.max(18, valueFontSize * 0.32),
            fontWeight: 700,
            color: ct.soft,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: "Syne,sans-serif",
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Template: Peso Perdido ─────────────────────────────────────────────────────

function TplWeight({
  data, displayPeso, dias, calorias, ct,
}: {
  data: ShareProgressData; displayPeso: number; dias: number; calorias: number; ct: ColorTheme;
}) {
  const numStr = displayPeso.toFixed(1);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 24,
      width: "100%",
    }}>
      <MetricSection label="Peso perdido" value={`-${numStr}`} unit="KG" valueFontSize={68} ct={ct} />
      <GoldDivider color={ct.divider} />
      <MetricSection label="Tempo de jornada" value={String(dias)} unit="DIAS" valueFontSize={54} ct={ct} />
      <GoldDivider color={ct.divider} />
      <MetricSection label="Calorias economizadas" value={formatKcal(calorias)} unit="kcal" emoji="🔥" valueFontSize={38} ct={ct} />
    </div>
  );
}

// ── Template: Meta Alcançada ───────────────────────────────────────────────────

function TplGoal({ data, calorias, ct }: { data: ShareProgressData; calorias: number; ct: ColorTheme }) {
  const raw = data.pesoMeta ?? data.pesoAtual;
  const str = raw != null ? Math.floor(raw).toString() : "—";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 22,
      width: "100%",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 38, lineHeight: 1 }}>🎯</span>
        <span style={{
          fontSize: 30, fontWeight: 900, color: ct.accent,
          letterSpacing: "0.06em", lineHeight: 1, fontFamily: "Syne,sans-serif",
        }}>META BATIDA</span>
      </div>
      <MetricSection label="Peso alcançado" value={str} unit="KG" valueFontSize={68} ct={ct} />
      <GoldDivider color={ct.divider} />
      <MetricSection label="Calorias economizadas" value={formatKcal(calorias)} unit="kcal" emoji="🔥" valueFontSize={36} ct={ct} />
    </div>
  );
}

// ── Template: Novo Recorde ─────────────────────────────────────────────────────

function TplRecord({ data, calorias, ct }: { data: ShareProgressData; calorias: number; ct: ColorTheme }) {
  const menorPeso = data.serie.length > 0 ? Math.min(...data.serie) : data.pesoAtual;
  const str = menorPeso != null ? menorPeso.toFixed(1) : "—";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 22,
      width: "100%",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 38, lineHeight: 1 }}>🏆</span>
        <span style={{
          fontSize: 30, fontWeight: 900, color: ct.accent,
          letterSpacing: "0.06em", lineHeight: 1, fontFamily: "Syne,sans-serif",
        }}>MEU RECORDE</span>
      </div>
      <MetricSection label="Menor peso" value={str} unit="KG" valueFontSize={68} ct={ct} />
      <GoldDivider color={ct.divider} />
      <MetricSection label="Calorias economizadas" value={formatKcal(calorias)} unit="kcal" emoji="🔥" valueFontSize={36} ct={ct} />
    </div>
  );
}

// ── Template: Sequência ────────────────────────────────────────────────────────

function TplStreak({ dias, calorias, ct }: { dias: number; calorias: number; ct: ColorTheme }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 22,
      width: "100%",
    }}>
      <span style={{ fontSize: 42, lineHeight: 1 }}>🔥</span>
      <MetricSection label="Dias sem parar" value={String(dias)} unit="DIAS" valueFontSize={68} ct={ct} />
      <GoldDivider color={ct.divider} />
      <MetricSection label="Calorias economizadas" value={formatKcal(calorias)} unit="kcal" emoji="🔥" valueFontSize={36} ct={ct} />
    </div>
  );
}

// ── Template: Antes e Agora ────────────────────────────────────────────────────

function TplBA({ data, dias, calorias, ct }: { data: ShareProgressData; dias: number; calorias: number; ct: ColorTheme }) {
  const antes  = data.pesoInicial ?? 0;
  const depois = data.pesoAtual   ?? 0;
  const diff   = data.pesoPerdido;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 18,
      width: "100%",
    }}>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        {/* Antes */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: ct.soft,
            letterSpacing: "0.20em", textTransform: "uppercase",
            fontFamily: "Outfit,sans-serif", marginBottom: 4,
          }}>ANTES</span>
          <span style={{
            fontSize: 48, fontWeight: 900, color: ct.main,
            letterSpacing: "0.01em", lineHeight: 1, fontFamily: "Syne,sans-serif",
          }}>{Math.round(antes)}</span>
          <span style={{
            fontSize: 16, fontWeight: 700, color: ct.soft,
            fontFamily: "Syne,sans-serif", marginTop: 2,
          }}>kg</span>
        </div>

        {/* Arrow */}
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
          <path d="M4 14h20M18 8l6 6-6 6" stroke={ct.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Agora */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: ct.accent,
            letterSpacing: "0.20em", textTransform: "uppercase",
            fontFamily: "Outfit,sans-serif", marginBottom: 4,
          }}>AGORA</span>
          <span style={{
            fontSize: 48, fontWeight: 900, color: ct.accent,
            letterSpacing: "0.01em", lineHeight: 1, fontFamily: "Syne,sans-serif",
          }}>{Math.round(depois)}</span>
          <span style={{
            fontSize: 16, fontWeight: 700, color: ct.accent,
            fontFamily: "Syne,sans-serif", marginTop: 2,
          }}>kg</span>
        </div>
      </div>

      <GoldDivider width={180} color={ct.divider} />
      <MetricSection label="Peso perdido" value={`-${diff.toFixed(1)}`} unit="KG" valueFontSize={44} ct={ct} />
      <GoldDivider width={120} color={ct.divider} />
      <MetricSection label="Calorias economizadas" value={formatKcal(calorias)} unit="kcal" emoji="🔥" valueFontSize={30} ct={ct} />
    </div>
  );
}

// ── Template: Milestone ────────────────────────────────────────────────────────

function TplMilestone({ milestoneKg, calorias, ct }: { milestoneKg: number; calorias: number; ct: ColorTheme }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 22,
      width: "100%",
    }}>
      <span style={{ fontSize: 38, lineHeight: 1 }}>🏆</span>
      <MetricSection label="KG vencidos" value={String(milestoneKg)} unit="KG" valueFontSize={68} ct={ct} />
      <GoldDivider color={ct.divider} />
      <MetricSection label="Calorias economizadas" value={formatKcal(calorias)} unit="kcal" emoji="🔥" valueFontSize={36} ct={ct} />
    </div>
  );
}

// ── Template: IMC em queda ─────────────────────────────────────────────────────

function TplImc({ data, ct }: { data: ShareProgressData; ct: ColorTheme }) {
  const imc = data.imc;
  const imcStr = imc > 0 ? imc.toFixed(1) : "—";
  const categoria =
    imc <= 0   ? "—"
    : imc < 18.5 ? "Abaixo do peso"
    : imc < 25   ? "Peso normal"
    : imc < 30   ? "Sobrepeso"
    : imc < 35   ? "Obesidade grau I"
    : imc < 40   ? "Obesidade grau II"
    :              "Obesidade grau III";

  // IMC inicial estimado a partir do peso inicial (se disponível)
  const pesoInicial = data.pesoInicial;
  const pesoAtual = data.pesoAtual;
  const alturaEstimada = pesoAtual && imc > 0 ? Math.sqrt(pesoAtual / imc) : 0;
  const imcInicial = pesoInicial && alturaEstimada > 0
    ? pesoInicial / (alturaEstimada * alturaEstimada)
    : 0;
  const deltaImc = imcInicial > 0 && imc > 0 ? imcInicial - imc : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 36, lineHeight: 1 }}>💪</span>
        <span style={{
          fontSize: 11, fontWeight: 700, color: ct.soft,
          letterSpacing: "0.22em", textTransform: "uppercase",
          fontFamily: "Outfit,sans-serif",
        }}>IMC em queda</span>
      </div>
      <MetricSection label="IMC atual" value={imcStr} valueFontSize={72} ct={ct} />
      <GoldDivider color={ct.divider} />
      {deltaImc > 0.3 ? (
        <MetricSection label="Queda de IMC" value={`-${deltaImc.toFixed(1)}`} unit="pontos" valueFontSize={40} ct={ct} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: ct.soft,
            letterSpacing: "0.22em", textTransform: "uppercase",
            fontFamily: "Outfit,sans-serif",
          }}>Classificação</span>
          <span style={{
            fontSize: 20, fontWeight: 900, color: ct.main,
            fontFamily: "Syne,sans-serif", letterSpacing: "-0.02em",
          }}>{categoria}</span>
        </div>
      )}
      <GoldDivider color={ct.divider} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: ct.soft,
          letterSpacing: "0.22em", textTransform: "uppercase",
          fontFamily: "Outfit,sans-serif",
        }}>Classificação</span>
        <span style={{
          fontSize: deltaImc > 0.3 ? 20 : 24, fontWeight: 900, color: ct.main,
          fontFamily: "Syne,sans-serif", letterSpacing: "-0.02em",
        }}>{categoria}</span>
      </div>
    </div>
  );
}

// ── Template: Ritmo Semanal ────────────────────────────────────────────────────

function TplWeekly({ data, ct }: { data: ShareProgressData; ct: ColorTheme }) {
  const media = data.mediaSemana;
  const mediaStr = media > 0 ? media.toFixed(2) : "—";
  const semanas = Math.max(1, data.semanas);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 36, lineHeight: 1 }}>📈</span>
        <span style={{
          fontSize: 11, fontWeight: 700, color: ct.soft,
          letterSpacing: "0.22em", textTransform: "uppercase",
          fontFamily: "Outfit,sans-serif",
        }}>Meu ritmo</span>
      </div>
      <MetricSection label="Média semanal" value={`-${mediaStr}`} unit="KG/SEM" valueFontSize={58} ct={ct} />
      <GoldDivider color={ct.divider} />
      <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: ct.soft, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Outfit,sans-serif" }}>Semanas</span>
          <span style={{ fontSize: 36, fontWeight: 900, color: ct.main, fontFamily: "Syne,sans-serif", lineHeight: 1 }}>{semanas}</span>
        </div>
        <div style={{ width: 1, height: 40, background: ct.divider }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: ct.soft, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Outfit,sans-serif" }}>Total perdido</span>
          <span style={{ fontSize: 36, fontWeight: 900, color: ct.main, fontFamily: "Syne,sans-serif", lineHeight: 1 }}>-{data.pesoPerdido.toFixed(1)}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: ct.soft, fontFamily: "Syne,sans-serif" }}>kg</span>
        </div>
      </div>
    </div>
  );
}

// ── Template: Rumo à Meta ──────────────────────────────────────────────────────

function TplHalfway({ data, ct }: { data: ShareProgressData; ct: ColorTheme }) {
  const meta    = data.pesoMeta;
  const inicial = data.pesoInicial;
  const atual   = data.pesoAtual;

  // Progresso percentual rumo à meta
  const totalParaPerder = (inicial && meta) ? inicial - meta : 0;
  const pct = totalParaPerder > 0
    ? Math.min(100, Math.round((data.pesoPerdido / totalParaPerder) * 100))
    : 0;
  const faltam = (atual && meta) ? Math.max(0, atual - meta) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 36, lineHeight: 1 }}>🎯</span>
        <span style={{
          fontSize: 11, fontWeight: 700, color: ct.soft,
          letterSpacing: "0.22em", textTransform: "uppercase",
          fontFamily: "Outfit,sans-serif",
        }}>Rumo à meta</span>
      </div>

      {pct > 0 ? (
        <>
          <MetricSection label="Da meta conquistado" value={`${pct}`} unit="%" valueFontSize={72} ct={ct} />
          <GoldDivider color={ct.divider} />
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {inicial && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: ct.soft, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Outfit,sans-serif" }}>Início</span>
                <span style={{ fontSize: 30, fontWeight: 900, color: ct.main, fontFamily: "Syne,sans-serif", lineHeight: 1 }}>{Math.round(inicial)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: ct.soft, fontFamily: "Syne,sans-serif" }}>kg</span>
              </div>
            )}
            {faltam !== null && (
              <>
                <div style={{ width: 1, height: 40, background: ct.divider }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: ct.soft, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Outfit,sans-serif" }}>Faltam</span>
                  <span style={{ fontSize: 30, fontWeight: 900, color: ct.accent, fontFamily: "Syne,sans-serif", lineHeight: 1 }}>{faltam.toFixed(1)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ct.accent, fontFamily: "Syne,sans-serif" }}>kg</span>
                </div>
              </>
            )}
            {meta && (
              <>
                <div style={{ width: 1, height: 40, background: ct.divider }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: ct.soft, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Outfit,sans-serif" }}>Meta</span>
                  <span style={{ fontSize: 30, fontWeight: 900, color: ct.main, fontFamily: "Syne,sans-serif", lineHeight: 1 }}>{Math.round(meta)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ct.soft, fontFamily: "Syne,sans-serif" }}>kg</span>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        // Fallback sem meta definida: mostra progresso geral
        <>
          <MetricSection label="Já perdi" value={`-${data.pesoPerdido.toFixed(1)}`} unit="KG" valueFontSize={72} ct={ct} />
          <GoldDivider color={ct.divider} />
          <MetricSection label="Em" value={String(Math.max(1, data.semanas))} unit="SEMANAS" valueFontSize={46} ct={ct} />
        </>
      )}
    </div>
  );
}

// ── Template: Minimalista ──────────────────────────────────────────────────────

function TplClean({ data, displayPeso, ct }: { data: ShareProgressData; displayPeso: number; ct: ColorTheme }) {
  const numStr = displayPeso.toFixed(1);
  const semanas = Math.max(1, data.semanas);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: ct.soft,
        letterSpacing: "0.28em", textTransform: "uppercase",
        fontFamily: "Outfit,sans-serif",
      }}>Minha jornada</span>

      {/* Número principal gigante */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
        <span style={{
          fontSize: 14, fontWeight: 900, color: ct.soft,
          fontFamily: "Syne,sans-serif", marginTop: 16, lineHeight: 1,
        }}>-</span>
        <span style={{
          fontSize: 96, fontWeight: 900, color: ct.main,
          fontFamily: "Syne,sans-serif", lineHeight: 0.9,
          letterSpacing: "-0.04em",
        }}>{numStr}</span>
        <span style={{
          fontSize: 24, fontWeight: 700, color: ct.soft,
          fontFamily: "Syne,sans-serif", marginTop: 56, lineHeight: 1,
        }}>kg</span>
      </div>

      <GoldDivider width={100} color={ct.divider} />

      <span style={{
        fontSize: 13, fontWeight: 700, color: ct.soft,
        fontFamily: "Outfit,sans-serif", letterSpacing: "0.08em",
      }}>
        {semanas} semana{semanas === 1 ? "" : "s"} com Mounjaro
      </span>
    </div>
  );
}
