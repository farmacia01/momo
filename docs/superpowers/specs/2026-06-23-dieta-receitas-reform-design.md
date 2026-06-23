# Design: Reforma da Aba Dieta & Receitas

**Data:** 2026-06-23  
**Status:** Aprovado pelo usuário  
**Escopo:** Refactor moderado (Opção B) — dividir DietaClient.tsx + 4 features novas + bug crítico

---

## Contexto

A aba `/dieta` é composta por um único arquivo `DietaClient.tsx` de 1.039 linhas que concentra duas sub-abas (Dashboard e Receitas), o modal de registro de refeição com IA, o drawer de detalhes de receita e toda a lógica de estado. O arquivo cresceu além do ponto de manutenibilidade razoável.

Além do problema estrutural, foram identificados:
- Um bug crítico (bucket `refeicoes-fotos` inexistente quebra upload de foto)
- Features completas já geradas pela IA mas nunca exibidas (`dica_mounjaro`)
- Lógica existente nunca conectada à UI (`ALIMENTOS_ALTO_IG`, `analisarRefeicao`)
- Persistência de favoritos apenas em localStorage (perde ao trocar dispositivo)
- Nenhuma proteção contra salvar macros com confiança baixa da IA

---

## Estrutura de Arquivos

### Antes
```
app/(app)/dieta/
  page.tsx              (server component — sem mudança)
  DietaClient.tsx       (1.039 linhas — tudo misturado)
```

### Depois
```
app/(app)/dieta/
  page.tsx              (sem mudança)
  DietaClient.tsx       (shell ~80 linhas: abas + estado compartilhado)

components/dieta/
  DashboardTab.tsx      (~220 linhas: macros do dia, gráfico 7d, histórico)
  ReceitasTab.tsx       (~160 linhas: grid de receitas, filtros, load/refresh)
  RegistrarRefeicaoModal.tsx  (~260 linhas: fluxo de registro com IA)
  ReceitaDrawer.tsx     (~180 linhas: modal de detalhe da receita)
```

A primeira etapa da implementação é o split puro — mover código sem alterar comportamento. Todas as features são adicionadas nos componentes novos.

---

## Banco de Dados

### Migration 1 — Bucket de fotos (bug crítico)
Já executada pelo usuário.

Cria o bucket `refeicoes-fotos` com RLS restrita ao dono (path `{user_id}/...`).

### Migration 2 — Receitas favoritas
Já executada pelo usuário.

```
receitas_favoritas
  id          uuid PK
  user_id     uuid FK auth.users (CASCADE DELETE)
  fase        int
  receita_id  text                    -- id do JSON gerado pela IA
  receita_data jsonb                  -- snapshot completo da receita
  criado_em   timestamptz
  UNIQUE (user_id, receita_id)
```

O snapshot jsonb garante que receitas favoritas sobrevivem à regeneração do cache de receitas.

---

## Feature 1 — Aviso de Confiança Baixa no Registro

**Arquivo:** `RegistrarRefeicaoModal.tsx`

Após `/api/diet/analyze` retornar, o comportamento varia por nível de confiança:

| `confianca` | Comportamento |
|---|---|
| `alta` | Exibe resultado normalmente, botão "Confirmar" liberado |
| `media` | Banner amarelo: *"Estimativa aproximada — confira se os valores parecem certos"* — botão "Confirmar" liberado |
| `baixa` | Banner vermelho + campos `kcal / prot / carb / gord` editáveis inline. Botão principal vira "Salvar assim mesmo" (destrutivo, tom menor). Só confirma após o usuário interagir |

**Estado necessário:**
```ts
const [macrosEditados, setMacrosEditados] = useState<MacroResult | null>(null);
```

Ao salvar, usa `macrosEditados ?? resultado` para priorizar os valores corrigidos pelo usuário.

**Sem alteração no contrato da API** — o campo `confianca` já existe na resposta.

---

## Feature 2 — `dica_mounjaro` no Drawer da Receita

**Arquivo:** `ReceitaDrawer.tsx`

Adicionar seção abaixo do modo de preparo:

```
┌─────────────────────────────────────────┐
│ 💊  Dica Mounjaro                       │
│  [texto do campo dica_mounjaro]         │
└─────────────────────────────────────────┘
```

