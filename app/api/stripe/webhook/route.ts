import { NextRequest } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function verifyStripeSignature(payload: string, sig: string, secret: string): boolean {
  const parts = sig.split(',').reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split('=')
    acc[k] = v
    return acc
  }, {})
  const t = parts['t']
  const v1 = parts['v1']
  if (!t || !v1) return false
  const tolerance = 300
  if (Math.abs(Date.now() / 1000 - parseInt(t)) > tolerance) return false
  const expected = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')
  return expected === v1
}

async function stripeGet(path: string, key: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  return res.json() as Promise<any>
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  if (!verifyStripeSignature(rawBody, sig, secret)) {
    console.error('[webhook] signature verification failed — check STRIPE_WEBHOOK_SECRET env var')
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let supabase: ReturnType<typeof createServiceClient>
  try {
    supabase = createServiceClient()
  } catch (e: any) {
    console.error('[webhook] createServiceClient failed — SUPABASE_SERVICE_ROLE_KEY missing:', e?.message)
    return Response.json({ error: 'Server config error' }, { status: 500 })
  }

  const event = JSON.parse(rawBody)
  const stripeKey = process.env.STRIPE_SECRET_KEY!

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode !== 'subscription') break

        // customer_details.email is more reliable than customer_email after checkout
        const email = session.customer_details?.email ?? session.customer_email
        if (!email) {
          console.error('[webhook] checkout.session.completed: no email in session', session.id)
          break
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single()

        if (profileError || !profile) {
          console.error('[webhook] profile not found for email:', email, profileError?.message)
          break
        }

        const subscription = await stripeGet(`subscriptions/${session.subscription}`, stripeKey)
        if (subscription.error) {
          console.error('[webhook] failed to fetch subscription:', subscription.error)
          break
        }
        const periodEnd = new Date(subscription.current_period_end * 1000)

        const { error: upsertError } = await supabase.from('assinaturas').upsert({
          user_id: profile.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer,
          stripe_price_id: subscription.items?.data?.[0]?.price?.id ?? null,
          status: 'ativa',
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        }, { onConflict: 'user_id' })

        if (upsertError) {
          console.error('[webhook] upsert assinaturas failed:', upsertError.message)
          break
        }

        await supabase.from('profiles').update({
          plano_ativo: 'premium',
          assinatura_expira_em: periodEnd.toISOString(),
        }).eq('id', profile.id)

        console.log('[webhook] checkout.session.completed: assinatura salva para', email)

        try {
          const baseUrl = 'https://www.usemomo.online'
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
          console.error('[webhook] push notification failed:', e)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        if (invoice.billing_reason === 'subscription_create') break
        const subscriptionId = invoice.subscription
        if (!subscriptionId) break

        const subscription = await stripeGet(`subscriptions/${subscriptionId}`, stripeKey)
        const periodEnd = new Date(subscription.current_period_end * 1000)

        const { data: assinatura } = await supabase
          .from('assinaturas')
          .update({ status: 'ativa', current_period_end: periodEnd.toISOString() })
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
        const invoice = event.data.object
        const subscriptionId = invoice.subscription
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
        const subscription = event.data.object
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
        const charge = event.data.object
        const invoiceId = charge.invoice
        if (!invoiceId) break

        const invoice = await stripeGet(`invoices/${invoiceId}`, stripeKey)
        const subscriptionId = invoice.subscription
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
  } catch (e: any) {
    console.error('[webhook] unhandled error for event', event.type, ':', e?.message)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }

  return Response.json({ received: true })
}
