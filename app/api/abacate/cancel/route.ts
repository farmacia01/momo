import { createRouteClient, createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = createRouteClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const admin = createServiceClient()
    const { data: assinatura } = await admin
      .from('assinaturas')
      .select('abacate_subscription_id, abacate_billing_id, status')
      .eq('user_id', user.id)
      .eq('status', 'ativa')
      .single()

    if (!assinatura) {
      return Response.json({ error: 'Nenhuma assinatura ativa encontrada' }, { status: 404 })
    }

    const apiKey = process.env.ABACATEPAY_API_KEY!
    const subId = assinatura.abacate_subscription_id ?? assinatura.abacate_billing_id

    if (subId) {
      const cancelRes = await fetch(`https://api.abacatepay.com/v2/subscriptions/${subId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
      })

      if (!cancelRes.ok) {
        const err = await cancelRes.json().catch(() => ({})) as any
        console.error('[abacate/cancel] API error:', err)
        // Don't block — still mark in DB so UX reflects intent
      }
    }

    // Mark cancel_at_period_end but keep status=ativa — acesso continua até current_period_end
    await admin.from('assinaturas')
      .update({ cancel_at_period_end: true })
      .eq('user_id', user.id)

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error('[abacate/cancel]', err?.message)
    return Response.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
