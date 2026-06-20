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
  | "milestone";

export const TEMPLATES: { key: TemplateType; emoji: string; label: string }[] = [
  { key: "weight",      emoji: "🔥", label: "Peso perdido"   },
  { key: "goal",        emoji: "🎯", label: "Meta alcançada" },
  { key: "record",      emoji: "🏆", label: "Novo recorde"   },
  { key: "streak",      emoji: "🔥", label: "Sequência"      },
  { key: "beforeafter", emoji: "✨", label: "Antes e agora"  },
  { key: "milestone",   emoji: "🏆", label: "Milestone"      },
];

// ── Constants ──────────────────────────────────────────────────────────────────
// Mantém o mesmo aspect ratio original que cabia na tela
export const CARD_W = 360;
export const CARD_H = 640;

// ── Palette — cores 100% sólidas, sem rgba/opacity ─────────────────────────────

const GOLD       = "#C8952E";   // dourado principal
const GOLD_SOFT  = "#D4AE5A";   // dourado labels — sólido, legível
const GOLD_NUM   = "#B8862B";   // dourado números — sólido, contraste forte
const GOLD_LIGHT = "#E5C87A";   // sparkles / efeitos decorativos
const DIVIDER_C  = "#E0D0A8";   // cor do divisor — sólida

// ── Sparkle SVG ────────────────────────────────────────────────────────────────
// Sem animation de opacity — apenas transform pra html2canvas não quebrar

function Sparkle({ x, y, size = 14 }: { x: number; y: number; size?: number }) {
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
        fill={GOLD_LIGHT}
      />
      <path
        d="M0 12C0 12 8.5 10.5 12 12C15.5 13.5 24 12 24 12C24 12 15.5 10.5 12 12C8.5 13.5 0 12 0 12Z"
        fill={GOLD_LIGHT}
      />
    </svg>
  );
}

// ── Light rays (bottom decorations) ────────────────────────────────────────────
// Sem opacity em animation — apenas transform

function LightRays() {
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
      {/* Diagonal streaks — cor sólida, sem opacity animada */}
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
            background: `linear-gradient(90deg, transparent, ${GOLD_LIGHT}, transparent)`,
            transform: `rotate(${s.rotate}deg)`,
            transformOrigin: "left center",
            animation: "spRayShimmer 4s ease-in-out infinite",
          }}
        />
      ))}

      {/* Particle dots — cor sólida */}
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
            background: GOLD_LIGHT,
            animation: "spDotFloat 3s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

// ── Momo Logo Badge ────────────────────────────────────────────────────────────

function MomoLogoBadge() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 6,
    }}>
      {/* Ring + logo */}
      <div style={{
        position: "relative",
        width: 64, height: 64,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Gold ring border */}
        <div style={{
          position: "absolute", inset: -3,
          borderRadius: "50%",
          border: `2px solid ${GOLD_LIGHT}`,
        }} />
        {/* Logo circle */}
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

      {/* Brand name */}
      <span style={{
        fontSize: 12,
        fontWeight: 800,
        color: GOLD,
        letterSpacing: "0.22em",
        fontFamily: "Syne,sans-serif",
      }}>
        MOMO
      </span>
    </div>
  );
}

// ── Divider — cor sólida ───────────────────────────────────────────────────────

function GoldDivider({ width = 140 }: { width?: number }) {
  return (
    <div style={{
      width, height: 1, margin: "0 auto",
      background: DIVIDER_C,
    }} />
  );
}

// ── StoryCard ──────────────────────────────────────────────────────────────────

interface CardProps {
  template: TemplateType;
  data: ShareProgressData;
  displayPeso: number;
  mesAno: string;
}

export const StoryCard = forwardRef<HTMLDivElement, CardProps>(
  function StoryCard({ template, data, displayPeso, mesAno }, ref) {
    const dias        = Math.round(data.semanas * 7);
    const milestoneKg = Math.floor(data.pesoPerdido / 5) * 5;
    const caloriasEconomizadas = Math.round(data.pesoPerdido * 7700);

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
        {/*
          REGRA CRÍTICA para html2canvas:
          Nenhuma animação usa opacity — apenas transform.
          Isso garante que no momento da captura tudo está 100% visível.
        */}
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

        {/* Sparkle decorations */}
        <Sparkle x={210} y={60} size={18} />
        <Sparkle x={245} y={38} size={13} />
        <Sparkle x={275} y={72} size={10} />

        {/* Light rays at the bottom */}
        <LightRays />

        {/* Content */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px 24px",
        }}>

          {/* Hero — template content */}
          <div style={{
            flex: 1,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            width: "100%",
          }}>
            {template === "weight"      && <TplWeight data={data} displayPeso={displayPeso} dias={dias} calorias={caloriasEconomizadas} />}
            {template === "goal"        && <TplGoal data={data} calorias={caloriasEconomizadas} />}
            {template === "record"      && <TplRecord data={data} calorias={caloriasEconomizadas} />}
            {template === "streak"      && <TplStreak dias={dias} calorias={caloriasEconomizadas} />}
            {template === "beforeafter" && <TplBA data={data} dias={dias} calorias={caloriasEconomizadas} />}
            {template === "milestone"   && <TplMilestone milestoneKg={milestoneKg} calorias={caloriasEconomizadas} />}
          </div>

          {/* Bottom logo */}
          <div style={{ flexShrink: 0, marginTop: 8 }}>
            <MomoLogoBadge />
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
}: {
  label: string;
  value: string;
  unit?: string;
  emoji?: string;
  valueFontSize?: number;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 6,
    }}>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: GOLD_SOFT,
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
          color: GOLD_NUM,
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
            color: GOLD_SOFT,
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
  data, displayPeso, dias, calorias,
}: {
  data: ShareProgressData; displayPeso: number; dias: number; calorias: number;
}) {
  const numStr = displayPeso.toFixed(1);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 24,
      width: "100%",
    }}>
      <MetricSection
        label="Peso perdido"
        value={`-${numStr}`}
        unit="KG"
        valueFontSize={68}
      />

      <GoldDivider />

      <MetricSection
        label="Tempo de jornada"
        value={String(dias)}
        unit="DIAS"
        valueFontSize={54}
      />

      <GoldDivider />

      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={38}
      />
    </div>
  );
}

