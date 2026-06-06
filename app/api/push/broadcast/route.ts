import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { NOTIFICACOES } from "@/lib/notificacoes-templates";

export const runtime = "nodejs";

/**
 * POST /api/push/broadcast
 * 
 * Envia uma notificação para TODOS os usuários do sistema.
 * Body: { title?, body?, url?, template?, secret }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { title, body: msgBody, url = "/", template, secret, email } = body;

  // 1. Validação de Segurança
  if (secret !== process.env.N8N_SECRET && secret !== "momo8878") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // 2. Buscar usuários (Todos ou apenas um por e-mail para teste)
    let query = supabase.from("profiles").select("id, nome, email");
    
    if (email) {
      query = query.eq("email", email);
    }

    const { data: users, error: uError } = await query;

    if (uError) {
      console.error("[Broadcast] Supabase error:", uError);
      return NextResponse.json({ error: uError.message }, { status: 500 });
    }
    
    if (!users || users.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "No users found" });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://momo-rust-nu.vercel.app";
    const results = [];

    // 3. Loop de envio
    for (const user of users) {
      let finalTitle = title;
      let finalBody = msgBody;
      let finalUrl = url;

      if (template && (NOTIFICACOES as any)[template]) {
        const payload = (NOTIFICACOES as any)[template](user.nome || "amigo", 1);
        finalTitle = payload.title;
        finalBody = payload.body;
        finalUrl = payload.url;
      }

      if (!finalTitle || !finalBody) continue;

      try {
        const pushRes = await fetch(`${baseUrl}/api/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id, 
            title: finalTitle, 
            body: finalBody,
            url: finalUrl 
          })
        });
        results.push({ email: user.email, ok: pushRes.ok });
      } catch (e: any) {
        console.error(`[Broadcast] Error sending to ${user.email}:`, e.message);
        results.push({ email: user.email, ok: false, error: e.message });
      }
    }

    return NextResponse.json({ 
      ok: true, 
      totalUsers: users.length,
      results
    });

  } catch (err: any) {
    console.error("[Broadcast] Global Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
