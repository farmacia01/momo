import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { NOTIFICACOES } from "@/lib/notificacoes-templates";

export const runtime = "nodejs";

/**
 * GET or POST /api/push/broadcast
 * 
 * Envia uma notificação para TODOS os usuários do sistema ou um específico.
 * Pode ser chamado via GET (n8n friendly) ou POST.
 * Parâmetros (via URL ou Body): { secret, template?, category?, email?, title?, body?, url? }
 */
export async function GET(req: Request) {
  return handleBroadcast(req);
}

export async function POST(req: Request) {
  return handleBroadcast(req);
}

async function handleBroadcast(req: Request) {
  const { searchParams } = new URL(req.url);
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

  // Prioridade para URL (n8n), depois Body
  const secret = searchParams.get("secret") || body.secret;
  const template = searchParams.get("template") || body.template || "INATIVO_3DIAS";
  const category = searchParams.get("category") || body.category || "ENGAJAMENTO";
  const email = searchParams.get("email") || body.email;
  const title = searchParams.get("title") || body.title;
  const msgBody = searchParams.get("body") || body.body;
  const url = searchParams.get("url") || body.url || "/";

  // 1. Validação de Segurança: aceita N8N_SECRET (n8n/server) ou sessão admin (painel)
  const n8nSecret = process.env.N8N_SECRET;
  const isN8n = n8nSecret && n8nSecret.length > 0 && secret === n8nSecret;
  if (!isN8n) {
    const { createRouteClient } = await import("@/lib/supabase-server");
    const supabase = createRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    if (!user || !ADMIN_EMAIL || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = createServiceClient();

    // 2. Buscar usuários
    let query = supabase.from("profiles").select("id, nome, email");
    if (email) query = query.eq("email", email);

    const { data: users, error: uError } = await query;
    if (uError) throw uError;
    if (!users || users.length === 0) return NextResponse.json({ ok: true, sent: 0, message: "No users found" });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://momo-rust-nu.vercel.app";
    const results = [];

    // 3. Loop de envio
    for (const user of users) {
      let finalTitle = title;
      let finalBody = msgBody;
      let finalUrl = url;

      // Se não passou título/corpo manual, tenta o template
      if (!finalTitle || !finalBody) {
        const categoryMap = (NOTIFICACOES as any)[category];
        const templateFn = categoryMap ? categoryMap[template] : null;

        if (typeof templateFn === 'function') {
          const payload = templateFn(user.nome || "amigo", 5, "🏆"); 
          finalTitle = payload.title;
          finalBody = payload.body;
          finalUrl = payload.url;
        }
      }

      if (!finalTitle || !finalBody) continue;

      try {
        const pushRes = await fetch(`${baseUrl}/api/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.N8N_SECRET ?? '' },
          body: JSON.stringify({
            userId: user.id,
            title: finalTitle,
            body: finalBody,
            url: finalUrl
          })
        });
        results.push({ email: user.email, ok: pushRes.ok });
      } catch (e: any) {
        results.push({ email: user.email, ok: false, error: e.message });
      }
    }

    return NextResponse.json({ 
      ok: true, 
      templateUsed: `${category}.${template}`,
      totalUsers: users.length,
      successfullySent: results.filter(r => r.ok).length
    });

  } catch (err: any) {
    console.error("[Broadcast] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
