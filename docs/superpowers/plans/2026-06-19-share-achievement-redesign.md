# Share Achievement Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extrair `StoryCard` para `components/StoryCard.tsx` e redesenhar os 6 templates como posters minimalistas premium — números dominantes, zero containers/borders, fundo transparente.

**Architecture:** Dois arquivos com responsabilidades claras: `StoryCard.tsx` (visual puro, forwardRef, 6 templates) e `ShareProgressDrawer.tsx` (drawer UI, html2canvas, share actions). `ShareProgressData` se move para `StoryCard.tsx` e é re-exportado de `ShareProgressDrawer.tsx` para backward compatibility.

**Tech Stack:** Next.js 14, React 18, TypeScript, `html2canvas`, `date-fns`, fontes Syne + Outfit.

## Global Constraints

- Card preview: `360×640px` CSS; exportado a `3×` pelo html2canvas → `1080×1920px PNG transparente`
- Fontes: `Syne,sans-serif` (números, títulos), `Outfit,sans-serif` (labels, rodapé, info secundária)
- Cor principal: `#FF6B00`; branco: `#ffffff`; muted: `rgba(255,255,255,0.4)`; suave: `rgba(255,255,255,0.6)`
- `background: transparent` no elemento raiz do card e em TODOS os sub-elementos
- **PROIBIDO** dentro do card: `border`, `box-shadow`, `border-radius` com `background`, glassmorphism, grids de métricas
- Templates: `"weight" | "goal" | "record" | "streak" | "beforeafter" | "milestone"` — remove `"week"`
- Derivados inline (sem novos campos): `dias = Math.round(data.semanas * 7)`, `milestoneKg = Math.floor(data.pesoPerdido / 5) * 5`

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `components/StoryCard.tsx` | CREATE | `ShareProgressData`, `TemplateType`, `TEMPLATES`, `CARD_W`, `CARD_H`, `StoryCard` forwardRef, 6 templates |
| `components/ShareProgressDrawer.tsx` | MODIFY | Importar de `StoryCard`, re-exportar `ShareProgressData`, remover código inline de templates |

---

### Task 1: Criar `components/StoryCard.tsx`

**Files:**
- Create: `components/StoryCard.tsx`

**Interfaces:**
- Produces: `ShareProgressData` (interface), `TemplateType` (union type), `TEMPLATES` (array), `CARD_W: 360`, `CARD_H: 640`, `StoryCard` (forwardRef, props: `{ template, data, displayPeso, mesAno }`)

---

- [ ] **Step 1: Criar arquivo com tipos, constantes e helper de tamanho de fonte**

Criar `components/StoryCard.tsx` com o seguinte conteúdo completo:

```tsx
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
  const visual = [...str].reduce((a, c) => a + (c === "." ? 0.4 : 1), 0);
  if (visual <= 2.4) return 200; // "97", "90"
  if (visual <= 3.4) return 155; // "13", "100", "90.0"
  return 120;                    // "13.4", "101.6"
}
```

- [ ] **Step 2: Adicionar o componente StoryCard com keyframes**

Append ao `components/StoryCard.tsx`:

```tsx
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
```

- [ ] **Step 3: Implementar TplWeight**

Append ao `components/StoryCard.tsx`:

```tsx
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
```

- [ ] **Step 4: Implementar TplGoal**

Append ao `components/StoryCard.tsx`:

```tsx
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
```

- [ ] **Step 5: Implementar TplRecord**

Append ao `components/StoryCard.tsx`:

```tsx
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
```

- [ ] **Step 6: Implementar TplStreak**

Append ao `components/StoryCard.tsx`:

```tsx
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
```

- [ ] **Step 7: Implementar TplBA (Antes e Agora)**

Append ao `components/StoryCard.tsx`:

```tsx
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
```

- [ ] **Step 8: Implementar TplMilestone**

Append ao `components/StoryCard.tsx`:

