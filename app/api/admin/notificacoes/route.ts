import { NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase-server";
import webpush from "web-push";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function POST(req: Request) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { titulo, mensagem, url = "/", segmento } = await req.json().catch(() => ({}));
  if (!titulo || !mensagem || !segmento) return NextResponse.json({ error: "titulo, mensagem e segmento são obrigatórios" }, { status: 400 });

  const admin = createServiceClient();
  const agora = new Date().toISOString();
  const hoje = new Date();

  let query = admin.from("profiles").select("id");

  if (segmento === "premium") {
    query = query.eq("plano_ativo", "premium");
  } else if (segmento === "trial") {
    query = query.eq("plano_ativo", "trial");
  } else if (segmento === "trial_expirando") {
    const em2dias = new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    query = query.eq("plano_ativo", "trial").lte("trial_expira_em", em2dias).gte("trial_expira_em", agora);
  } else if (segmento === "sem_dose_10d") {
    const ha10dias = new Date(hoje.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const { data: comDose } = await admin.from("doses").select("user_id").gte("data_aplicacao", ha10dias);
    const idsComDose = Array.from(new Set((comDose || []).map((d) => d.user_id)));
    query = query.in("plano_ativo", ["premium", "trial"]);
    if (idsComDose.length > 0) query = query.not("id", "in", `(${idsComDose.join(",")})`);
  } else if (segmento === "sem_peso_7d") {
    const ha7dias = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: comPeso } = await admin.from("medicoes_saude").select("user_id").gte("data_medicao", ha7dias);
    const idsComPeso = Array.from(new Set((comPeso || []).map((d) => d.user_id)));
    query = query.in("plano_ativo", ["premium", "trial"]);
    if (idsComPeso.length > 0) query = query.not("id", "in", `(${idsComPeso.join(",")})`);
  } else if (segmento === "todos") {
    query = query.in("plano_ativo", ["premium", "trial"]);
  }

  const { data: usuarios } = await query;
  if (!usuarios || usuarios.length === 0) {
    await admin.from("notification_history").insert({ admin_email: ADMIN_EMAIL, titulo, mensagem, url, segmento, total_enviado: 0 });
    return NextResponse.json({ ok: true, enviado: 0, totalUsuarios: 0 });
  }

  const userIds = usuarios.map((u) => u.id);
  const { data: subs } = await admin.from("push_subscriptions").select("user_id, id, subscription_json").in("user_id", userIds);

  if (!subs || subs.length === 0) {
    await admin.from("notification_history").insert({ admin_email: ADMIN_EMAIL, titulo, mensagem, url, segmento, total_enviado: 0 });
    return NextResponse.json({ ok: true, enviado: 0, totalUsuarios: userIds.length });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return NextResponse.json({ error: "Push não configurado" }, { status: 500 });

  webpush.setVapidDetails(process.env.VAPID_EMAIL || "mailto:no-reply@momo.app", publicKey, privateKey);
  const payload = JSON.stringify({ title: titulo, body: mensagem, url });

  const results = await Promise.allSettled(subs.map((s) => webpush.sendNotification(JSON.parse(s.subscription_json), payload)));

  const stale: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected" && [404, 410].includes((r.reason as any)?.statusCode ?? 0)) {
      stale.push(subs[i].id);
    }
  });
  if (stale.length > 0) await admin.from("push_subscriptions").delete().in("id", stale);

  const enviado = results.filter((r) => r.status === "fulfilled").length;

  await admin.from("notification_history").insert({ admin_email: ADMIN_EMAIL, titulo, mensagem, url, segmento, total_enviado: enviado });
  await admin.from("admin_logs").insert({
    admin_email: user.email, acao: "notificacao_massa", entidade: "notificacao",
    detalhes: { titulo, segmento, total_enviado: enviado, total_usuarios: userIds.length },
  });

  return NextResponse.json({ ok: true, enviado, totalUsuarios: userIds.length });
}
