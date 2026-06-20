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

export const CARD_W = 360;
export const CARD_H = 640;

// ── Palette ────────────────────────────────────────────────────────────────────

const GOLD        = "#C8952E";
const GOLD_LIGHT  = "#E5C87A";
const GOLD_FADED  = "rgba(200,149,46,0.35)";
const GOLD_GLOW   = "rgba(200,149,46,0.18)";
const TEXT_LABEL   = "rgba(180,140,60,0.55)";
const TEXT_NUM     = "rgba(180,140,60,0.40)";
const DIVIDER      = "linear-gradient(90deg, transparent 5%, rgba(200,149,46,0.25) 30%, rgba(200,149,46,0.25) 70%, transparent 95%)";

// ── Sparkle SVG ────────────────────────────────────────────────────────────────

function Sparkle({ x, y, size = 14, delay = 0, opacity = 0.7 }: { x: number; y: number; size?: number; delay?: number; opacity?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      style={{
        position: "absolute", left: x, top: y,
        opacity,
        animation: `spSparkle 2.5s ${delay}s ease-in-out infinite`,
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

// ── Light rays (bottom glow) ───────────────────────────────────────────────────

function LightRays() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: 220,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Main golden glow */}
      <div style={{
        position: "absolute",
        bottom: -60, left: "50%", transform: "translateX(-50%)",
        width: 500, height: 200,
        background: "radial-gradient(ellipse at center, rgba(200,149,46,0.18) 0%, rgba(200,149,46,0.06) 40%, transparent 70%)",
      }} />

      {/* Diagonal streaks */}
      {[
        { rotate: -35, left: "10%", bottom: 10, w: 280, opacity: 0.12, delay: 0 },
        { rotate: -25, left: "15%", bottom: 40, w: 200, opacity: 0.09, delay: 0.5 },
        { rotate: -40, left: "5%",  bottom: 30, w: 320, opacity: 0.08, delay: 1.0 },
        { rotate: -20, left: "25%", bottom: 5,  w: 260, opacity: 0.10, delay: 0.3 },
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
            opacity: s.opacity,
            transform: `rotate(${s.rotate}deg)`,
            transformOrigin: "left center",
            animation: `spRayShimmer 4s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* Particle dots */}
      {[
        { x: "20%", y: 40, size: 3, delay: 0 },
        { x: "35%", y: 80, size: 2, delay: 0.8 },
        { x: "60%", y: 30, size: 2.5, delay: 1.2 },
        { x: "75%", y: 60, size: 2, delay: 0.4 },
        { x: "45%", y: 100, size: 3, delay: 1.6 },
        { x: "80%", y: 90, size: 2, delay: 0.9 },
        { x: "15%", y: 110, size: 2.5, delay: 1.4 },
        { x: "55%", y: 130, size: 2, delay: 0.6 },
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
            opacity: 0.4,
            animation: `spDotFloat 3s ${p.delay}s ease-in-out infinite`,
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
      {/* Outer ring glow */}
      <div style={{
        position: "relative",
        width: 72, height: 72,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Glow ring */}
        <div style={{
          position: "absolute", inset: -4,
          borderRadius: "50%",
          background: `conic-gradient(from 0deg, ${GOLD_FADED}, ${GOLD_LIGHT}40, ${GOLD_FADED}, ${GOLD_LIGHT}40, ${GOLD_FADED})`,
          animation: "spRingRotate 6s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: -1,
          borderRadius: "50%",
          background: "#fff",
        }} />
        {/* Logo circle */}
        <div style={{
          position: "relative",
          width: 64, height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ff8c00, #ff6500)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 20px rgba(255,101,0,0.3), 0 0 40px ${GOLD_GLOW}`,
        }}>
          <img
            src="/logo.png"
            alt="Momo"
            style={{ width: 40, height: 40, objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Brand name */}
      <span style={{
        fontSize: 13,
        fontWeight: 800,
        color: GOLD,
        letterSpacing: "0.22em",
        fontFamily: "Syne,sans-serif",
        textTransform: "uppercase",
      }}>
        MOMO
      </span>
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────────

function GoldDivider({ width = 140 }: { width?: number }) {
  return (
    <div style={{
      width, height: 1, margin: "0 auto",
      background: DIVIDER,
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
    // Calorias economizadas: ~7700 kcal per kg lost
    const caloriasEconomizadas = Math.round(data.pesoPerdido * 7700);

    return (
      <div
        ref={ref}
        style={{
          width: CARD_W, height: CARD_H,
          position: "relative",
          fontFamily: "Syne,sans-serif",
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Animations */}
        <style>{`
          @keyframes spSparkle {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.1); }
          }
          @keyframes spRayShimmer {
            0%, 100% { opacity: 0.06; }
            50% { opacity: 0.18; }
          }
          @keyframes spDotFloat {
            0%, 100% { transform: translateY(0); opacity: 0.2; }
            50% { transform: translateY(-8px); opacity: 0.6; }
          }
          @keyframes spRingRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes spNumIn {
            from { transform: scale(0.7) translateY(12px); opacity: 0.4; }
            to   { transform: scale(1) translateY(0); opacity: 1; }
          }
          @keyframes spFadeUp {
            from { transform: translateY(8px); opacity: 0.3; }
            to   { transform: translateY(0); opacity: 1; }
          }
          @keyframes spEmojiPop {
            0%   { transform: scale(0) rotate(-20deg); }
            70%  { transform: scale(1.25) rotate(6deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
        `}</style>

        {/* Subtle radial background warmth */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 30%, rgba(200,149,46,0.04) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        {/* Sparkle decorations */}
        <Sparkle x={200} y={70} size={18} delay={0} opacity={0.6} />
        <Sparkle x={230} y={50} size={12} delay={0.8} opacity={0.4} />
        <Sparkle x={260} y={80} size={10} delay={1.5} opacity={0.5} />

        {/* Light rays at the bottom */}
        <LightRays />

        {/* Content */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          padding: "40px 30px 28px",
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
          <div style={{ flexShrink: 0, marginTop: 12 }}>
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

// ── Section component ──────────────────────────────────────────────────────────

function MetricSection({
  label,
  value,
  unit,
  emoji,
  valueFontSize = 64,
  animDelay = 0,
}: {
  label: string;
  value: string;
  unit?: string;
  emoji?: string;
  valueFontSize?: number;
  animDelay?: number;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 4,
      animation: `spFadeUp 0.6s ${animDelay}s ease both`,
    }}>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        color: TEXT_LABEL,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        fontFamily: "Outfit,sans-serif",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {emoji && <span style={{ fontSize: 12 }}>{emoji}</span>}
        {label}
      </span>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 3,
        animation: `spNumIn 0.7s ${animDelay + 0.15}s cubic-bezier(0.34,1.56,0.64,1) both`,
      }}>
        <span style={{
          fontSize: valueFontSize,
          fontWeight: 900,
          color: TEXT_NUM,
          letterSpacing: "-0.04em",
          lineHeight: 0.9,
          fontFamily: "Syne,sans-serif",
        }}>
          {value}
        </span>
        {unit && (
          <span style={{
            fontSize: Math.max(16, valueFontSize * 0.3),
            fontWeight: 700,
            color: TEXT_LABEL,
            letterSpacing: "0.04em",
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

// ── Template: Peso Perdido (main — like the reference image) ───────────────────

function TplWeight({
  data, displayPeso, dias, calorias,
}: {
  data: ShareProgressData; displayPeso: number; dias: number; calorias: number;
}) {
  const numStr = displayPeso.toFixed(1);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 20,
      width: "100%",
    }}>
      {/* Peso Perdido */}
      <MetricSection
        label="Peso perdido"
        value={`-${numStr}`}
        unit="KG"
        valueFontSize={72}
        animDelay={0}
      />

      <GoldDivider />

      {/* Tempo de Jornada */}
      <MetricSection
        label="Tempo de jornada"
        value={String(dias)}
        unit="DIAS"
        valueFontSize={58}
        animDelay={0.2}
      />

      <GoldDivider />

      {/* Calorias Economizadas */}
      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={42}
        animDelay={0.4}
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
      alignItems: "center", gap: 20,
      width: "100%",
    }}>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 4,
        animation: "spFadeUp 0.5s ease both",
      }}>
        <span style={{ fontSize: 40, lineHeight: 1, animation: "spEmojiPop 0.65s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          🎯
        </span>
        <span style={{
          fontSize: 32, fontWeight: 900, color: GOLD,
          letterSpacing: "0.06em", lineHeight: 0.9,
          fontFamily: "Syne,sans-serif",
        }}>
          META BATIDA
        </span>
      </div>

      <MetricSection
        label="Peso alcançado"
        value={str}
        unit="KG"
        valueFontSize={72}
        animDelay={0.15}
      />

      <GoldDivider />

      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={38}
        animDelay={0.35}
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
      alignItems: "center", gap: 20,
      width: "100%",
    }}>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 4,
        animation: "spFadeUp 0.5s ease both",
      }}>
        <span style={{ fontSize: 40, lineHeight: 1, animation: "spEmojiPop 0.65s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          🏆
        </span>
        <span style={{
          fontSize: 32, fontWeight: 900, color: GOLD,
          letterSpacing: "0.06em", lineHeight: 0.9,
          fontFamily: "Syne,sans-serif",
        }}>
          MEU RECORDE
        </span>
      </div>

      <MetricSection
        label="Menor peso"
        value={str}
        unit="KG"
        valueFontSize={72}
        animDelay={0.15}
      />

      <GoldDivider />

      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={38}
        animDelay={0.35}
      />
    </div>
  );
}

// ── Template: Sequência ────────────────────────────────────────────────────────

function TplStreak({ dias, calorias }: { dias: number; calorias: number }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 20,
      width: "100%",
    }}>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 4,
        animation: "spFadeUp 0.5s ease both",
      }}>
        <span style={{ fontSize: 44, lineHeight: 1, animation: "spEmojiPop 0.65s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          🔥
        </span>
      </div>

      <MetricSection
        label="Dias sem parar"
        value={String(dias)}
        unit="DIAS"
        valueFontSize={72}
        animDelay={0.1}
      />

      <GoldDivider />

      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={38}
        animDelay={0.35}
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
      alignItems: "center", gap: 16,
      width: "100%",
    }}>
      {/* Before / After side by side */}
      <div style={{
        display: "flex", gap: 28, alignItems: "center",
        animation: "spFadeUp 0.5s 0.1s ease both",
      }}>
        {/* Antes */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: TEXT_LABEL,
            letterSpacing: "0.25em", textTransform: "uppercase",
            fontFamily: "Outfit,sans-serif", marginBottom: 4,
          }}>ANTES</span>
          <span style={{
            fontSize: 52, fontWeight: 900, color: TEXT_NUM,
            letterSpacing: "-0.04em", lineHeight: 0.9,
            fontFamily: "Syne,sans-serif",
          }}>{Math.round(antes)}</span>
          <span style={{
            fontSize: 16, fontWeight: 700, color: TEXT_LABEL,
            fontFamily: "Syne,sans-serif", marginTop: 2,
          }}>kg</span>
        </div>

        {/* Arrow */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ opacity: 0.5 }}>
          <path d="M4 14h20M18 8l6 6-6 6" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Agora */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: GOLD,
            letterSpacing: "0.25em", textTransform: "uppercase",
            fontFamily: "Outfit,sans-serif", marginBottom: 4,
          }}>AGORA</span>
          <span style={{
            fontSize: 52, fontWeight: 900, color: GOLD,
            letterSpacing: "-0.04em", lineHeight: 0.9,
            fontFamily: "Syne,sans-serif",
            animation: "spNumIn 0.7s 0.2s cubic-bezier(0.34,1.56,0.64,1) both",
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
        valueFontSize={48}
        animDelay={0.3}
      />

      <GoldDivider width={120} />

      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={32}
        animDelay={0.45}
      />
    </div>
  );
}

// ── Template: Milestone ────────────────────────────────────────────────────────

function TplMilestone({ milestoneKg, calorias }: { milestoneKg: number; calorias: number }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 20,
      width: "100%",
    }}>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 4,
        animation: "spFadeUp 0.5s ease both",
      }}>
        <span style={{ fontSize: 40, lineHeight: 1, animation: "spEmojiPop 0.65s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          🏆
        </span>
      </div>

      <MetricSection
        label="KG vencidos"
        value={String(milestoneKg)}
        unit="KG"
        valueFontSize={72}
        animDelay={0.1}
      />

      <GoldDivider />

      <MetricSection
        label="Calorias economizadas"
        value={formatKcal(calorias)}
        unit="kcal"
        emoji="🔥"
        valueFontSize={38}
        animDelay={0.35}
      />
    </div>
  );
}