```tsx
// ── Template: Milestone ────────────────────────────────────────────────────────

function TplMilestone({ milestoneKg }: { milestoneKg: number }) {
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
        <span style={{ fontSize: 200, fontWeight: 900, color: "#FF6B00", letterSpacing: "-10px", lineHeight: 0.84, fontFamily: "Syne,sans-serif" }}>
          {milestoneKg}
        </span>
        <span style={{ fontSize: 68, fontWeight: 900, color: "rgba(255,107,0,0.55)", letterSpacing: "-2px", marginBottom: 20, marginLeft: 6, fontFamily: "Syne,sans-serif" }}>
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
```

- [ ] **Step 9: Verificar que o arquivo compila sem erros TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros em `components/StoryCard.tsx`.

- [ ] **Step 10: Commit da Task 1**

```bash
git add components/StoryCard.tsx
git commit -m "feat(share): criar StoryCard.tsx com 6 templates minimalistas premium"
```

---

### Task 2: Refatorar `components/ShareProgressDrawer.tsx`

**Files:**
- Modify: `components/ShareProgressDrawer.tsx`

**Interfaces:**
- Consumes: `StoryCard`, `TemplateType`, `TEMPLATES`, `CARD_W`, `CARD_H`, `ShareProgressData` de `./StoryCard`
- Produces: re-exporta `ShareProgressData` (backward compat com `DashboardClient.tsx` e `SaudeClient.tsx`)

---

- [ ] **Step 1: Substituir o bloco de imports e tipos no topo do arquivo**

No `components/ShareProgressDrawer.tsx`, substituir as linhas 1–38 (do `"use client"` até o fechamento do array `TEMPLATES`) por:

```tsx
"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  StoryCard,
  TEMPLATES,
  CARD_W,
  CARD_H,
  type ShareProgressData,
  type TemplateType,
} from "./StoryCard";

// Re-export para backward compat (DashboardClient, SaudeClient importam daqui)
export type { ShareProgressData } from "./StoryCard";
```

- [ ] **Step 2: Remover as constantes duplicadas**

Após o passo anterior, no arquivo ainda existem as linhas:
```ts
const CARD_W = 360;
const CARD_H = 640;
const EXPORT_SCALE = 3;
const TEMPLATES: { key: TemplateType; emoji: string; label: string }[] = [ ... ];
```

Remover `CARD_W`, `CARD_H` e o array `TEMPLATES` (agora vêm do import). Manter `EXPORT_SCALE = 3` pois é local ao drawer.

- [ ] **Step 3: Remover a função `cap` e o helper `StoryCard` inline**

Remover do arquivo:
- A função `cap(s: string)` (linhas 42–44 do original)
- Todo o bloco do `StoryCard = forwardRef(...)` e seus templates inline: `TplWeight`, `TplGoal`, `TplWeek`, `TplRecord`, `TplBA`
- Os sub-componentes visuais: `Timeline`, `StatCell`, `DaysPill`

Esses são todos os componentes abaixo da linha `// ── Story Card...` até o final do arquivo, exceto `SheetLabel`, `SheetPill` e `WaIcon` — esses ficam.

- [ ] **Step 4: Verificar o template picker — atualizar para os 6 novos templates**

No `ShareProgressDrawer`, a inicialização de estado usa:
```ts
const [template, setTemplate] = useState<TemplateType>("weight");
```
Isso permanece igual. O tipo `TemplateType` agora vem do import e já inclui `"streak"` e `"milestone"`.

Verificar que o `TEMPLATES.map(...)` no JSX do drawer usa o array importado (sem hardcode). Deve estar assim:
```tsx
{TEMPLATES.map(tp => (
  <SheetPill key={tp.key} active={template === tp.key} onClick={() => setTemplate(tp.key)}>
    {tp.emoji} {tp.label}
  </SheetPill>
))}
```

- [ ] **Step 5: Verificar que o `StoryCard` importado é usado corretamente no JSX**

No JSX do drawer, o bloco de preview deve usar o `StoryCard` importado:
```tsx
<div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
  <StoryCard
    ref={cardRef}
    template={template}
    data={data}
    displayPeso={displayPeso}
    mesAno={mesAno}
  />
</div>
```

A variável `mesAno` é computada no drawer:
```ts
const mesAno = cap(format(new Date(), "MMMM yyyy", { locale: ptBR }));
```

