# Stripe Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Cakto payment integration with Stripe Embedded Checkout + Customer Portal, with no disruption since there are no active subscribers.

**Architecture:** Server-side Stripe singleton creates embedded `CheckoutSession`s; a `StripeCheckout` React component renders `<EmbeddedCheckout>` inline; a webhook handler maps Stripe events to Supabase updates. Both PlanoClient pages switch from redirect links to the embedded checkout component.

**Tech Stack:** Next.js 14, Supabase, `stripe` (server SDK), `@stripe/stripe-js`, `@stripe/react-stripe-js`

## Global Constraints

- Next.js 14.2.15 — App Router, `runtime = 'nodejs'` on all API routes
- TypeScript strict mode
- Stripe API version: `2026-05-27.dahlia`
- Never pass `payment_method_types` to Stripe API calls
- Use `createRouteClient()` for auth-protected routes, `createServiceClient()` for webhook routes
- All currency values stored as BRL decimal (R$ 29,90 → `29.90`)
- Stripe restricted key (`rk_` prefix) for `STRIPE_SECRET_KEY`

---

## File Map

| Action | File |
|---|---|
| **Create** | `lib/stripe.ts` |
| **Create** | `supabase/migrations/20260618000000_stripe_migration.sql` |
| **Create** | `app/api/stripe/create-checkout/route.ts` |
| **Create** | `app/api/stripe/webhook/route.ts` |
| **Create** | `app/api/stripe/portal/route.ts` |
| **Create** | `components/StripeCheckout.tsx` |
| **Modify** | `app/(app)/configuracoes/plano/PlanoClient.tsx` |
| **Modify** | `app/(app)/configuracoes/plano/page.tsx` |
| **Modify** | `app/plano/PlanoClient.tsx` |
| **Modify** | `app/plano/page.tsx` |
| **Modify** | `middleware.ts` |
| **Modify** | `.env.example` |
| **Delete** | `lib/cakto.ts` |
| **Delete** | `app/api/cakto/webhook/route.ts` |
| **Delete** | `app/api/cakto/pedidos/route.ts` |
| **Delete** | `app/api/cakto/setup-webhook/route.ts` |

---

### Task 1: Install packages + `lib/stripe.ts` + `.env.example`

**Files:**
- Create: `lib/stripe.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `stripe` — singleton Stripe client, imported by all API routes

- [ ] **Step 1: Install dependencies**

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

Expected: packages added to `node_modules`, `package.json` updated with three new deps.

- [ ] **Step 2: Create `lib/stripe.ts`**

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})
```

- [ ] **Step 3: Update `.env.example`**

Add these four lines before the `# Automação` section:

```
# Stripe
STRIPE_SECRET_KEY=rk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `lib/stripe.ts`.

- [ ] **Step 5: Commit**

```bash
git add lib/stripe.ts .env.example package.json package-lock.json
git commit -m "feat(stripe): install SDK and create client singleton"
```

---

### Task 2: Database migration

**Files:**
- Create: `supabase/migrations/20260618000000_stripe_migration.sql`

**Interfaces:**
- Produces: `assinaturas.stripe_session_id`, `assinaturas.stripe_subscription_id`, `assinaturas.stripe_customer_id` columns used by webhook handler

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/20260618000000_stripe_migration.sql`:

```sql
-- Migration: 20260618000000_stripe_migration.sql
-- Replaces Cakto payment columns with Stripe equivalents.
-- Safe to run with no active subscribers.

ALTER TABLE assinaturas
  DROP COLUMN IF EXISTS cakto_order_id,
  DROP COLUMN IF EXISTS cakto_subscription_id;

ALTER TABLE assinaturas
  ADD COLUMN IF NOT EXISTS stripe_session_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;
```

- [ ] **Step 2: Apply migration locally (if running Supabase locally)**

```bash
npx supabase db push
```