- Fundo `var(--color-ember-glow)`, borda `var(--color-ember-glow-strong)`
- Renderizado condicionalmente: só aparece se `receita.dica_mounjaro` for truthy
- Sem nova chamada de API — o campo já vem no JSON de receitas

---

## Feature 3 — Alerta de Alto Índice Glicêmico

**Arquivo:** `ReceitasTab.tsx` (card) + `ReceitaDrawer.tsx` (detalhe)

**Detecção (client-side):**
```ts
import { ALIMENTOS_ALTO_IG } from '@/lib/diet-plans';

function temAltoIG(receita: Receita): string[] {
  const ingredientesText = receita.ingredientes.join(' ').toLowerCase();
  return ALIMENTOS_ALTO_IG.filter(alimento =>
    ingredientesText.includes(alimento.toLowerCase())
  );
}
```

**No card da receita:**
- Se `temAltoIG(receita).length > 0` → chip `⚠️ Alto IG` em laranja abaixo das macros

**No drawer:**
- Banner informativo listando os ingredientes detectados
- Sugestão de substituição por ingrediente via mapeamento fixo definido em `lib/diet-plans.ts`:

```ts
export const SUBSTITUICOES_IG: Record<string, string> = {
  'arroz branco':     'arroz integral',
  'pão branco':       'pão integral ou wrap integral',
  'batata':           'batata-doce',
  'macarrão':         'macarrão integral ou de grão-de-bico',
  'refrigerante':     'água com gás + limão',
  'suco de fruta':    'fruta inteira',
  'farinha de trigo': 'farinha de aveia ou amêndoa',
  'açúcar':           'adoçante natural (stévia)',
};
```

Se o ingrediente detectado não tiver mapeamento, exibe apenas o alerta sem sugestão de substituição.

---

## Feature 4 — Favoritar Receitas no Supabase

**Arquivos:** `ReceitasTab.tsx`, `ReceitaDrawer.tsx`

### Carregar favoritos
Ao montar `ReceitasTab`, buscar IDs dos favoritos do usuário:
```ts
const { data } = await supabase
  .from('receitas_favoritas')
  .select('receita_id')
  .eq('user_id', userId);
const favIds = new Set(data?.map(f => f.receita_id));
```

### Toggle favorito
```ts
async function toggleFavorito(receita: Receita) {
  if (favIds.has(receita.id)) {
    await supabase.from('receitas_favoritas')
      .delete().eq('user_id', userId).eq('receita_id', receita.id);
  } else {
    await supabase.from('receitas_favoritas').insert({
      user_id: userId,
      fase: faseAtual,
      receita_id: receita.id,
      receita_data: receita,
    });
  }
  // re-fetch favIds
}
```

### UI
- Ícone `Heart` nos cards de receita (cheio = favoritado, vazio = não)
- Pill "❤️ Favoritas" no grupo de filtros da `ReceitasTab`
- Ao ativar o filtro "Favoritas": busca `receitas_favoritas` do Supabase (não do cache da sessão) e exibe os snapshots. Favoritas sempre aparecem mesmo após regeneração do cache.

### Coração no drawer
- Botão de toggle também presente no `ReceitaDrawer` (topo direito)
- Estado sincronizado via prop/callback com `ReceitasTab`

---

## Ordem de Implementação

1. **Split do DietaClient.tsx** — mover código para os 4 componentes sem alterar comportamento
2. **Feature 2** — `dica_mounjaro` no drawer (mais simples, só renderização)
3. **Feature 3** — IG alerts (só lógica client-side, sem API)
4. **Feature 1** — aviso de confiança (estado novo no modal)
5. **Feature 4** — favoritos no Supabase (nova query + toggle)

---

## O que NÃO está no escopo

- Edição de refeição após salvar (não solicitado)
- Favoritos de refeições migrando de localStorage para Supabase (não solicitado)
- Export de log de refeições para PDF/CSV
- Remoção do código morto (`/api/recipe`, `planos_dieta`, `analisarRefeicao`) — deixar para PR separado
- Alteração no design visual da aba (mantém design system atual)
