import { NextRequest } from 'next/server'
import { createRouteClient, createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('[abacate/sync] start')
  try {
    const supabase = createRouteClient()
    console.log('[abacate/sync] getting user...')
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr) console.error('[abacate/sync] auth error:', authErr.message)
    if (!user) {
      console.log('[abacate/sync] no user, returning 401')
      return Response.json({ error: 'Não autenticado' }, { status: 401 })
    }
    console.log('[abacate/sync] user:', user.id, user.email)

    const apiKey = process.env.ABACATEPAY_API_KEY
    console.log('[abacate/sync] apiKey present:', !!apiKey)
    if (!apiKey) return Response.json({ error: 'API key missing' }, { status: 500 })

    console.log('[abacate/sync] creating service client...')
    let svc: ReturnType<typeof createServiceClient>
    try {
      svc = createServiceClient()
      console.log('[abacate/sync] service client ok')
    } catch (e: any) {
      console.error('[abacate/sync] createServiceClient failed:', e?.message)
      return Response.json({ error: 'Server config error: ' + e?.message }, { status: 500 })
    }

    // Check if user already has a known subscription ID stored
    console.log('[abacate/sync] querying existing sub...')
    const { data: existingSub, error: subQueryErr } = await svc
      .from('assinaturas')
      .select('abacate_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (subQueryErr) console.error('[abacate/sync] existing sub query error:', subQueryErr.message)
    console.log('[abacate/sync] existingSub:', JSON.stringify(existingSub))

    // List all subscriptions from AbacatePay
    console.log('[abacate/sync] fetching AbacatePay subscriptions...')
    const subsRes = await fetch('https://api.abacatepay.com/v2/subscriptions/list', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const subsData = await subsRes.json() as any
    const subscriptions: any[] = subsData.data ?? []
    console.log('[abacate/sync] all subs:', JSON.stringify(subscriptions))

    let activeSub = existingSub?.abacate_subscription_id
      ? subscriptions.find(s => s.id === existingSub.abacate_subscription_id && s.status === 'ACTIVE')
      : null

    if (!activeSub) {
      activeSub = subscriptions.find((s: any) => s.status === 'ACTIVE')
    }

    console.log('[abacate/sync] activeSub:', activeSub ? activeSub.id : 'none')

    if (!activeSub) {
      return Response.json({ synced: false, reason: 'no_active_subscription' })
    }

    const periodEnd = activeSub.nextBillingAt
      ? new Date(activeSub.nextBillingAt)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    console.log('[abacate/sync] upserting assinaturas...')
    const { error: upsertError } = await svc.from('assinaturas').upsert({
      user_id: user.id,
      abacate_subscription_id: activeSub.id,
      abacate_customer_id: activeSub.customerId ?? null,
      status: 'ativa',
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('[abacate/sync] upsert assinaturas failed:', upsertError.message, upsertError.code, upsertError.details)
      return Response.json({ error: upsertError.message }, { status: 500 })
    }
    console.log('[abacate/sync] assinaturas upserted ok')

    console.log('[abacate/sync] updating profiles...')
    const { error: profileErr } = await svc.from('profiles').update({
      plano_ativo: 'premium',
      assinatura_expira_em: periodEnd.toISOString(),
    }).eq('id', user.id)

    if (profileErr) {
      console.error('[abacate/sync] profiles update failed:', profileErr.message, profileErr.code)
      return Response.json({ error: 'profiles update failed: ' + profileErr.message }, { status: 500 })
    }
    console.log('[abacate/sync] profiles updated ok')

    console.log('[abacate/sync] premium granted for user', user.id, 'sub', activeSub.id)
    return Response.json({ synced: true })
  } catch (e: any) {
    console.error('[abacate/sync] unhandled error:', e?.message, e?.stack)
    return Response.json({ error: e?.message }, { status: 500 })
  }
}
