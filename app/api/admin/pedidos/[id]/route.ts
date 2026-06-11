import { NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase-server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, mensagem } = await req.json().catch(() => ({}));
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  const admin = createServiceClient();
  const { data: pedido } = await admin.from("pedidos").select("id, codigo, paciente_id, fornecedor_id").eq("id", params.id).single();
  if (!pedido) return NextResponse.json({ error: "not found" }, { status: 404 });

  const statusMap: Record<string, string> = { reembolso: "cancelado", forcar_entregue: "entregue", cancelar: "cancelado" };
  const novoStatus = statusMap[action];
  if (!novoStatus) return NextResponse.json({ error: "invalid action" }, { status: 400 });

  const update: Record<string, string> = { status: novoStatus };
  if (action === "reembolso") update.cancelamento_motivo = mensagem || "Reembolso solicitado pelo admin";

  await admin.from("pedidos").update(update).eq("id", params.id);
  await admin.from("admin_logs").insert({
    admin_email: user.email, acao: action, entidade: "pedido", entidade_id: params.id,
    detalhes: { codigo: pedido.codigo, mensagem: mensagem || null },
  });

  return NextResponse.json({ ok: true, novoStatus });
}
