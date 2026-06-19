# Share Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polir o sistema de compartilhamento: pills responsivos, botão único de ação, opacidades legíveis, logo em vez de texto e copy emocional nos 6 templates.

**Architecture:** Duas tasks independentes em arquivos distintos — Task 1 no `ShareProgressDrawer.tsx` (UX/drawer), Task 2 no `StoryCard.tsx` (visual do card). Nenhuma interface muda; nenhum novo arquivo é criado.

**Tech Stack:** Next.js 14, React 18, TypeScript, html2canvas, lucide-react.

## Global Constraints

- Nenhum novo campo em `ShareProgressData`
- Nenhum novo arquivo criado
- `npx tsc --noEmit` deve passar sem erros nos arquivos fonte após cada task
- `public/logo.png` é o logo correto (500×500 PNG RGBA, círculo laranja com M)
- Cor principal: `#FF6B00`; html2canvas usa `useCORS: true` — logo local renderiza sem CORS
- Nenhum elemento textual visível abaixo de `0.5` de opacidade no card

---

## File Map

| Arquivo | Ação |
|---|---|
| `components/ShareProgressDrawer.tsx` | MODIFY — Task 1 |
| `components/StoryCard.tsx` | MODIFY — Task 2 |

---

### Task 1: ShareProgressDrawer — pills wrap + botão único

**Files:**
- Modify: `components/ShareProgressDrawer.tsx`

**Interfaces:**
- Nenhuma interface pública muda

---

- [ ] **Step 1: Remover `Download` do import de lucide-react**

Na linha 5 do arquivo, trocar:
```tsx
import { X, Download, Share2 } from "lucide-react";
```
por:
```tsx
import { X, Share2 } from "lucide-react";
```

- [ ] **Step 2: Substituir `handleSave`, `handleShare` e `handleWhatsApp` por função unificada**

Remover as três funções (linhas 102–159 do arquivo atual) e substituir por uma única:

