import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[stripe/webhook] signature verification failed:', err?.message)
    return Response.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  console.log('[stripe/webhook] event:', event.type)

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId: string = session.metadata?.user_id ?? ''
        if (!userId) {
          console.error('[stripe/webhook] checkout.session.completed: no user_id in metadata')
          break
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const isTrial = (subscription as any).status === 'trialing'
        // Durante trial, trial_end é quando vence (e quando cobra); fora de trial usa current_period_end
        const periodEnd = new Date(
          ((subscription as any).trial_end ?? (subscription as any).current_period_end) * 1000
        )

        await supabase.from('assinaturas').upsert({
          user_id: userId,
          stripe_session_id: session.id,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          status: isTrial ? 'trial' : 'ativa',
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        }, { onConflict: 'user_id' })

        await supabase.from('profiles').update({
          plano_ativo: 'premium',
          assinatura_expira_em: periodEnd.toISOString(),
        }).eq('id', userId)

        console.log('[stripe/webhook] checkout.session.completed: premium ativado para', userId)

        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.usemomo.online'
          await fetch(`${baseUrl}/api/push/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.N8N_SECRET ?? '' },
            body: JSON.stringify({ userId, title: '💎 Assinatura Premium Ativada!', body: 'Parabéns! Seu acesso total ao Momo já está liberado.', url: '/' }),
          })

          const adminEmail = process.env.ADMIN_EMAIL
          if (adminEmail) {
            const { data: adminProfile } = await supabase.from('profiles').select('id').eq('email', adminEmail).maybeSingle()
            if (adminProfile?.id) {
              const { data: userProfile } = await supabase.from('profiles').select('nome').eq('id', userId).maybeSingle()
              await fetch(`${baseUrl}/api/push/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.N8N_SECRET ?? '' },
                body: JSON.stringify({ userId: adminProfile.id, title: '💎 Nova Assinatura!', body: `${userProfile?.nome || 'Um usuário'} acabou de assinar o plano premium!`, url: '/admin/financeiro' }),
              })
            }
          }
        } catch (e) {
          console.error('[stripe/webhook] push notification failed:', e)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any
        const subId: string = invoice.subscription ?? ''
        if (!subId) break

        const subscription = await stripe.subscriptions.retrieve(subId)
        const periodEnd = new Date((subscription as any).current_period_end * 1000)

        const { data: assinatura } = await supabase.from('assinaturas')
          .update({ status: 'ativa', current_period_end: periodEnd.toISOString(), cancel_at_period_end: false })
          .eq('stripe_subscription_id', subId)
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
        const invoice = event.data.object as any
        const subId: string = invoice.subscription ?? ''
        if (!subId) break

        const { data: assinatura } = await supabase.from('assinaturas')
          .update({ status: 'expirada' })
          .eq('stripe_subscription_id', subId)
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
        const subscription = event.data.object as any
        const { data: assinatura } = await supabase.from('assinaturas')
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

      case 'customer.subscription.trial_will_end': {
        // Dispara 3 dias antes do trial terminar → avisa o cliente
        const sub = event.data.object as any
        const { data: assinatura } = await supabase
          .from('assinaturas')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle()

        if (assinatura?.user_id) {
          const trialEnd = sub.trial_end
            ? new Date(sub.trial_end * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
            : 'em breve'
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.usemomo.online'
          await fetch(`${baseUrl}/api/push/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.N8N_SECRET ?? '' },
            body: JSON.stringify({
              userId: assinatura.user_id,
              title: '⏰ Seu período gratuito termina em 3 dias',
              body: `No dia ${trialEnd} o cartão cadastrado será cobrado R$29,90. Tudo automático!`,
              url: '/plano',
            }),
          }).catch(() => {})
        }
        break
      }

      case 'customer.subscription.updated': {
        // Captura transição trial → ativa quando o plano começa a ser cobrado
        const sub = event.data.object as any
        const prevAttrs = (event.data as any).previous_attributes ?? {}
        const wasTrialing = prevAttrs.status === 'trialing'
        const isNowActive = sub.status === 'active'

        if (wasTrialing && isNowActive) {
          const periodEnd = new Date((sub as any).current_period_end * 1000)
          await supabase
            .from('assinaturas')
            .update({ status: 'ativa', current_period_end: periodEnd.toISOString() })
            .eq('stripe_subscription_id', sub.id)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as any
        const customerId: string = charge.customer ?? ''
        if (!customerId) break

        const { data: assinatura } = await supabase.from('assinaturas')
          .update({ status: 'expirada' })
          .eq('stripe_customer_id', customerId)
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

      default:
        console.log('[stripe/webhook] unhandled event:', event.type)
    }
  } catch (e: any) {
    console.error('[stripe/webhook] error processing', event.type, ':', e?.message)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }

  return Response.json({ received: true })
}
