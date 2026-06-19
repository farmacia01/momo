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

// ── Helper: tamanho de fonte adaptativo para números de peso ──────────────────
// Conta "." como 0.4 de caractere (é estreito em Syne Bold)
function pesoFontSize(str: string): number {
  const visual = Array.from(str).reduce((a, c) => a + (c === "." ? 0.4 : 1), 0);
  if (visual <= 2.4) return 200; // "97", "90"
  if (visual <= 3.4) return 155; // "13", "100", "90.0"
  return 120;                    // "13.4", "101.6"
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

    return (
      <div
        ref={ref}
        style={{
          width: CARD_W, height: CARD_H,
          position: "relative", overflow: "hidden",
          fontFamily: "Syne,sans-serif",
          background: "transparent",
        }}
      >
        <style>{`
          @keyframes spNumIn {
            from { transform: scale(0.6) translateY(24px); opacity: 0; }
            to   { transform: scale(1)   translateY(0);    opacity: 1; }
          }
          @keyframes spFadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
          @keyframes spEmojiPop {
            0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
            70%  { transform: scale(1.25) rotate(6deg); opacity: 1; }
            100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
          }
        `}</style>

        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            padding: "36px 32px 28px",
          }}
        >
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.04em", fontFamily: "Syne,sans-serif" }}>
              momo
            </span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", fontFamily: "Outfit,sans-serif", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {mesAno}
            </span>
          </div>

          {/* Hero */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {template === "weight"      && <TplWeight data={data} displayPeso={displayPeso} dias={dias} />}
            {template === "goal"        && <TplGoal data={data} />}
            {template === "record"      && <TplRecord data={data} />}
            {template === "streak"      && <TplStreak dias={dias} />}
            {template === "beforeafter" && <TplBA data={data} />}
            {template === "milestone"   && <TplMilestone milestoneKg={milestoneKg} />}
          </div>

          {/* Footer */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ height: 1, background: "linear-gradient(90deg,#FF6B00,rgba(255,107,0,0.22),transparent)", marginBottom: 12 }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: "#FF6B00", letterSpacing: "0.06em", fontFamily: "Outfit,sans-serif" }}>
              momo.app
            </span>
          </div>
        </div>
      </div>
    );
  }
);

// ── Template: Peso Perdido ─────────────────────────────────────────────────────

function TplWeight({
  data, displayPeso, dias,
}: {
  data: ShareProgressData; displayPeso: number; dias: number;
}) {
  const numStr = displayPeso.toFixed(1);
  const fs     = pesoFontSize(numStr);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Big number */}
      <div
        style={{
          display: "flex", alignItems: "flex-end", marginBottom: 10,
          animation: "spNumIn 0.7s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <span
          style={{
            fontSize: fs, fontWeight: 900, color: "#fff",
            letterSpacing: "-6px", lineHeight: 0.84,
            fontFamily: "Syne,sans-serif",
          }}
        >
          {numStr}
        </span>
        <span
          style={{
            fontSize: Math.round(fs * 0.38), fontWeight: 700,
            color: "rgba(255,255,255,0.38)", letterSpacing: "-1px",
            marginBottom: Math.round(fs * 0.07), marginLeft: 7,
            fontFamily: "Syne,sans-serif",
          }}
        >
          kg
        </span>
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 48, fontWeight: 900, color: "#FF6B00",
          letterSpacing: "0.07em", textTransform: "uppercase",
          fontFamily: "Syne,sans-serif", marginBottom: 44,
          animation: "spFadeUp 0.5s 0.22s ease both",
        }}
      >
        PERDIDOS
      </span>

      {/* Timeline — tipografia pura, zero containers */}
      {data.pesoInicial != null && data.pesoAtual != null && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
            animation: "spFadeUp 0.5s 0.38s ease both",
          }}
        >
          <span style={{ fontSize: 19, fontWeight: 700, color: "rgba(255,255,255,0.32)", fontFamily: "Syne,sans-serif", flexShrink: 0 }}>
            {data.pesoInicial.toFixed(1)}kg
          </span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(255,255,255,0.1),#FF6B00 82%)" }} />
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
            <path d="M1 5h8M6 1l3 4-3 4" stroke="#FF6B00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 19, fontWeight: 700, color: "#fff", fontFamily: "Syne,sans-serif", flexShrink: 0 }}>
            {data.pesoAtual.toFixed(1)}kg
          </span>
        </div>
      )}

      {/* Days */}
      <span
        style={{
          fontSize: 20, color: "rgba(255,255,255,0.42)", fontFamily: "Outfit,sans-serif",
          animation: "spFadeUp 0.5s 0.52s ease both",
        }}
      >
        {dias} dias de tratamento
      </span>
    </div>
  );
}

