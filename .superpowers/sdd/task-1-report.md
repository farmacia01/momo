# Task 1 Report — Split DietaClient.tsx into focused components

## What was done

Split `app/(app)/dieta/DietaClient.tsx` (1,039 lines) into 5 focused files with no behavior changes:

### New files created in `components/dieta/`

| File | Contents | Lines |
|---|---|---|
| `types.ts` | Shared types (`Refeicao`, `FavoritoRefeicao`, `TipoRefeicao`, `ReceitaIA`), constants (`TIPO_LABELS`, `CONFIANCA_CONFIG`), and localStorage helpers (`getFavoritos`, `saveFavoritos`) | ~60 |
| `DashboardTab.tsx` | Macros card, 7-day protein bar chart, nutritional guide accordion, "Registrar Refeição" button, today's meal list (with `RefeicaoCard`), 7-day history accordion | ~270 |
| `RegistrarRefeicaoModal.tsx` | Full AI meal registration flow — photo upload, text description, analyze API call, result review/confirm, favorites quick-add, Supabase insert + photo upload to storage | ~210 |
| `ReceitaDrawer.tsx` | Recipe detail modal — macro grid, ingredients list, step-by-step preparation | ~90 |
| `ReceitasTab.tsx` | Recipe grid with restriction filters, load/refresh logic, opens `ReceitaDrawer` on selection | ~115 |

### Updated file

`app/(app)/dieta/DietaClient.tsx` reduced from 1,039 → ~120 lines. Now contains only:
- Tab state (`Dashboard` | `Receitas`)
- Shared data state (`refeicoes`, `favoritos`, `hoje`)
- Event handlers (`toggleFavorito`, `removerRefeicao`, `onRefeicaoSalva`)
- Shell render: `PageHeader`, `BlurPaywall`, tab switcher, renders the 4 components

## Key decisions

1. **`RefeicaoCard` stays local in `DashboardTab.tsx`** — it's only used there, no reason to extract further.
2. **`TIPOS_OPTIONS` stays local in `RegistrarRefeicaoModal.tsx`** — same reason.
3. **`RESTRICOES_OPTIONS` stays local in `ReceitasTab.tsx`** — same reason.
4. **`getFavoritos`/`saveFavoritos` moved to `types.ts`** — they're pure utilities closely tied to the `FavoritoRefeicao` type, and both `DietaClient` and `RegistrarRefeicaoModal` need the type; avoids a separate `utils.ts`.
5. **`DashboardTab` receives `hoje` as a prop** — the day-boundary interval timer is business logic that lives in the shell, not in the tab. The tab becomes a pure display component.
6. **`ReceitasTab` receives `userId` prop** — currently unused inside `ReceitasTab`, but kept to match the original `ReceitasIA` signature in case it's needed for future personalization (no behavior change).

## TypeScript result

`npx tsc --noEmit` — **zero errors, zero warnings** (no output = clean pass).

## Commit

Hash: `3941496`
Message: `refactor(dieta): dividir DietaClient.tsx em componentes focados`

Files changed: 6 (5 created, 1 rewritten), 976 insertions, 900 deletions.
