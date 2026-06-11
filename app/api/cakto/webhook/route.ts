import { createServiceClient } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

// 30 dias em ms — usado para calcular o próximo vencimento da assinatura.
const PERIODO_MS = 30 * 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Verificação HMAC: se CAKTO_WEBHOOK_SECRET estiver configurado, valida a assinatura.
  const webhookSecret = process.env.CAKTO_WEBHOOK_SECRET
  if (webhookSecret) {
    const signature = req.headers.get('x-cakto-signature') || req.headers.get('x-signature') || ''
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody, 'utf8')
      .digest('hex')
    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    const valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)
    if (!valid) {
      console.error('[Cakto] Webhook signature mismatch — request rejected')
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } else {
    console.warn('[Cakto] CAKTO_WEBHOOK_SECRET not set — signature verification skipped. Set this env var to secure the webhook.')
  }

  const body = JSON.parse(rawBody)
  // Service role: o webhook precisa achar/atualizar profiles de qualquer usuário
  // pelo email (fora do contexto de sessão), o que ignora RLS.
  const supabase = createServiceClient()

  console.log('Cakto webhook event:', body.event)

  const evento = body.event || body.custom_id
  const pedido = body.order || body

  switch (evento) {

    case 'purchase_approved': {
      // Pagamento aprovado — ativar acesso premium.
      const email = pedido.customer?.email
      if (!email) break

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile) {
        const proximoVencimento = new Date(Date.now() + PERIODO_MS)

        await supabase.from('assinaturas').upsert({
          user_id: profile.id,
          cakto_order_id: pedido.id?.toString(),
          status: 'ativa',
          valor: pedido.price,
          plano: 'mensal',
          proximo_vencimento: proximoVencimento.toISOString().split('T')[0],
        }, { onConflict: 'cakto_order_id' })

        // Espelha o status no profile (usado pelo hook usePlano e middleware).
        await supabase.from('profiles')
          .update({
            plano_ativo: 'premium',
            assinatura_expira_em: proximoVencimento.toISOString(),
          })
          .eq('id', profile.id)

        // Envia notificação Push de confirmação
        try {
          const baseUrl = "https://momo-rust-nu.vercel.app";
          await fetch(`${baseUrl}/api/push/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.N8N_SECRET ?? '' },
            body: JSON.stringify({
              userId: profile.id,
              title: "💎 Assinatura Premium Ativada!",
              body: "Parabéns! Seu acesso total ao Momo já está liberado.",
              url: "/"
            })
          });
        } catch (e) {
          console.error('[Cakto] Error sending welcome push:', e);
        }
      }
      break
    }

    case 'pix_generated': {
      const email = pedido.customer?.email
      if (!email) break
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile) {
        await supabase.from('assinaturas').upsert({
          user_id: profile.id,
          cakto_order_id: pedido.id?.toString(),
          status: 'pendente',
          valor: pedido.price,
          plano: 'mensal',
        }, { onConflict: 'cakto_order_id' })
      }
      break
    }

    case 'purchase_refused': {
      const email = pedido.customer?.email
      if (!email) break
      const { data: profile } = await supabase
        .from('profiles').select('id').eq('email', email).single()
      if (profile) {
        await supabase.from('assinaturas').upsert({
          user_id: profile.id,
          cakto_order_id: pedido.id?.toString(),
          status: 'recusada',
        }, { onConflict: 'cakto_order_id' })
      }
      break
    }

    case 'subscription_canceled':
    case 'refund': {
      const orderId = pedido.id?.toString()
      if (orderId) {
        const { data: assinatura } = await supabase
          .from('assinaturas')
          .update({ status: evento === 'refund' ? 'expirada' : 'cancelada' })
          .eq('cakto_order_id', orderId)
          .select('user_id')
          .single()

        if (assinatura) {
          // Sem acesso: marca como expirado e zera a data de expiração.
          await supabase.from('profiles')
            .update({ plano_ativo: 'expirado', assinatura_expira_em: null })
            .eq('id', assinatura.user_id)
        }
      }
      break
    }

    case 'subscription_renewed': {
      const orderId = pedido.id?.toString()
      if (orderId) {
        const proximoVencimento = new Date(Date.now() + PERIODO_MS)
        const { data: assinatura } = await supabase.from('assinaturas')
          .update({
            status: 'ativa',
            proximo_vencimento: proximoVencimento.toISOString().split('T')[0],
          })
          .eq('cakto_order_id', orderId)
          .select('user_id')
          .single()

        if (assinatura) {
          await supabase.from('profiles')
            .update({
              plano_ativo: 'premium',
              assinatura_expira_em: proximoVencimento.toISOString(),
            })
            .eq('id', assinatura.user_id)
        }
      }
      break
    }

    case 'subscription_renewal_refused': {
      const orderId = pedido.id?.toString()
      if (orderId) {
        const { data: ass } = await supabase.from('assinaturas')
          .update({ status: 'expirada' })
          .eq('cakto_order_id', orderId)
          .select('user_id')
          .single()
        if (ass) {
          await supabase.from('profiles')
            .update({ plano_ativo: 'expirado', assinatura_expira_em: null })
            .eq('id', ass.user_id)
        }
      }
      break
    }
  }

  return Response.json({ received: true })
}