// ── Template: Meta Alcançada ───────────────────────────────────────────────────

function TplGoal({ data }: { data: ShareProgressData }) {
  const raw  = data.pesoMeta ?? data.pesoAtual;
  const str  = raw != null ? Math.round(raw).toString() : "—";
  const fs   = pesoFontSize(str);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: 56, lineHeight: 1, marginBottom: 28,
          animation: "spEmojiPop 0.65s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        🎯
      </span>

      <div
        style={{
          display: "flex", flexDirection: "column", marginBottom: 24,
          animation: "spFadeUp 0.5s 0.18s ease both",
        }}
      >
        <span style={{ fontSize: 50, fontWeight: 900, color: "#FF6B00", letterSpacing: "0.04em", lineHeight: 0.9, fontFamily: "Syne,sans-serif" }}>
          META
        </span>
        <span style={{ fontSize: 50, fontWeight: 900, color: "#FF6B00", letterSpacing: "0.04em", lineHeight: 0.9, fontFamily: "Syne,sans-serif" }}>
          ALCANÇADA
        </span>
      </div>

      <div
        style={{
          display: "flex", alignItems: "flex-end",
          animation: "spNumIn 0.7s 0.1s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <span style={{ fontSize: fs, fontWeight: 900, color: "#fff", letterSpacing: "-8px", lineHeight: 0.84, fontFamily: "Syne,sans-serif" }}>
          {str}
        </span>
        <span style={{ fontSize: Math.round(fs * 0.36), fontWeight: 700, color: "rgba(255,255,255,0.38)", marginBottom: Math.round(fs * 0.07), marginLeft: 7, fontFamily: "Syne,sans-serif" }}>
          kg
        </span>
      </div>
    </div>
  );
}

// ── Template: Novo Recorde ─────────────────────────────────────────────────────

function TplRecord({ data }: { data: ShareProgressData }) {
  const raw = data.pesoAtual;
  const str = raw != null ? Math.round(raw).toString() : "—";
  const fs  = pesoFontSize(str);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: 56, lineHeight: 1, marginBottom: 28,
          animation: "spEmojiPop 0.65s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        🏆
      </span>

      <div
        style={{
          display: "flex", flexDirection: "column", marginBottom: 24,
          animation: "spFadeUp 0.5s 0.18s ease both",
        }}
      >
        <span style={{ fontSize: 50, fontWeight: 900, color: "#FF6B00", letterSpacing: "0.04em", lineHeight: 0.9, fontFamily: "Syne,sans-serif" }}>
          NOVO
        </span>
        <span style={{ fontSize: 50, fontWeight: 900, color: "#FF6B00", letterSpacing: "0.04em", lineHeight: 0.9, fontFamily: "Syne,sans-serif" }}>
          MENOR PESO
        </span>
      </div>

      <div
        style={{
          display: "flex", alignItems: "flex-end",
          animation: "spNumIn 0.7s 0.1s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <span style={{ fontSize: fs, fontWeight: 900, color: "#fff", letterSpacing: "-8px", lineHeight: 0.84, fontFamily: "Syne,sans-serif" }}>
          {str}
        </span>
        <span style={{ fontSize: Math.round(fs * 0.36), fontWeight: 700, color: "rgba(255,255,255,0.38)", marginBottom: Math.round(fs * 0.07), marginLeft: 7, fontFamily: "Syne,sans-serif" }}>
          kg
        </span>
      </div>
    </div>
  );
}

// ── Template: Sequência ────────────────────────────────────────────────────────

function TplStreak({ dias }: { dias: number }) {
  const str = String(dias);
  const fs  = pesoFontSize(str);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: 64, lineHeight: 1, marginBottom: 28,
          animation: "spEmojiPop 0.65s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        🔥
      </span>

      {/* Number in orange — the streak count is the hero */}
      <span
        style={{
          fontSize: fs, fontWeight: 900, color: "#FF6B00",
          letterSpacing: "-8px", lineHeight: 0.84,
          fontFamily: "Syne,sans-serif", marginBottom: 14,
          animation: "spNumIn 0.7s 0.1s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {str}
      </span>

      <div
        style={{
          display: "flex", flexDirection: "column",
          animation: "spFadeUp 0.5s 0.3s ease both",
        }}
      >
        <span style={{ fontSize: 50, fontWeight: 900, color: "#fff", letterSpacing: "0.04em", lineHeight: 0.9, fontFamily: "Syne,sans-serif" }}>
          DIAS
        </span>
        <span style={{ fontSize: 50, fontWeight: 900, color: "#fff", letterSpacing: "0.04em", lineHeight: 0.9, fontFamily: "Syne,sans-serif" }}>
          SEGUIDOS
        </span>
      </div>
    </div>
  );
}

// ── Template: Antes e Agora ────────────────────────────────────────────────────

function TplBA({ data }: { data: ShareProgressData }) {
  const antes  = data.pesoInicial ?? 0;
  const depois = data.pesoAtual   ?? 0;
  const diff   = data.pesoPerdido;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Antes / Agora lado a lado */}
      <div
        style={{
          display: "flex", gap: 32, alignItems: "flex-start", marginBottom: 28,
          animation: "spFadeUp 0.5s 0.1s ease both",
        }}
      >
        {/* Antes */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.32)", fontFamily: "Outfit,sans-serif", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
            ANTES
          </span>
          <span style={{ fontSize: 90, fontWeight: 900, color: "rgba(255,255,255,0.28)", letterSpacing: "-5px", lineHeight: 0.84, fontFamily: "Syne,sans-serif" }}>
            {Math.round(antes)}
          </span>
          <span style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.2)", fontFamily: "Syne,sans-serif", marginTop: 4 }}>
            kg
          </span>
        </div>

        {/* Seta de transição */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 44 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2v24M4 16l10 10 10-10" stroke="#FF6B00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Agora */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#FF6B00", fontFamily: "Outfit,sans-serif", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
            AGORA
          </span>
          <span
            style={{
              fontSize: 90, fontWeight: 900, color: "#fff",
              letterSpacing: "-5px", lineHeight: 0.84, fontFamily: "Syne,sans-serif",
              animation: "spNumIn 0.7s 0.2s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            {Math.round(depois)}
          </span>
          <span style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: "Syne,sans-serif", marginTop: 4 }}>
            kg
          </span>
        </div>
      </div>

      {/* Diferença destacada */}
      <div
        style={{
          display: "flex", alignItems: "flex-end", marginBottom: 8,
          animation: "spFadeUp 0.5s 0.38s ease both",
        }}
      >
        <span style={{ fontSize: 60, fontWeight: 900, color: "#FF6B00", letterSpacing: "-4px", lineHeight: 0.84, fontFamily: "Syne,sans-serif" }}>
          −{diff.toFixed(1)}
        </span>
        <span style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,107,0,0.5)", marginBottom: 8, marginLeft: 5, fontFamily: "Syne,sans-serif" }}>
          kg
        </span>
      </div>
      <span style={{ fontSize: 20, color: "rgba(255,255,255,0.42)", fontFamily: "Outfit,sans-serif", letterSpacing: "0.03em" }}>
        de transformação real
      </span>
    </div>
  );
}

