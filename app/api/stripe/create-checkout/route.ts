import { NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const plan: 'mensal' | 'trimestral' = body?.plan === 'trimestral' ? 'trimestral' : 'mensal'

    const priceId = plan === 'trimestral'
      ? process.env.STRIPE_PRICE_ID_TRIMESTRAL
      : process.env.STRIPE_PRICE_ID

    if (!priceId) return Response.json({ error: `STRIPE_PRICE_ID${plan === 'trimestral' ? '_TRIMESTRAL' : ''} não configurado` }, { status: 500 })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.usemomo.online'

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: 'subscription',
      ui_mode: 'embedded_page',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${baseUrl}/plano?success=1`,
      metadata: { user_id: user.id, plano: plan },
      payment_method_configuration: 'pmc_1TjVfQH7t2oko0FsF3Q1JwoF',
      subscription_data: {
        metadata: { user_id: user.id, plano: plan },
      },
    }

    // Trial apenas no plano mensal
    if (plan === 'mensal') {
      sessionParams.subscription_data!.trial_period_days = 7
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return Response.json({ clientSecret: session.client_secret })
  } catch (err: any) {
    console.error('[stripe/create-checkout]', err?.message)
    return Response.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
