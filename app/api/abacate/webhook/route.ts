import { NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function verifySignature(rawBody: string, signature: string, publicKey: string): boolean {
  const expected = createHmac('sha256', publicKey)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Layer 1: query param secret
  const querySecret = req.nextUrl.searchParams.get('secret') ?? ''
  const envSecret = process.env.ABACATEPAY_WEBHOOK_SECRET ?? ''
  if (!envSecret || querySecret !== envSecret) {
    console.error('[abacate/webhook] invalid secret param')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Layer 2: HMAC signature — only verify if header is present
  const publicKey = process.env.ABACATEPAY_PUBLIC_KEY ?? ''
  const sig = req.headers.get('x-webhook-signature') ?? ''
  if (publicKey && sig) {
    if (!verifySignature(rawBody, sig, publicKey)) {
      console.error('[abacate/webhook] invalid HMAC signature')
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  // Log raw body so we can see AbacatePay's actual payload structure
  console.log('[abacate/webhook] raw body:', rawBody.substring(0, 500))

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('[abacate/webhook] event:', event.event, JSON.stringify(event.data))

  let supabase: ReturnType<typeof createServiceClient>
  try {
    supabase = createServiceClient()
  } catch (e: any) {
    console.error('[abacate/webhook] createServiceClient failed:', e?.message)
    return Response.json({ error: 'Server config error' }, { status: 500 })
  }

  try {
    switch (event.event) {

      case 'subscription.completed': {
        const d = event.data ?? {}
        // externalId = user.id (set when creating checkout)
        const userId: string = d.externalId ?? d.billing?.externalId ?? d.checkout?.externalId ?? ''
        if (!userId) {
          console.error('[abacate/webhook] subscription.completed: no externalId in payload', d)
          break
        }

        const billingId: string = d.billingId ?? d.billing?.id ?? d.checkoutId ?? d.id ?? ''
        const subscriptionId: string = d.subscriptionId ?? d.id ?? ''
        const customerId: string = d.customerId ?? d.customer?.id ?? ''

        // next billing date — try multiple field names
        const nextBilling: string | null =
          d.nextBillingAt ?? d.nextBillingDate ?? d.currentPeriodEnd ?? d.periodEnd ?? null
        const periodEnd = nextBilling ? new Date(nextBilling) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        const { error: upsertError } = await supabase.from('assinaturas').upsert({
          user_id: userId,
          abacate_billing_id: billingId || null,
          abacate_subscription_id: subscriptionId || null,
          abacate_customer_id: customerId || null,
          status: 'ativa',
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        }, { onConflict: 'user_id' })

        if (upsertError) {
          console.error('[abacate/webhook] upsert assinaturas failed:', upsertError.message)
          break
        }

        await supabase.from('profiles').update({
          plano_ativo: 'premium',
          assinatura_expira_em: periodEnd.toISOString(),
        }).eq('id', userId)

        console.log('[abacate/webhook] subscription.completed: assinatura salva para user', userId)

        try {
          await fetch('https://www.usemomo.online/api/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Key': process.env.N8N_SECRET ?? '',
            },
            body: JSON.stringify({
              userId,
              title: '💎 Assinatura Premium Ativada!',
              body: 'Parabéns! Seu acesso total ao Momo já está liberado.',
              url: '/',
            }),
          })
        } catch (e) {
          console.error('[abacate/webhook] push notification failed:', e)
        }
        break
      }

      case 'subscription.renewed': {
        const d = event.data ?? {}
        const subscriptionId: string = d.subscriptionId ?? d.id ?? ''
        const nextBilling: string | null = d.nextBillingAt ?? d.nextBillingDate ?? d.currentPeriodEnd ?? null
        const periodEnd = nextBilling ? new Date(nextBilling) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        // look up by subscription_id or billing_id or externalId
        const userId: string = d.externalId ?? d.billing?.externalId ?? ''

        if (userId) {
          const { error } = await supabase.from('assinaturas')
            .update({ status: 'ativa', current_period_end: periodEnd.toISOString(), cancel_at_period_end: false })
            .eq('user_id', userId)

          if (!error) {
            await supabase.from('profiles').update({
              plano_ativo: 'premium',
              assinatura_expira_em: periodEnd.toISOString(),
            }).eq('id', userId)
          }
        } else if (subscriptionId) {
          const { data: assinatura } = await supabase.from('assinaturas')
            .update({ status: 'ativa', current_period_end: periodEnd.toISOString(), cancel_at_period_end: false })
            .eq('abacate_subscription_id', subscriptionId)
            .select('user_id')
            .single()

          if (assinatura) {
            await supabase.from('profiles').update({
              plano_ativo: 'premium',
              assinatura_expira_em: periodEnd.toISOString(),
            }).eq('id', assinatura.user_id)
          }
        }

        console.log('[abacate/webhook] subscription.renewed for', userId || subscriptionId)
        break
      }

      case 'subscription.cancelled': {
        const d = event.data ?? {}
        const subscriptionId: string = d.subscriptionId ?? d.id ?? ''
        const userId: string = d.externalId ?? d.billing?.externalId ?? ''

        if (userId) {
          await supabase.from('assinaturas')
            .update({ status: 'cancelada' })
            .eq('user_id', userId)

          await supabase.from('profiles').update({
            plano_ativo: 'expirado',
            assinatura_expira_em: null,
          }).eq('id', userId)
        } else if (subscriptionId) {
          const { data: assinatura } = await supabase.from('assinaturas')
            .update({ status: 'cancelada' })
            .eq('abacate_subscription_id', subscriptionId)
            .select('user_id')
            .single()

          if (assinatura) {
            await supabase.from('profiles').update({
              plano_ativo: 'expirado',
              assinatura_expira_em: null,
            }).eq('id', assinatura.user_id)
          }
        }

        console.log('[abacate/webhook] subscription.cancelled for', userId || subscriptionId)
        break
      }

      default:
        console.log('[abacate/webhook] unhandled event:', event.event)
    }
  } catch (e: any) {
    console.error('[abacate/webhook] error processing event', event.event, ':', e?.message)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }

  return Response.json({ received: true })
}