// ── Template: Milestone ────────────────────────────────────────────────────────

function TplMilestone({ milestoneKg }: { milestoneKg: number }) {
  const fs = pesoFontSize(String(milestoneKg));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: 56, lineHeight: 1, marginBottom: 28,
          animation: "spEmojiPop 0.65s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        🏆
      </span>

      {/* Number + unit inline */}
      <div
        style={{
          display: "flex", alignItems: "flex-end", marginBottom: 10,
          animation: "spNumIn 0.7s 0.1s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <span style={{ fontSize: fs, fontWeight: 900, color: "#FF6B00", letterSpacing: "-10px", lineHeight: 0.84, fontFamily: "Syne,sans-serif" }}>
          {milestoneKg}
        </span>
        <span style={{ fontSize: Math.round(fs * 0.34), fontWeight: 900, color: "rgba(255,107,0,0.55)", letterSpacing: "-2px", marginBottom: Math.round(fs * 0.1), marginLeft: 6, fontFamily: "Syne,sans-serif" }}>
          KG
        </span>
      </div>

      <span
        style={{
          fontSize: 46, fontWeight: 900, color: "#fff",
          letterSpacing: "0.06em", fontFamily: "Syne,sans-serif",
          animation: "spFadeUp 0.5s 0.3s ease both",
        }}
      >
        ELIMINADOS
      </span>
    </div>
  );
}