```tsx
async function handleShare() {
  if (busy) return;
  setBusy(true);
  try {
    await snapAndWait();
    const canvas = await getCanvas();
    if (!canvas) throw new Error();
    const blob = await toBlob(canvas);
    if (!blob) throw new Error();
    const file = new File([blob], `momo-conquista-${mesLower}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "Minha conquista no Momo", files: [file] });
    } else {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `momo-conquista-${mesLower}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PNG salvo! Cole no Story como figurinha 🎯");
    }
  } catch (err: any) {
    if (err?.name !== "AbortError") toast.error("Não foi possível compartilhar.");
  } finally {
    setBusy(false);
  }
}
```

- [ ] **Step 3: Tornar pills responsivos (flex-wrap)**

Localizar o div do template picker (linha ~250):
```tsx
<div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 24, scrollbarWidth: "none" }}>
```
Substituir por:
```tsx
<div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingBottom: 4, marginBottom: 24 }}>
```

- [ ] **Step 4: Substituir os 3 botões por 1 botão único**

Remover o bloco inteiro de Actions (linhas ~258–312), que contém o botão "Salvar PNG transparente" e o grid com "Compartilhar" e "WhatsApp". Substituir por:

```tsx
{/* Action */}
<button
  onClick={handleShare}
  disabled={busy}
  style={{
    width: "100%", height: 54, borderRadius: 999,
    background: "linear-gradient(135deg,#ff6500,#cc3f00)",
    border: "none", color: "#fff",
    fontSize: 15, fontWeight: 800, fontFamily: "Outfit,sans-serif", letterSpacing: "0.04em",
    cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 8px 28px rgba(255,101,0,0.4)",
    transition: "transform 0.15s",
  }}
  onPointerDown={e => { if (!busy) e.currentTarget.style.transform = "scale(0.97)"; }}
  onPointerUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
>
  <Share2 size={17} /> Compartilhar conquista
</button>
```

- [ ] **Step 5: Remover `WaIcon`**

Remover o componente `WaIcon` inteiro (as últimas ~10 linhas do arquivo):
```tsx
// ── WhatsApp icon ──────────────────────────────────────────────────────────────

function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163..." />
    </svg>
  );
}
```

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "\.next/types"
```

Expected: nenhuma saída (zero erros em arquivos fonte).

- [ ] **Step 7: Commit**

```bash
git add components/ShareProgressDrawer.tsx
git commit -m "feat(share): pills wrap + botão único Compartilhar conquista"
```

---

### Task 2: StoryCard — logo, opacidades, copy

**Files:**
- Modify: `components/StoryCard.tsx`

**Interfaces:**
- Nenhuma interface pública muda

---

- [ ] **Step 1: Substituir texto "momo" por logo no top bar**

Localizar no componente `StoryCard` (linhas ~98–101):
```tsx
<span style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.04em", fontFamily: "Syne,sans-serif" }}>
  momo
</span>
```
Substituir por:
```tsx
<img src="/logo.png" alt="" style={{ height: 28, width: 28, objectFit: "contain" }} />
```

- [ ] **Step 2: Remover "momo.app" do footer**

Localizar no footer do `StoryCard` (linhas ~117–123):
```tsx
<div style={{ flexShrink: 0 }}>
  <div style={{ height: 1, background: "linear-gradient(90deg,#FF6B00,rgba(255,107,0,0.22),transparent)", marginBottom: 12 }} />
  <span style={{ fontSize: 12, fontWeight: 800, color: "#FF6B00", letterSpacing: "0.06em", fontFamily: "Outfit,sans-serif" }}>
    momo.app
  </span>
</div>
```
Substituir por (remove o span e o marginBottom da linha):
```tsx
<div style={{ flexShrink: 0 }}>
  <div style={{ height: 1, background: "linear-gradient(90deg,#FF6B00,rgba(255,107,0,0.22),transparent)" }} />
</div>
```

- [ ] **Step 3: Opacidades e copy em TplWeight**

Localizar `TplWeight` e aplicar 3 trocas:

**3a — "kg" unit** (linha ~170): `color: "rgba(255,255,255,0.38)"` → `color: "rgba(255,255,255,0.62)"`

**3b — label "PERDIDOS"** (linha ~188): `PERDIDOS` → `A MENOS`

**3c — pesoInicial na timeline** (linha ~199): `color: "rgba(255,255,255,0.32)"` → `color: "rgba(255,255,255,0.58)"`

**3d — span de dias** (linhas ~215,219):
```tsx
// Antes:
fontSize: 20, color: "rgba(255,255,255,0.42)"
...
{dias} dias de tratamento
```
```tsx
// Depois:
fontSize: 20, color: "rgba(255,255,255,0.65)"
...
{dias} dias
```

- [ ] **Step 4: Copy em TplGoal**

Localizar `TplGoal`. Trocar:

**4a — "kg" unit** (linha ~266): `color: "rgba(255,255,255,0.38)"` → `color: "rgba(255,255,255,0.62)"`

**4b — label** (linha ~253): `ALCANÇADA` → `BATIDA`

- [ ] **Step 5: Copy em TplRecord**

Localizar `TplRecord`. Trocar:

**5a — "NOVO"** (linha ~299): `NOVO` → `MEU`

**5b — "MENOR PESO"** (linha ~302): `MENOR PESO` → `RECORDE`

**5c — "kg" unit** (linha ~315): `color: "rgba(255,255,255,0.38)"` → `color: "rgba(255,255,255,0.62)"`

- [ ] **Step 6: Copy em TplStreak**

Localizar `TplStreak`. Trocar:

**6a — "SEGUIDOS"** (linha ~362): `SEGUIDOS` → `SEM PARAR`

- [ ] **Step 7: Opacidades e copy em TplBA**

Localizar `TplBA`. Aplicar:

**7a — label "ANTES"** (linha ~387): `color: "rgba(255,255,255,0.32)"` → `color: "rgba(255,255,255,0.58)"`

**7b — número antes** (linha ~390): `color: "rgba(255,255,255,0.28)"` → `color: "rgba(255,255,255,0.55)"`

**7c — "kg" antes** (linha ~393): `color: "rgba(255,255,255,0.2)"` → `color: "rgba(255,255,255,0.45)"`

**7d — "kg" agora** (linha ~419): `color: "rgba(255,255,255,0.4)"` → `color: "rgba(255,255,255,0.65)"`

**7e — "kg" do diff** (linha ~435): `color: "rgba(255,107,0,0.5)"` → `color: "rgba(255,107,0,0.75)"`

**7f — copy final** (linhas ~439–440):
```tsx
// Antes:
fontSize: 20, color: "rgba(255,255,255,0.42)"
...
de transformação real
```
```tsx
// Depois:
fontSize: 20, color: "rgba(255,255,255,0.65)"
...
a menos
```

- [ ] **Step 8: Copy e opacidade em TplMilestone**

Localizar `TplMilestone`. Trocar:

**8a — "KG" unit** (linha ~472): `color: "rgba(255,107,0,0.55)"` → `color: "rgba(255,107,0,0.80)"`

**8b — label** (linha ~484): `ELIMINADOS` → `VENCIDOS`

- [ ] **Step 9: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "\.next/types"
```

Expected: nenhuma saída.

- [ ] **Step 10: Commit**

```bash
git add components/StoryCard.tsx
git commit -m "feat(share): logo no card, opacidades +legíveis, copy emocional"
```

---

## Self-Review

### Spec Coverage

| Requisito | Task |
|---|---|
| Pills `flexWrap: wrap` | Task 1 Step 3 |
| Remover `scrollbarWidth: none` | Task 1 Step 3 |
| Botão único "Compartilhar conquista" | Task 1 Steps 2+4 |
| Remover handleSave, handleWhatsApp, WaIcon | Task 1 Steps 2+5 |
| Remover import `Download` | Task 1 Step 1 |
| Logo `/logo.png` 28px no top bar | Task 2 Step 1 |
| Remover "momo.app" do footer | Task 2 Step 2 |
| Footer: só linha gradiente | Task 2 Step 2 |
| `rgba(255,255,255,0.38)` → `0.62` (kg unit) | Task 2 Steps 3a,4a,5c |
| `rgba(255,255,255,0.32)` → `0.58` | Task 2 Steps 3c,7a |
| `rgba(255,255,255,0.42)` → `0.65` | Task 2 Steps 3d,7f |
| `rgba(255,255,255,0.28)` → `0.55` | Task 2 Step 7b |
| `rgba(255,255,255,0.2)` → `0.45` | Task 2 Step 7c |
| `rgba(255,255,255,0.4)` → `0.65` | Task 2 Step 7d |
| `rgba(255,107,0,0.5)` → `0.75` | Task 2 Step 7e |
| `rgba(255,107,0,0.55)` → `0.80` (KG) | Task 2 Step 8a |
| "PERDIDOS" → "A MENOS" | Task 2 Step 3b |
| "dias de tratamento" → "dias" | Task 2 Step 3d |
| "ALCANÇADA" → "BATIDA" | Task 2 Step 4b |
| "NOVO MENOR PESO" → "MEU RECORDE" | Task 2 Steps 5a+5b |
| "SEGUIDOS" → "SEM PARAR" | Task 2 Step 6a |
| "de transformação real" → "a menos" | Task 2 Step 7f |
| "ELIMINADOS" → "VENCIDOS" | Task 2 Step 8b |

Sem gaps.

### Placeholder Scan

Nenhum TBD ou implement-later encontrado.

### Type Consistency

Nenhuma interface ou tipo muda — task é puramente de JSX/strings/valores de style.
