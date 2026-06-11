import { NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase-server";
import webpush from "web-push";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

async function pushToUser(userId: string, title: string, body: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:no-reply@momo.app";
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(email, publicKey, privateKey);
  const admin = createServiceClient();
  const { data: subs } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", userId);
  if (!subs || subs.length === 0) return;
  const payload = JSON.stringify({ title, body, url: "/fornecedor" });
  await Promise.allSettled(subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, motivo } = await req.json().catch(() => ({}));
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  const statusMap: Record<string, string> = { aprovar: "ativo", rejeitar: "reprovado", suspender: "suspenso", reativar: "ativo" };
  const novoStatus = statusMap[action];
  if (!novoStatus) return NextResponse.json({ error: "invalid action" }, { status: 400 });

  const admin = createServiceClient();
  const { data: fornecedor, error } = await admin.from("fornecedores").select("id, user_id, nome_fantasia, razao_social").eq("id", params.id).single();
  if (error || !fornecedor) return NextResponse.json({ error: "not found" }, { status: 404 });

  await admin.from("fornecedores").update({ status: novoStatus }).eq("id", params.id);

  await admin.from("admin_logs").insert({
    admin_email: user.email, acao: action, entidade: "fornecedor", entidade_id: params.id,
    detalhes: { motivo: motivo || null, nome: fornecedor.nome_fantasia || fornecedor.razao_social },
  });

  const pushMessages: Record<string, { title: string; body: string }> = {
    aprovar:   { title: "✅ Farmácia aprovada!", body: "Sua farmácia foi aprovada no Momo! Comece a receber pedidos." },
    rejeitar:  { title: "❌ Cadastro reprovado", body: motivo || "Seu cadastro foi reprovado. Entre em contato com o suporte." },
    suspender: { title: "⚠️ Conta suspensa",     body: motivo || "Sua conta foi suspensa. Entre em contato com o suporte." },
    reativar:  { title: "✅ Conta reativada!",    body: "Sua conta no Momo foi reativada. Boas vendas!" },
  };

  if (fornecedor.user_id && pushMessages[action]) {
    const { title, body } = pushMessages[action];
    await pushToUser(fornecedor.user_id, title, body).catch(() => {});
  }

  return NextResponse.json({ ok: true, novoStatus });
}
