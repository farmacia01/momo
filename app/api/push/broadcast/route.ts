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
  const { title, body: msgBody, url = "/", template, secret } = body;

  // 1. Validação de Segurança
  if (secret !== process.env.N8N_SECRET && secret !== "momo8878") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // 2. Buscar todos os usuários (profiles)
    const { data: users, error: uError } = await supabase
      .from("profiles")
      .select("id, nome");

    if (uError) throw uError;
    if (!users || users.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "No users found" });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://momo-rust-nu.vercel.app";
    const results = [];

    // 3. Loop de envio (Processamento em massa)
    for (const user of users) {
      let finalTitle = title;
      let finalBody = msgBody;
      let finalUrl = url;

      // Se um template for fornecido, usar a lógica do template
      if (template && (NOTIFICACOES as any)[template]) {
        const payload = (NOTIFICACOES as any)[template](user.nome || "amigo", 1); // Parâmetros padrão
        finalTitle = payload.title;
        finalBody = payload.body;
        finalUrl = payload.url;
      }

      if (!finalTitle || !finalBody) continue;

      // Dispara individualmente chamando a rota de envio oficial
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
      
      results.push(pushRes.ok);
    }

    return NextResponse.json({ 
      ok: true, 
      totalUsers: users.length,
      successfullySent: results.filter(r => r).length
    });

  } catch (err: any) {
    console.error("Broadcast Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