Como removemos `cap` do drawer (era helper de `StoryCard.tsx`), mover a função `cap` para dentro do drawer — ela é pequena e usada apenas para formatar `mesAno`:

```ts
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
```

Adicionar essa linha após os imports no drawer.

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero erros. Checar em especial:
- `ShareProgressData` usada em `DashboardClient.tsx` e `SaudeClient.tsx` resolve via re-export
- `TemplateType` resolve do import

- [ ] **Step 7: Abrir o app e testar visualmente o drawer**

```bash
npm run dev
```

Navegar para a tela de Saúde → clicar no botão de compartilhar → verificar cada um dos 6 templates no seletor de pills.

Checklist de qualidade visual por template:
- [ ] `weight`: número `pesoPerdido.toFixed(1)` em branco dominante, "PERDIDOS" em laranja, timeline sem container, dias
- [ ] `goal`: emoji 🎯, "META / ALCANÇADA" em laranja, peso em branco grande
- [ ] `record`: emoji 🏆, "NOVO / MENOR PESO" em laranja, peso atual em branco
- [ ] `streak`: emoji 🔥, número de dias em laranja grande, "DIAS / SEGUIDOS" em branco
- [ ] `beforeafter`: antes/depois lado a lado, diferença em laranja
- [ ] `milestone`: emoji 🏆, número largo em laranja, "ELIMINADOS" em branco
- [ ] Nenhum template com borders, box-shadows ou backgrounds coloridos
- [ ] Animações (scaleIn, fadeUp, emojiPop) visíveis ao trocar templates

- [ ] **Step 8: Testar export PNG**

No drawer, clicar "Salvar PNG transparente". Abrir o arquivo salvo e verificar:
- [ ] Fundo completamente transparente (tabuleiro xadrez no visualizador)
- [ ] Resolução 1080×1920px
- [ ] Texto legível, sem artefatos
- [ ] Sem containers ou borders visíveis

- [ ] **Step 9: Commit da Task 2**

```bash
git add components/ShareProgressDrawer.tsx
git commit -m "refactor(share): extrair StoryCard para arquivo próprio, remover templates de dashboard"
```

---

## Self-Review

### Spec Coverage

| Requisito do Spec | Task que implementa |
|---|---|
| 6 templates (weight, goal, record, streak, beforeafter, milestone) | Task 1 Steps 3–8 |
| Remove template "week" | Task 2 Step 4 |
| background: transparent | Task 1 Step 2 (raiz do card) |
| PROIBIDO: borders, containers, glassmorphism | Task 1 Steps 3–8 (nenhum StatCell/DaysPill/Timeline com border) |
| Números dominantes com pesoFontSize adaptativo | Task 1 Step 1 (helper) + Steps 3–8 |
| `ShareProgressData` movida para StoryCard.tsx | Task 1 Step 1 |
| Re-export `ShareProgressData` de ShareProgressDrawer.tsx | Task 2 Step 1 |
| Animações: spNumIn, spFadeUp, spEmojiPop | Task 1 Step 2 (keyframes) + Steps 3–8 |
| milestoneKg derivado inline | Task 1 Step 2 |
| dias derivado inline | Task 1 Step 2 |
| CARD_W=360, CARD_H=640 exportados | Task 1 Step 1 |
| TEMPLATES exportado para drawer | Task 1 Step 1 |
| Divisor do rodapé: 1px gradiente laranja | Task 1 Step 2 (footer) |
| Export PNG 1080×1920 transparente | Task 2 mantém html2canvas com scale=3 |

Sem gaps.

### Placeholder Scan

Nenhum TBD, TODO ou "implement later" encontrado.

### Type Consistency

- `TemplateType` definido em Task 1 Step 1, consumido em Task 2 — consistente
- `ShareProgressData` definido em Task 1 Step 1, re-exportado em Task 2 Step 1 — consistente
- `StoryCard` props `{ template, data, displayPeso, mesAno }` definidos em Task 1 Step 2, usados em Task 2 Step 5 — consistente
- `CARD_W`, `CARD_H` exportados Task 1, importados Task 2 — consistente
- `pesoFontSize(str: string): number` usada em Steps 3, 4, 5, 6 — assinatura consistente
