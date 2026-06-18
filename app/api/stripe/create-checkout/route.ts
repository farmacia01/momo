import { NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { user } } = await supabase.auth.getUser()

    const stripeKey = process.env.STRIPE_SECRET_KEY
    const priceId = process.env.STRIPE_PRICE_ID
    if (!stripeKey || !priceId) {
      return Response.json({ error: `Env missing: key=${!!stripeKey} price=${!!priceId}` }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const isSignup = body.signup === true
    const bodyEmail = typeof body.email === 'string' ? body.email : ''
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.usemomo.online'

    const customerEmail: string =
      (isSignup && bodyEmail.includes('@'))
        ? bodyEmail
        : (user?.email ?? '')

    if (!customerEmail) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Use fetch directly to avoid Stripe SDK v22 connection issues
    const formData = new URLSearchParams()
    formData.append('mode', 'subscription')
    formData.append('ui_mode', 'embedded_page')
    formData.append('customer_email', customerEmail)
    formData.append('line_items[0][price]', priceId)
    formData.append('line_items[0][quantity]', '1')
    formData.append('return_url', `${baseUrl}/plano?success=1`)
    if (isSignup) {
      formData.append('subscription_data[trial_period_days]', '7')
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const stripeData = await stripeRes.json() as any

    if (!stripeRes.ok) {
      return Response.json({
        error: stripeData?.error?.message || 'Stripe error',
        detail: stripeData?.error,
      }, { status: 500 })
    }

    return Response.json({ clientSecret: stripeData.client_secret })

  } catch (err: any) {
    console.error('[create-checkout]', err?.message)
    return Response.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
