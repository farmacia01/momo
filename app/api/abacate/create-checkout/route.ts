import { NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { user } } = await supabase.auth.getUser()

    const apiKey = process.env.ABACATEPAY_API_KEY
    const productId = process.env.ABACATEPAY_PRODUCT_ID
    if (!apiKey || !productId) {
      return Response.json({ error: `Env missing: key=${!!apiKey} product=${!!productId}` }, { status: 500 })
    }

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const baseUrl = 'https://www.usemomo.online'

    const res = await fetch('https://api.abacatepay.com/v2/subscriptions/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ id: productId, quantity: 1 }],
        externalId: user.id,
        completionUrl: `${baseUrl}/plano?success=1`,
        returnUrl: `${baseUrl}/plano`,
        methods: ['CARD'],
      }),
    })

    const data = await res.json() as any

    if (!res.ok || !data.success) {
      console.error('[abacate/create-checkout] error:', data)
      return Response.json({ error: data?.error || 'AbacatePay error' }, { status: 500 })
    }

    return Response.json({ url: data.data.url })
  } catch (err: any) {
    console.error('[abacate/create-checkout]', err?.message)
    return Response.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
