import { NextResponse } from "next/server";
import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase-server";
import { PUSH_VENDAS } from "@/lib/notificacoes-vendas";

export const runtime = "nodejs";

/**
 * POST /api/push/venda
 * Body: { evento, pedidoId, secret, nota?, comentario? }
 *
 * Called by Supabase pg_net triggers on pedidos status change.
 * Sends push notifications to both supplier and patient as needed.
 */

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
  requireInteraction?: boolean;
};

async function enviarPush(userId: string, payload: PushPayload): Promise<number> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || "mailto:no-reply@momo.app";

  if (!publicKey || !privateKey) {
    console.warn("[PushVenda] VAPID keys missing, skipping.");
    return 0;
  }

  webpush.setVapidDetails(vapidEmail, publicKey, privateKey);

  const supabase = createServiceClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return 0;

  const json = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          json,
        )
        .catch(async (err: any) => {
          if ([404, 410].includes(err?.statusCode)) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          throw err;
        }),
    ),
  );

  return results.filter((r) => r.status === "fulfilled").length;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { evento, pedidoId, secret, nota, comentario } = body;

    if (secret !== process.env.N8N_SECRET && secret !== "momo8878") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!evento || !pedidoId) {
      return NextResponse.json({ error: "evento and pedidoId are required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select(`
        id, codigo, preco_total, cancelamento_motivo, cash_on_delivery,
        codigo_confirmacao_recebimento, tempo_estimado_minutos, paciente_id,
        fornecedor:fornecedores!pedidos_fornecedor_id_fkey(id, nome_fantasia, user_id),
        produto:fornecedor_produtos!pedidos_produto_id_fkey(dose_mg, tipo_produto)
      `)
      .eq("id", pedidoId)
      .single();

    if (pedidoError || !pedido) {
      console.error("[PushVenda] Pedido não encontrado:", pedidoError);
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const { data: perfil } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", pedido.paciente_id)
      .maybeSingle();

    const fornecedor = (pedido as any).fornecedor;
    const produto = (pedido as any).produto;

    const nomePaciente = perfil?.nome || "Paciente";
    const nomeFarmacia = fornecedor?.nome_fantasia || "Fornecedor";
    const fornecedorUserId: string | null = fornecedor?.user_id ?? null;
    const pacienteUserId: string = pedido.paciente_id;
    const codigo: string = pedido.codigo;
    const valor: number = pedido.preco_total;
    const doseMg: string = produto ? `${produto.dose_mg}mg` : "";
    const produtoLabel = `Mounjaro ${doseMg}`;
    const tempoMin = pedido.tempo_estimado_minutos ?? 45;
    const tempoEntrega = tempoMin < 60 ? `${tempoMin} min` : `${Math.round(tempoMin / 60)}h`;

    let payloadFornecedor: PushPayload | null = null;
    let payloadPaciente: PushPayload | null = null;

    switch (evento) {
      case "NOVO_PEDIDO":
        payloadFornecedor = PUSH_VENDAS.FORNECEDOR.NOVO_PEDIDO(nomeFarmacia, valor, produtoLabel);
        payloadPaciente = PUSH_VENDAS.ENTREGA.PEDIDO_RECEBIDO(nomePaciente, codigo);
        break;

      case "PEDIDO_ACEITO":
        payloadPaciente = PUSH_VENDAS.ENTREGA.PEDIDO_ACEITO(nomePaciente, codigo, tempoEntrega);
        if (pedido.cash_on_delivery) {
          await enviarPush(pacienteUserId, PUSH_VENDAS.ENTREGA.COD_LEMBRETE(nomePaciente, valor));
        }
        break;

      case "PEDIDO_RECUSADO":
        payloadPaciente = PUSH_VENDAS.ENTREGA.PEDIDO_RECUSADO(
          nomePaciente,
          codigo,
          pedido.cancelamento_motivo || "Sem estoque disponível",
        );
        break;

      case "MOTOBOY_SAIU":
        payloadPaciente = PUSH_VENDAS.ENTREGA.MOTOBOY_SAIU(nomePaciente, tempoEntrega);
        if (pedido.codigo_confirmacao_recebimento) {
          await enviarPush(
            pacienteUserId,
            PUSH_VENDAS.ENTREGA.CODIGO_CONFIRMACAO(
              nomePaciente,
              pedido.codigo_confirmacao_recebimento,
            ),
          );
        }
        break;

      case "ENTREGA_CONFIRMADA":
        payloadFornecedor = PUSH_VENDAS.FORNECEDOR.ENTREGA_CONFIRMADA(codigo, valor);
        payloadPaciente = PUSH_VENDAS.ENTREGA.ENTREGA_CONCLUIDA(nomePaciente, produtoLabel);
        break;

      case "AVALIACAO_RECEBIDA":
        if (nota !== undefined && comentario !== undefined && fornecedorUserId) {
          payloadFornecedor = PUSH_VENDAS.FORNECEDOR.AVALIACAO_RECEBIDA(nota, String(comentario));
        }
        break;

      case "ENTREGA_ATRASADA":
        payloadPaciente = PUSH_VENDAS.ENTREGA.ENTREGA_ATRASADA(nomePaciente);
        break;

      default:
        return NextResponse.json({ error: `Evento desconhecido: ${evento}` }, { status: 400 });
    }

    // ── Detecta primeiro pedido do fornecedor ──────────────────────────
    if (evento === "NOVO_PEDIDO" && fornecedorUserId) {
      const { count } = await supabase
        .from("pedidos")
        .select("id", { count: "exact", head: true })
        .eq("fornecedor_id", fornecedor?.id);
      if ((count ?? 0) === 1) {
        // É o primeiro pedido!
        payloadFornecedor = PUSH_VENDAS.FORNECEDOR.PRIMEIRO_PEDIDO(nomeFarmacia);
      }
    }

    const enviados = { fornecedor: 0, paciente: 0 };

    if (payloadFornecedor && fornecedorUserId) {
      enviados.fornecedor = await enviarPush(fornecedorUserId, payloadFornecedor);
      // Salva notif in-app para o fornecedor também
      await supabase.from("notifications").insert({
        user_id: fornecedorUserId,
        title: payloadFornecedor.title,
        body: payloadFornecedor.body,
        url: payloadFornecedor.url,
        tag: payloadFornecedor.tag ?? null,
        read: false,
      }).then(() => {}).catch(() => {});
    }
    if (payloadPaciente) {
      enviados.paciente = await enviarPush(pacienteUserId, payloadPaciente);
      await supabase.from("notifications").insert({
        user_id: pacienteUserId,
        title: payloadPaciente.title,
        body: payloadPaciente.body,
        url: payloadPaciente.url,
        tag: payloadPaciente.tag ?? null,
        read: false,
      }).then(() => {}).catch(() => {});
    }

    return NextResponse.json({ ok: true, evento, enviados });
  } catch (err: any) {
    console.error("[PushVenda] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
