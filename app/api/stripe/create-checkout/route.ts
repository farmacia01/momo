import { NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const isSignup = body.signup === true

  const priceId = process.env.STRIPE_PRICE_ID!
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://momo-rust-nu.vercel.app'

  const sessionParams: Record<string, any> = {
    mode: 'subscription',
    ui_mode: 'embedded' as any,
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: `${baseUrl}/plano?success=1`,
  }

  if (isSignup) {
    sessionParams.subscription_data = { trial_period_days: 7 }
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams)
    return Response.json({ clientSecret: session.client_secret })
  } catch (err: any) {
    const detail = { type: err?.type, code: err?.code, message: err?.message, status: err?.statusCode }
    console.error('[create-checkout] error:', JSON.stringify(detail))
    return Response.json({ error: err?.message || 'Stripe error', detail }, { status: 500 })
  }
}
