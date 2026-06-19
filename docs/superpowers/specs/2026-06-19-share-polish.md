# Share System Polish — Spec

**Data:** 2026-06-19
**Status:** Aprovado

---

## Contexto

Melhorias de UX e copy no sistema de compartilhamento de conquistas do Momo, pós-redesign inicial. Os templates visuais estão corretos; este spec cobre refinamentos de responsividade, usabilidade, legibilidade e tom.

---

## Arquivos Alterados

| Arquivo | Ação |
|---|---|
| `components/ShareProgressDrawer.tsx` | Pills wrap, botão único, remover WhatsApp |
| `components/StoryCard.tsx` | Logo, opacidades, copy |

---

## 1. Pills Responsivos

**Problema:** `overflowX: "auto"` com `display: flex` em linha única — em telas pequenas os pills saem do viewport sem indicador visual.

**Solução:** Trocar por `flexWrap: "wrap"`. Pills quebram para segunda linha automaticamente. Gap mantido em 8px.

```tsx
// Antes
style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, ... }}

// Depois
style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingBottom: 4, ... }}
```

Remover `scrollbarWidth: "none"` (não faz mais sentido com wrap).

---

## 2. Botão de Ação Único

**Problema:** 3 botões (Salvar PNG / Compartilhar / WhatsApp texto) fragmentam a ação principal. WhatsApp só compartilha texto, não a imagem.

**Solução:** 1 botão principal largura total:

- Label: **"Compartilhar conquista"**
- Lógica: tenta `navigator.share({ files: [pngFile] })` → se não suportado/falhar, faz download direto do PNG
- Remover botão "Compartilhar" separado
- Remover botão "WhatsApp" (texto sem imagem)

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
      // Fallback: download direto
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
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

Remover `handleSave` e `handleWhatsApp` — substituídos por `handleShare` unificado.

Botão principal:
```tsx
<button onClick={handleShare} disabled={busy} style={{
  width: "100%", height: 54, borderRadius: 999,
  background: "linear-gradient(135deg,#ff6500,#cc3f00)",
  border: "none", color: "#fff",
  fontSize: 15, fontWeight: 800, fontFamily: "Outfit,sans-serif",
  letterSpacing: "0.04em",
  cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  boxShadow: "0 8px 28px rgba(255,101,0,0.4)",
}}>
  <Share2 size={17} /> Compartilhar conquista
</button>
```

Remover imports: `Download` de lucide-react (não mais necessário).

---

## 3. Opacidades dos Elementos do Card

**Problema:** Textos secundários com opacidade muito baixa ficam invisíveis quando o PNG é colado sobre uma foto no Story.

**Mapa de substituições em `components/StoryCard.tsx`:**

| Valor atual | Valor novo | Contexto |
|---|---|---|
| `rgba(255,255,255,0.28)` | `rgba(255,255,255,0.55)` | número "antes" em TplBA |
| `rgba(255,255,255,0.2)` | `rgba(255,255,255,0.45)` | "kg" do "antes" em TplBA |
| `rgba(255,255,255,0.32)` | `rgba(255,255,255,0.58)` | pesos na timeline (TplWeight) |
| `rgba(255,255,255,0.35)` | `rgba(255,255,255,0.60)` | número "antes" TplBA (segunda referência) |
| `rgba(255,255,255,0.38)` | `rgba(255,255,255,0.62)` | unidade "kg" nos templates |
| `rgba(255,255,255,0.4)` | `rgba(255,255,255,0.65)` | "kg" no TplBA e outros secundários |
| `rgba(255,255,255,0.42)` | `rgba(255,255,255,0.65)` | textos de dias, labels menores |
| `rgba(255,255,255,0.45)` | `rgba(255,255,255,0.68)` | outros secundários |
| `rgba(255,107,0,0.55)` | `rgba(255,107,0,0.80)` | "KG" em TplMilestone |

**Regra geral:** nenhum elemento textual visível abaixo de `0.5` de opacidade.

---

## 4. Branding: Logo em Vez de Texto

**Problema:** Textos "momo" (top-left) e "momo.app" (footer) são branding genérico de sistema.

**Solução:**

### Top bar
- Remover `<span>momo</span>`
- Adicionar `<img src="/logo.png" alt="" style={{ height: 28, width: 28, objectFit: "contain" }} />`
- html2canvas já usa `useCORS: true` — logo local renderiza sem problema

### Footer
- Remover `<span>momo.app</span>`
- Manter apenas a linha gradiente laranja (`div` de 1px)
- Footer fica minimalista: só a linha divisória

---

## 5. Copy — Tom Emocional

Substituições em `components/StoryCard.tsx`:

### TplWeight
- `PERDIDOS` → `A MENOS`
- `{dias} dias de tratamento` → `{dias} dias`

### TplGoal
- `META` / `ALCANÇADA` → `META` / `BATIDA`

### TplRecord
- `NOVO` / `MENOR PESO` → `MEU` / `RECORDE`

### TplStreak
- `DIAS` / `SEGUIDOS` → `DIAS` / `SEM PARAR`

### TplBA
- `de transformação real` → `a menos`
- O bloco fica: `−{diff}kg` / `a menos`

### TplMilestone
- `ELIMINADOS` → `VENCIDOS`

---

## Fora de Escopo

- Adicionar foto de fundo do usuário ao card
- Novos templates
- Mudanças no tipo `ShareProgressData`
- Animações novas
