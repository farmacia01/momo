import { createRouteClient, createServiceClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = createRouteClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = createServiceClient()
    const { data: assinatura } = await admin
      .from('assinaturas')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!assinatura?.stripe_customer_id) {
      return Response.json({ error: 'Nenhum cliente Stripe encontrado' }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.usemomo.online'
    const session = await stripe.billingPortal.sessions.create({
      customer: assinatura.stripe_customer_id,
      return_url: `${baseUrl}/configuracoes/plano`,
    })

    return Response.json({ url: session.url })
  } catch (err: any) {
    console.error('[stripe/portal]', err?.message)
    return Response.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
