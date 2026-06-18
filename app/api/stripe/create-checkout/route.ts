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
    ui_mode: 'embedded' as any,
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: `${baseUrl}/plano?success=1`,
  })

  return Response.json({ clientSecret: session.client_secret })
}