If using remote Supabase, run the SQL manually via the Supabase dashboard SQL editor. Either way, verify the `assinaturas` table has the three new columns and no longer has `cakto_order_id` / `cakto_subscription_id`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260618000000_stripe_migration.sql
git commit -m "feat(stripe): migrate assinaturas table from Cakto to Stripe columns"
```

---

### Task 3: Checkout API route

**Files:**
- Create: `app/api/stripe/create-checkout/route.ts`

**Interfaces:**
- Consumes: `stripe` from `lib/stripe.ts`, `createRouteClient` from `@/lib/supabase-server`, `STRIPE_PRICE_ID` env var
- Produces: `POST /api/stripe/create-checkout` → `{ clientSecret: string }`

- [ ] **Step 1: Create the route**

Create `app/api/stripe/create-checkout/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const priceId = process.env.STRIPE_PRICE_ID!
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://momo-rust-nu.vercel.app'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ui_mode: 'embedded',
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: `${baseUrl}/plano?success=1`,
  })

  return Response.json({ clientSecret: session.client_secret })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/create-checkout/route.ts
git commit -m "feat(stripe): add create-checkout API route"
```

---

### Task 4: Webhook handler

**Files:**
- Create: `app/api/stripe/webhook/route.ts`

**Interfaces:**
- Consumes: `stripe` from `lib/stripe.ts`, `createServiceClient` from `@/lib/supabase-server`, `STRIPE_WEBHOOK_SECRET` env var
- Consumes DB columns: `stripe_subscription_id`, `stripe_session_id`, `stripe_customer_id` (from Task 2)
- Produces: `POST /api/stripe/webhook` — handles `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `charge.refunded`

- [ ] **Step 1: Create the route**

