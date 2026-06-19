import { NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) return Response.json({ error: 'STRIPE_PRICE_ID não configurado' }, { status: 500 })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.usemomo.online'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ui_mode: 'embedded_page',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${baseUrl}/plano?success=1`,
      metadata: { user_id: user.id },
    })

    return Response.json({ clientSecret: session.client_secret })
  } catch (err: any) {
    console.error('[stripe/create-checkout]', err?.message)
    return Response.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
