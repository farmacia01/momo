/**
 * Client helper to fire a web-push notification through /api/push/send, plus
 * the canonical message templates for order events.
 *
 * The patient-facing templates (aceito/enviado/cancelado) are meant to be
 * triggered by the supplier portal when it changes a pedido's status; they all
 * deep-link to /meus-pedidos. `novoPedidoParaFornecedor` is fired by the
 * patient flow right after an order is created.
 */

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPush(userId: string, payload: PushPayload): Promise<void> {
  if (!userId) return;
  try {
    await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...payload }),
    });
  } catch {
    // Notifications are best-effort — never block the user flow on them.
  }
}

export const pedidoNotificacoes = {
  aceito: (codigo: string, previsao: string): PushPayload => ({
    title: "✅ Pedido aceito!",
    body: `Seu pedido ${codigo} foi aceito! Previsão: ${previsao}`,
    url: "/meus-pedidos",
  }),
  enviado: (codigo: string, rastreio: string): PushPayload => ({
    title: "📦 A caminho!",
    body: `Seu Mounjaro está a caminho! Rastreio: ${rastreio}`,
    url: "/meus-pedidos",
  }),
  cancelado: (codigo: string, motivo: string): PushPayload => ({
    title: "❌ Pedido cancelado",
    body: `Pedido ${codigo} foi cancelado. Motivo: ${motivo}`,
    url: "/meus-pedidos",
  }),
  novoPedidoParaFornecedor: (codigo: string): PushPayload => ({
    title: "🛒 Novo pedido recebido!",
    body: `Você recebeu o pedido ${codigo}. Confirme para o paciente.`,
    url: "/fornecedor/pedidos",
  }),
};