// ── Template: Meta Alcançada ───────────────────────────────────────────────────

function TplGoal({ data, calorias }: { data: ShareProgressData; calorias: number }) {
  const raw = data.pesoMeta ?? data.pesoAtual;
  const str = raw != null ? Math.floor(raw).toString() : "—";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 22,
      width: "100%",
    }}>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 6,
      }}>
        <span style={{ fontSize: 38, lineHeight: 1 }}>
          🎯
        </span>
        <span style={{
          fontSize: 30, fontWeight: 900, color: GOLD,
          letterSpacing: "0.06em", lineHeight: 1,
          fontFamily: "Syne,sans-serif",
        }}>
          META BATIDA
        </span>
      </div>

      <MetricSection
        label="Peso alcançado"
        value={str}
        unit="KG"
        valueFontSize={68}
      />

      <GoldDivider />

      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={36}
      />
    </div>
  );
}

// ── Template: Novo Recorde ─────────────────────────────────────────────────────

function TplRecord({ data, calorias }: { data: ShareProgressData; calorias: number }) {
  const raw = data.pesoAtual;
  const str = raw != null ? Math.floor(raw).toString() : "—";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 22,
      width: "100%",
    }}>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 6,
      }}>
        <span style={{ fontSize: 38, lineHeight: 1 }}>
          🏆
        </span>
        <span style={{
          fontSize: 30, fontWeight: 900, color: GOLD,
          letterSpacing: "0.06em", lineHeight: 1,
          fontFamily: "Syne,sans-serif",
        }}>
          MEU RECORDE
        </span>
      </div>

      <MetricSection
        label="Menor peso"
        value={str}
        unit="KG"
        valueFontSize={68}
      />

      <GoldDivider />

      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={36}
      />
    </div>
  );
}

// ── Template: Sequência ────────────────────────────────────────────────────────

function TplStreak({ dias, calorias }: { dias: number; calorias: number }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 22,
      width: "100%",
    }}>
      <span style={{ fontSize: 42, lineHeight: 1 }}>
        🔥
      </span>

      <MetricSection
        label="Dias sem parar"
        value={String(dias)}
        unit="DIAS"
        valueFontSize={68}
      />

      <GoldDivider />

      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={36}
      />
    </div>
  );
}

// ── Template: Antes e Agora ────────────────────────────────────────────────────

function TplBA({ data, dias, calorias }: { data: ShareProgressData; dias: number; calorias: number }) {
  const antes  = data.pesoInicial ?? 0;
  const depois = data.pesoAtual   ?? 0;
  const diff   = data.pesoPerdido;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 18,
      width: "100%",
    }}>
      {/* Before / After side by side */}
      <div style={{
        display: "flex", gap: 24, alignItems: "center",
      }}>
        {/* Antes */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: GOLD_SOFT,
            letterSpacing: "0.20em", textTransform: "uppercase",
            fontFamily: "Outfit,sans-serif", marginBottom: 4,
          }}>ANTES</span>
          <span style={{
            fontSize: 48, fontWeight: 900, color: GOLD_NUM,
            letterSpacing: "0.01em", lineHeight: 1,
            fontFamily: "Syne,sans-serif",
          }}>{Math.round(antes)}</span>
          <span style={{
            fontSize: 16, fontWeight: 700, color: GOLD_SOFT,
            fontFamily: "Syne,sans-serif", marginTop: 2,
          }}>kg</span>
        </div>

        {/* Arrow */}
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
          <path d="M4 14h20M18 8l6 6-6 6" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Agora */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: GOLD,
            letterSpacing: "0.20em", textTransform: "uppercase",
            fontFamily: "Outfit,sans-serif", marginBottom: 4,
          }}>AGORA</span>
          <span style={{
            fontSize: 48, fontWeight: 900, color: GOLD,
            letterSpacing: "0.01em", lineHeight: 1,
            fontFamily: "Syne,sans-serif",
          }}>{Math.round(depois)}</span>
          <span style={{
            fontSize: 16, fontWeight: 700, color: GOLD,
            fontFamily: "Syne,sans-serif", marginTop: 2,
          }}>kg</span>
        </div>
      </div>

      <GoldDivider width={180} />

      {/* Diff */}
      <MetricSection
        label="Peso perdido"
        value={`-${diff.toFixed(1)}`}
        unit="KG"
        valueFontSize={44}
      />

      <GoldDivider width={120} />

      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={30}
      />
    </div>
  );
}

// ── Template: Milestone ────────────────────────────────────────────────────────

function TplMilestone({ milestoneKg, calorias }: { milestoneKg: number; calorias: number }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 22,
      width: "100%",
    }}>
      <span style={{ fontSize: 38, lineHeight: 1 }}>
        🏆
      </span>

      <MetricSection
        label="KG vencidos"
        value={String(milestoneKg)}
        unit="KG"
        valueFontSize={68}
      />

      <GoldDivider />

      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={36}
      />
    </div>
  );
}
