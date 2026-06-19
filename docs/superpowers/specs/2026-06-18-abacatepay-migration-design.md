# Design: Migração Stripe → AbacatePay

**Data:** 2026-06-18  
**Status:** Aprovado

## Contexto

O app Momo usa assinaturas mensais (R$29,90) para acesso Premium. A integração com Stripe (Embedded Checkout + webhooks) nunca funcionou em produção — o sistema de pagamentos será substituído inteiramente pelo AbacatePay, provedor brasileiro.

## Visão Geral da Mudança

| Aspecto | Stripe (antes) | AbacatePay (depois) |
|---|---|---|
| Checkout | Embedded iframe | Hosted redirect |
| Portal | Stripe Customer Portal | Botão cancel direto via API |
| Webhook auth | HMAC-SHA256 + header `Stripe-Signature` | HMAC-SHA256 + header `X-Webhook-Signature` (base64) |
| Trial | `trial_period_days` no checkout | `trialDays` no produto |

## Pré-requisitos (usuário deve configurar)

1. Criar conta em [abacatepay.com](https://www.abacatepay.com)
2. No dashboard AbacatePay: criar produto mensal (R$29,90, cycle: MONTHLY) → anotar `ABACATEPAY_PRODUCT_ID`
3. Gerar API Key → `ABACATEPAY_API_KEY`
4. Anotar Public Key (para verificar webhooks) → `ABACATEPAY_PUBLIC_KEY`
5. Registrar webhook endpoint `https://www.usemomo.online/api/abacate/webhook?secret=VALOR` → anotar o secret → `ABACATEPAY_WEBHOOK_SECRET`

## Variáveis de Ambiente

### Remover
```
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID
```

### Adicionar
```
ABACATEPAY_API_KEY=        # Bearer token para chamadas à API
ABACATEPAY_PUBLIC_KEY=     # Chave pública para verificar assinatura do webhook
ABACATEPAY_PRODUCT_ID=     # ID do produto mensal criado no dashboard
ABACATEPAY_WEBHOOK_SECRET= # Query param secret na URL do webhook
```

## Banco de Dados

### Migration SQL
```sql
ALTER TABLE assinaturas
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS stripe_price_id,
  ADD COLUMN IF NOT EXISTS abacate_billing_id  text UNIQUE,
  ADD COLUMN IF NOT EXISTS abacate_customer_id text;
```

Colunas que **permanecem** inalteradas:
- `id`, `user_id`, `status`, `current_period_end`, `cancel_at_period_end`, `criado_em`, `atualizado_em`

`cancel_at_period_end` volta a ser necessário para sinalizar "cancelamento agendado".

## Arquivos a Deletar

- `app/api/stripe/create-checkout/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/stripe/portal/route.ts`
- `lib/stripe.ts`
- `components/StripeCheckout.tsx`

## Arquivos a Criar

### `app/api/abacate/create-checkout/route.ts`
- Requer auth (usuário logado via `createRouteClient`)
- Lê `ABACATEPAY_API_KEY` e `ABACATEPAY_PRODUCT_ID`
- Chama `POST https://api.abacatepay.com/v2/subscriptions/create` com:
  - `items: [{ id: PRODUCT_ID, quantity: 1 }]`
  - `externalId: user.id` (para lookup no webhook)
  - `completionUrl: https://www.usemomo.online/plano?success=1`
  - `returnUrl: https://www.usemomo.online/plano`
  - `methods: ["CARD"]`
- Retorna `{ url: data.url }` — o frontend redireciona

### `app/api/abacate/webhook/route.ts`
- Valida `?secret=` query param contra `ABACATEPAY_WEBHOOK_SECRET`
- Valida `X-Webhook-Signature` com HMAC-SHA256 usando `ABACATEPAY_PUBLIC_KEY` (base64)
- Usa `createServiceClient()` (service role, bypassa RLS)
- Processa eventos:

| Evento | Ação |
|---|---|
| `subscription.completed` | upsert `assinaturas` (via `externalId` = user_id): `status='ativa'`, `abacate_billing_id`, `abacate_customer_id`, `current_period_end`; update `profiles.plano_ativo='premium'`, `assinatura_expira_em` |
| `subscription.renewed` | update `assinaturas`: `status='ativa'`, `current_period_end`; update `profiles.assinatura_expira_em` |
| `subscription.cancelled` | update `assinaturas`: `status='cancelada'`; update `profiles.plano_ativo='expirado'`, `assinatura_expira_em=null` |

- Envia push notification em `subscription.completed`

### `app/api/abacate/cancel/route.ts`
- Requer auth
- Busca `abacate_billing_id` da assinatura ativa do usuário
- Chama AbacatePay cancel endpoint
- Independente do resultado da API: atualiza DB `cancel_at_period_end=true`
- **Não muda `status`** — acesso continua até `current_period_end`
- O webhook `subscription.cancelled` é quem efetivamente encerra o acesso

### `components/AbacateCheckout.tsx`
- Client component simples
- Botão "Ativar meu acompanhamento" com loading state
- Ao clicar: `POST /api/abacate/create-checkout` → recebe `{url}` → `window.location.href = url`
- Mostra erro se API falhar

## Arquivos a Modificar

### `middleware.ts`
- Linha 12: `/api/stripe` → `/api/abacate`

### `app/(app)/configuracoes/plano/PlanoClient.tsx`
- Remove import `StripeCheckout`, import `AbacateCheckout`
- Remove `openPortal()` (fetch para `/api/stripe/portal`)
- Adiciona `handleCancel()` (fetch para `/api/abacate/cancel`)
- Se `assinatura.cancel_at_period_end === true`: mostra "Cancelamento agendado para {current_period_end}" em vez do botão
- Se não: botão "Cancelar Assinatura" (vermelho, pede confirmação)

### `app/plano/PlanoClient.tsx`
- Remove `import { StripeCheckout }`
- Adiciona `import { AbacateCheckout }`
- Substitui `<StripeCheckout />` por `<AbacateCheckout />`

## Fluxo Completo (Usuário Novo)

```
1. Usuário clica "Ativar meu acompanhamento" em /plano
2. Frontend POST /api/abacate/create-checkout
3. Server cria checkout AbacatePay (externalId=user.id)
4. Frontend recebe {url} e redireciona
5. Usuário paga no AbacatePay hosted page
6. AbacatePay redireciona para /plano?success=1
7. AbacatePay dispara webhook subscription.completed
8. Webhook handler: upsert assinaturas + update profiles
9. Usuário tem acesso Premium
```

## Fluxo de Cancelamento

```
1. Usuário clica "Cancelar Assinatura" → confirma
2. Frontend POST /api/abacate/cancel
3. Server cancela no AbacatePay (para renovações futuras)
4. Server: assinaturas.cancel_at_period_end = true (status não muda)
5. UI mostra "Cancelamento agendado para {data}"
6. Usuário mantém acesso até current_period_end
7. AbacatePay dispara webhook subscription.cancelled
8. Webhook: status='cancelada', plano_ativo='expirado'
```

## Dependências NPM

### Remover
```
stripe
@stripe/react-stripe-js
@stripe/stripe-js
```

## Verificação de Assinatura do Webhook

```typescript
import crypto from 'node:crypto'

function verifyAbacateSignature(rawBody: string, signature: string, publicKey: string): boolean {
  const expected = crypto
    .createHmac('sha256', publicKey)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
```