Create `app/api/stripe/webhook/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[Stripe] Webhook signature verification failed:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const email = session.customer_email
      if (!email) break

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (!profile) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const periodEnd = new Date(subscription.current_period_end * 1000)

      await supabase.from('assinaturas').upsert({
        user_id: profile.id,
        stripe_session_id: session.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: session.customer as string,
        status: 'ativa',
        valor: (subscription.items.data[0].price.unit_amount ?? 0) / 100,
        plano: 'mensal',
        proximo_vencimento: periodEnd.toISOString().split('T')[0],
      }, { onConflict: 'stripe_subscription_id' })

      await supabase.from('profiles').update({
        plano_ativo: 'premium',
        assinatura_expira_em: periodEnd.toISOString(),
      }).eq('id', profile.id)

      // Push notification de boas-vindas
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://momo-rust-nu.vercel.app'
        await fetch(`${baseUrl}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Key': process.env.N8N_SECRET ?? '',
          },
          body: JSON.stringify({
            userId: profile.id,
            title: '💎 Assinatura Premium Ativada!',
            body: 'Parabéns! Seu acesso total ao Momo já está liberado.',
            url: '/',
          }),
        })
      } catch (e) {
        console.error('[Stripe] Push notification failed:', e)
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      // Primeira cobrança já tratada por checkout.session.completed
      if (invoice.billing_reason === 'subscription_create') break

      const subscriptionId = invoice.subscription as string
      if (!subscriptionId) break

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const periodEnd = new Date(subscription.current_period_end * 1000)

      const { data: assinatura } = await supabase
        .from('assinaturas')
        .update({
          status: 'ativa',
          proximo_vencimento: periodEnd.toISOString().split('T')[0],
        })
        .eq('stripe_subscription_id', subscriptionId)
        .select('user_id')
        .single()

      if (assinatura) {
        await supabase.from('profiles').update({
          plano_ativo: 'premium',
          assinatura_expira_em: periodEnd.toISOString(),
        }).eq('id', assinatura.user_id)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string
      if (!subscriptionId) break

      const { data: assinatura } = await supabase
        .from('assinaturas')
        .update({ status: 'expirada' })
        .eq('stripe_subscription_id', subscriptionId)
        .select('user_id')
        .single()

      if (assinatura) {
        await supabase.from('profiles').update({
          plano_ativo: 'expirado',
          assinatura_expira_em: null,
        }).eq('id', assinatura.user_id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      const { data: assinatura } = await supabase
        .from('assinaturas')
        .update({ status: 'cancelada' })
        .eq('stripe_subscription_id', subscription.id)
        .select('user_id')
        .single()

      if (assinatura) {
        await supabase.from('profiles').update({
          plano_ativo: 'expirado',
          assinatura_expira_em: null,
        }).eq('id', assinatura.user_id)
      }
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const invoiceId = charge.invoice as string
      if (!invoiceId) break

      const invoice = await stripe.invoices.retrieve(invoiceId)
      const subscriptionId = invoice.subscription as string
      if (!subscriptionId) break

      const { data: assinatura } = await supabase
        .from('assinaturas')
        .update({ status: 'expirada' })
        .eq('stripe_subscription_id', subscriptionId)
        .select('user_id')
        .single()

      if (assinatura) {
        await supabase.from('profiles').update({
          plano_ativo: 'expirado',
          assinatura_expira_em: null,
        }).eq('id', assinatura.user_id)
      }
      break
    }
  }

  return Response.json({ received: true })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat(stripe): add webhook handler for subscription lifecycle events"
```

---

### Task 5: Customer Portal API route

**Files:**
- Create: `app/api/stripe/portal/route.ts`

**Interfaces:**
- Consumes: `stripe` from `lib/stripe.ts`, `createRouteClient` from `@/lib/supabase-server`, `stripe_customer_id` column from `assinaturas`
- Produces: `POST /api/stripe/portal` → `{ url: string }` — Stripe-hosted portal URL

- [ ] **Step 1: Create the route**

Create `app/api/stripe/portal/route.ts`:

```typescript
import { createRouteClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .order('criado_em', { ascending: false })
    .limit(1)
    .single()

  if (!assinatura?.stripe_customer_id) {
    return Response.json({ error: 'No Stripe customer found' }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://momo-rust-nu.vercel.app'

  const session = await stripe.billingPortal.sessions.create({
    customer: assinatura.stripe_customer_id,
    return_url: `${baseUrl}/configuracoes/plano`,
  })

  return Response.json({ url: session.url })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/portal/route.ts
git commit -m "feat(stripe): add customer portal API route"
```

---

### Task 6: `StripeCheckout` component

**Files:**
- Create: `components/StripeCheckout.tsx`

**Interfaces:**
- Consumes: `POST /api/stripe/create-checkout` (Task 3), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` env var
- Produces: `<StripeCheckout />` — renders Stripe's embedded checkout UI in-page

- [ ] **Step 1: Create the component**

Create `components/StripeCheckout.tsx`:

```tsx
"use client"

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function StripeCheckout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stripe/create-checkout', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.clientSecret) setClientSecret(data.clientSecret)
        else setError('Não foi possível iniciar o checkout.')
      })
      .catch(() => setError('Erro ao conectar com o servidor.'))
  }, [])

  if (error) {
    return (
      <p className="py-4 text-center text-sm text-danger">{error}</p>
    )
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ember border-t-transparent" />
      </div>
    )
  }

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/StripeCheckout.tsx
git commit -m "feat(stripe): add StripeCheckout embedded component"
```

---

### Task 7: Update paywall page `/plano`

**Files:**
- Modify: `app/plano/PlanoClient.tsx`
- Modify: `app/plano/page.tsx`

**Interfaces:**
- Consumes: `<StripeCheckout />` from `components/StripeCheckout.tsx` (Task 6)
- Consumes: `POST /api/stripe/portal` (Task 5)

- [ ] **Step 1: Rewrite `app/plano/PlanoClient.tsx`**

Full replacement (preserves all existing layout/styles, only changes checkout and portal logic):

```tsx
"use client";

import { useState } from "react";
import { AlertTriangle, TrendingUp, Utensils, Bell, Star, Package, ShieldCheck, Check, ChevronLeft } from "lucide-react";
import { StripeCheckout } from "@/components/StripeCheckout";

const DORES = [
  { icon: <AlertTriangle size={18} />, text: "Uma dose esquecida zera semanas de progresso — e você nem percebe" },
  { icon: <TrendingUp size={18} />, text: "Sem gráfico de peso, você não sabe se está perdendo gordura ou músculo" },
  { icon: <Utensils size={18} />, text: "A dieta errada sabota o efeito do Mounjaro sem você notar" },
];

const SOLUCOES = [
  { icon: <Bell size={16} />, titulo: "Nunca perca uma dose", desc: "Lembretes automáticos no dia e horário certos" },
  { icon: <TrendingUp size={16} />, titulo: "Veja seu progresso real", desc: "Gráficos de peso, medidas e sintomas semana a semana" },
  { icon: <Utensils size={16} />, titulo: "Receitas que não sabotam", desc: "Geradas por IA para sua fase do tratamento" },
  { icon: <Star size={16} />, titulo: "Histórico para o médico", desc: "Tudo registrado, pronto para a consulta" },
  { icon: <Package size={16} />, titulo: "Alerta de estoque", desc: "Saiba quando comprar antes de ficar sem ampola" },
];

export function PlanoClient({
  status,
  diasRestantesTrial,
  assinaturaExpiraEm,
}: {
  status: "trial" | "premium" | "expirado";
  diasRestantesTrial: number;
  assinaturaExpiraEm: string | null;
}) {
  const [showCheckout, setShowCheckout] = useState(false);

  if (status === "premium") {
    return <PremiumAtivo assinaturaExpiraEm={assinaturaExpiraEm} />;
  }

  return (
    <div className="min-h-screen bg-bg pb-12">
      {/* Header */}
      <div
        className="relative overflow-hidden px-5 pb-8"
        style={{
          background: "linear-gradient(135deg, #1a0800 0%, #2d1200 60%, #1a0800 100%)",
          paddingTop: "calc(env(safe-area-inset-top) + 20px)",
          boxShadow: "0 8px 32px rgba(255,101,0,0.18)",
        }}
      >
        <div
          className="absolute right-0 top-0 h-48 w-48 rounded-full opacity-10"
          style={{ background: "#ff6500", filter: "blur(50px)", transform: "translate(20%, -20%)" }}
        />
        <a
          href="/"
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          Voltar
        </a>
        <div className="relative z-10 space-y-3">
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: "rgba(255,101,0,0.85)" }}
          >
            Acompanhamento Mounjaro
          </p>
          <h1 className="text-[22px] font-black leading-[1.2] text-white">
            Você investe R$ 1.500/mês no tratamento. Sabe se está funcionando?
          </h1>
          <p className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            {status === "trial"
              ? `Seu trial expira em ${diasRestantesTrial} dia${diasRestantesTrial === 1 ? "" : "s"}`
              : "Seu acesso expirou. Não perca sua evolução."}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md space-y-5 px-5 pt-6">
        {/* Dores */}
        <div className="space-y-2.5">
          <p
            className="ml-1 text-[10px] font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-dim)" }}
          >
            O que acontece sem acompanhamento
          </p>
          {DORES.map((d, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <span className="mt-0.5 shrink-0" style={{ color: "#f87171" }}>{d.icon}</span>
              <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-text)" }}>
                {d.text}
              </p>
            </div>
          ))}
        </div>

        {/* Soluções */}
        <div
          className="space-y-4 rounded-[24px] p-5"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-dim)" }}
          >
            O que o Momo resolve
          </p>
          {SOLUCOES.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,101,0,0.1)", color: "#ff6500" }}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{s.titulo}</p>
                <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--color-text-muted)" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Preço + CTA */}
        <div
          className="space-y-4 rounded-[24px] p-6"
          style={{ background: "var(--color-surface-mid)", border: "1px solid var(--color-surface-border)" }}
        >
          <div className="space-y-1 text-center">
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--color-text-dim)" }}
            >
              Acesso completo
            </p>
            <div className="flex items-end justify-center gap-1">
              <span className="text-[36px] font-black leading-none tracking-tight" style={{ color: "var(--color-text)" }}>
                R$ 29,90
              </span>
              <span className="mb-1 text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                /mês
              </span>
            </div>
          </div>

          {showCheckout ? (
            <StripeCheckout />
          ) : (
            <button
              onClick={() => setShowCheckout(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-black text-white transition-transform active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #ff6500, #e05500)",
                boxShadow: "0 8px 24px rgba(255,101,0,0.4)",
              }}
            >
              Ativar meu acompanhamento
            </button>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--color-text-dim)" }}>
              <ShieldCheck size={13} style={{ color: "#ff6500" }} />
              Pagamento seguro
            </span>
            <span className="text-[11px]" style={{ color: "var(--color-surface-border)" }}>·</span>
            <span className="text-[11px] font-medium" style={{ color: "var(--color-text-dim)" }}>
              Cancele quando quiser
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PremiumAtivo({ assinaturaExpiraEm }: { assinaturaExpiraEm: string | null }) {
  const [loading, setLoading] = useState(false);

  const venc = assinaturaExpiraEm
    ? new Date(assinaturaExpiraEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Renovação automática";

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16" style={{ background: "#0d0d0d" }}>
      <div
        className="w-full max-w-sm rounded-[28px] p-8 text-center shadow-2xl"
        style={{ background: "#111", border: "1px solid rgba(255,101,0,0.15)" }}
      >
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgba(255,101,0,0.12)", border: "1px solid rgba(255,101,0,0.25)" }}
        >
          <Star size={28} style={{ color: "#ff6500", fill: "#ff6500" }} />
        </div>

        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider"
          style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}
        >
          <Check size={13} strokeWidth={3} /> Premium ativo
        </span>

        <h1 className="mt-4 text-2xl font-black text-white">Sua assinatura está ativa</h1>
        <p className="mt-2 text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
          Você tem acesso total a todos os recursos do Momo.
        </p>

        <div
          className="mt-6 rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
            Próximo vencimento
          </p>
          <p className="mt-1 text-base font-bold text-white">{venc}</p>
        </div>

        <button
          onClick={openPortal}
          disabled={loading}
          className="mt-6 block w-full rounded-full py-3.5 text-sm font-black transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #ff6500, #e05500)",
            color: "white",
            boxShadow: "0 4px 16px rgba(255,101,0,0.35)",
          }}
        >
          {loading ? "Abrindo..." : "Gerenciar assinatura"}
        </button>
        <a
          href="/"
          className="mt-3 block w-full rounded-full py-3.5 text-sm font-bold"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
          }}
        >
          Voltar ao app
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `app/plano/page.tsx` — remove `email` prop**

In `app/plano/page.tsx`, remove the `email` prop from the `<PlanoClient>` call. Replace:

```tsx
  return (
    <PlanoClient
      email={session.user.email ?? ""}
      status={status}
      diasRestantesTrial={diasRestantesTrial}
      assinaturaExpiraEm={profile?.assinatura_expira_em ?? null}
    />
  );
```

With:

```tsx
  return (
    <PlanoClient
      status={status}
      diasRestantesTrial={diasRestantesTrial}
      assinaturaExpiraEm={profile?.assinatura_expira_em ?? null}
    />
  );
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/plano/PlanoClient.tsx app/plano/page.tsx
git commit -m "feat(stripe): update /plano paywall page to use embedded checkout"
```

---

### Task 8: Update `/configuracoes/plano` settings page

**Files:**
- Modify: `app/(app)/configuracoes/plano/PlanoClient.tsx`
- Modify: `app/(app)/configuracoes/plano/page.tsx`

**Interfaces:**
- Consumes: `<StripeCheckout />` from `components/StripeCheckout.tsx` (Task 6)
- Consumes: `POST /api/stripe/portal` (Task 5)

- [ ] **Step 1: Rewrite `app/(app)/configuracoes/plano/PlanoClient.tsx`**

Full replacement (preserves all existing layout/styles):

```tsx
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Star, ExternalLink, Calendar, CreditCard, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, TrendingUp, Utensils, Bell, Package } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StripeCheckout } from "@/components/StripeCheckout";

interface PlanoClientProps {
  planoAtivo: string;
  assinatura: any;
}

const DORES = [
  { icon: <AlertTriangle size={18} />, text: "Uma dose esquecida zera semanas de progresso — e você nem percebe" },
  { icon: <TrendingUp size={18} />, text: "Sem gráfico de peso, você não sabe se está perdendo gordura ou músculo" },
  { icon: <Utensils size={18} />, text: "A dieta errada sabota o efeito do Mounjaro sem você notar" },
];

const SOLUCOES = [
  { icon: <Bell size={16} />, titulo: "Nunca perca uma dose", desc: "Lembretes automáticos no dia e horário certos" },
  { icon: <TrendingUp size={16} />, titulo: "Veja seu progresso real", desc: "Gráficos de peso, medidas e sintomas semana a semana" },
  { icon: <Utensils size={16} />, titulo: "Receitas que não sabotam", desc: "Geradas por IA para sua fase do tratamento" },
  { icon: <Star size={16} />, titulo: "Histórico para o médico", desc: "Tudo registrado, pronto para a consulta" },
  { icon: <Package size={16} />, titulo: "Alerta de estoque", desc: "Saiba quando comprar antes de ficar sem ampola" },
];

export function PlanoClient({ planoAtivo, assinatura }: PlanoClientProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const isPremium = planoAtivo === 'premium' && assinatura?.status === 'ativa';

  async function openPortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setLoadingPortal(false);
    }
  }

  if (isPremium) {
    return (
      <div className="space-y-6 pb-32">
        <PageHeader title="Meu Plano" />

        <div className="space-y-4 animate-fade-in">
          <div
            className="rounded-[24px] p-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1a0800, #2d1200)",
              border: "1px solid rgba(255,101,0,0.25)",
              boxShadow: "0 8px 24px rgba(255,101,0,0.15)",
            }}
          >
            <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full opacity-10" style={{ background: "#ff6500", filter: "blur(40px)" }} />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,101,0,0.15)", border: "1px solid rgba(255,101,0,0.3)" }}
              >
                <Star size={22} style={{ color: "var(--color-ember)", fill: "var(--color-ember)" }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Momo Premium</h2>
                <p className="text-xs font-medium text-white/60">
                  Assinatura {assinatura.plano}
                </p>
              </div>
            </div>

            <div
              className="space-y-3 rounded-2xl p-4 relative z-10"
              style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-surface-border)" }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <CreditCard size={15} />
                  <span>Status</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-success">
                  Ativa
                </span>
              </div>

              {assinatura.proximo_vencimento && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Calendar size={15} />
                    <span>Próxima renovação</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {format(parseISO(assinatura.proximo_vencimento), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}

              {assinatura.valor && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Star size={15} />
                    <span>Valor</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    R$ {assinatura.valor.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={openPortal}
            disabled={loadingPortal}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              color: "var(--color-text)",
            }}
          >
            <ExternalLink size={16} />
            {loadingPortal ? "Abrindo..." : "Gerenciar Assinatura"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <PageHeader title="Meu Plano" />

      <div className="space-y-5 animate-fade-in">
        {/* HERO */}
        <div
          className="rounded-[24px] p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a0800 0%, #2d1200 60%, #1a0800 100%)",
            boxShadow: "0 12px 40px rgba(255,101,0,0.2)",
          }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: "var(--color-ember)", filter: "blur(50px)", transform: "translate(20%, -20%)" }} />

          <div className="relative z-10 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ember opacity-80">
              Acompanhamento Mounjaro
            </p>
            <h1 className="text-[22px] font-black leading-[1.2] text-white">
              Você investe R$ 1.500/mês no tratamento. Sabe se está funcionando?
            </h1>
            <p className="text-[13px] font-medium leading-relaxed text-white/60">
              Sem dados, você está apostando no escuro.
            </p>
          </div>
        </div>

        {/* DORES */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] ml-1 text-text-dim">
            O que acontece sem acompanhamento
          </p>
          {DORES.map((dor, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <span className="shrink-0 mt-0.5 text-danger">{dor.icon}</span>
              <p className="text-sm font-medium leading-snug text-text">{dor.text}</p>
            </div>
          ))}
        </div>

        {/* SOLUÇÕES */}
        <div
          className="rounded-[24px] p-5 space-y-4"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-dim">
            O que o Momo resolve
          </p>
          {SOLUCOES.map((sol, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--color-ember-glow)", color: "var(--color-ember)" }}
              >
                {sol.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-text">{sol.titulo}</p>
                <p className="text-xs leading-snug mt-0.5 text-text-muted">{sol.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* PREÇO + CTA */}
        <div
          className="rounded-[24px] p-6 space-y-4"
          style={{ background: "var(--color-surface-mid)", border: "1px solid var(--color-surface-border)" }}
        >
          <div className="text-center space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-dim">
              Acesso completo
            </p>
            <div className="flex items-end justify-center gap-1">
              <span className="text-[36px] font-black tracking-tight text-text">R$ 29,90</span>
              <span className="text-sm font-medium mb-2 text-text-muted">/mês</span>
            </div>
          </div>

          {showCheckout ? (
            <StripeCheckout />
          ) : (
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-full text-base font-black text-white transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))",
                boxShadow: "var(--shadow-ember)",
              }}
            >
              Ativar meu acompanhamento
              <ArrowRight size={18} />
            </button>
          )}

          <div className="flex items-center justify-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-text-dim">
              <ShieldCheck size={13} className="text-ember" />
              Pagamento seguro
            </span>
            <span className="text-[11px] text-surface-border">·</span>
            <span className="text-[11px] font-medium text-text-dim">Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `app/(app)/configuracoes/plano/page.tsx` — remove `checkoutUrl`**

Replace the entire file content with:

```tsx
import { createServerClient } from "@/lib/supabase-server";
import { PlanoClient } from "./PlanoClient";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function PlanoPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plano_ativo')
    .eq('id', session.user.id)
    .single();

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('user_id', session.user.id)
    .order('criado_em', { ascending: false })
    .limit(1)
    .single();

  return (
    <PlanoClient
      planoAtivo={profile?.plano_ativo || 'free'}
      assinatura={assinatura}
    />
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/configuracoes/plano/PlanoClient.tsx" "app/(app)/configuracoes/plano/page.tsx"
git commit -m "feat(stripe): update /configuracoes/plano to use embedded checkout and Stripe portal"
```

---

### Task 9: Cleanup — delete Cakto files + update middleware + `.env.example`

**Files:**
- Delete: `lib/cakto.ts`
- Delete: `app/api/cakto/webhook/route.ts`
- Delete: `app/api/cakto/pedidos/route.ts`
- Delete: `app/api/cakto/setup-webhook/route.ts`
- Modify: `middleware.ts`

- [ ] **Step 1: Delete Cakto files**

```bash
git rm lib/cakto.ts
git rm app/api/cakto/webhook/route.ts
git rm app/api/cakto/pedidos/route.ts
git rm app/api/cakto/setup-webhook/route.ts
```

- [ ] **Step 2: Update `middleware.ts` — replace `/api/cakto` with `/api/stripe`**

In `middleware.ts`, find the `ROTAS_LIVRES` array and change `/api/cakto` to `/api/stripe`:

```typescript
const ROTAS_LIVRES = [
  '/',
  '/login',
  '/cadastro',
  '/plano',
  '/api/stripe',
  '/esqueceu-senha',
  '/redefinir-senha',
];
```

- [ ] **Step 3: Verify full build passes**

```bash
npx tsc --noEmit && npm run build
```

Expected: TypeScript passes, Next.js build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat(stripe): remove Cakto integration, update middleware for Stripe webhook route"
```

---

## Post-Implementation Setup Checklist

After all tasks are merged and deployed, complete these steps in the Stripe dashboard:

1. **Create product**: Stripe Dashboard → Products → Create a product "Momo Premium", add price R$ 29,90/month recurring → copy the `price_id` to `STRIPE_PRICE_ID` env var
2. **Add webhook endpoint**: Stripe Dashboard → Webhooks → Add endpoint `https://momo-rust-nu.vercel.app/api/stripe/webhook` → select events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `charge.refunded` → copy signing secret to `STRIPE_WEBHOOK_SECRET`
3. **Enable Customer Portal**: Stripe Dashboard → Billing → Customer Portal → enable and configure
4. **Add env vars to Vercel**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
5. **Test end-to-end**: use Stripe test mode, card `4242 4242 4242 4242`, verify Supabase `assinaturas` and `profiles.plano_ativo` update correctly
