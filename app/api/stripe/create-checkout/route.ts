import { NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    const priceId = process.env.STRIPE_PRICE_ID
    if (!stripeKey || !priceId) {
      return Response.json({ error: `Env missing: key=${!!stripeKey} price=${!!priceId}` }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const isSignup = body.signup === true
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.usemomo.online'

    const sessionParams: Record<string, any> = {
      mode: 'subscription',
      ui_mode: 'embedded',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${baseUrl}/plano?success=1`,
    }

    if (isSignup) {
      sessionParams.subscription_data = { trial_period_days: 7 }
    }

    const stripeClient = getStripe()
    const session = await stripeClient.checkout.sessions.create(sessionParams)
    return Response.json({ clientSecret: session.client_secret })

  } catch (err: any) {
    const detail = {
      type: err?.type,
      code: err?.code,
      message: err?.message,
      statusCode: err?.statusCode,
      raw: String(err),
    }
    console.error('[create-checkout]', JSON.stringify(detail))
    return Response.json({ error: err?.message || String(err), detail }, { status: 500 })
  }
}
