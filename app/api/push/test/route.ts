import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * GET /api/push/test?secret=...
 * 
 * Envia uma notificação de teste IMEDIATA para o usuário logado.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  const n8nSecret = process.env.N8N_SECRET;
  if (!n8nSecret || !secret || secret !== n8nSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createRouteClient();

  try {
    // 1. Pega o ID do usuário logado na sessão
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Você precisa estar logado no app (neste navegador) para testar esta rota." }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // 2. Chama a rota oficial de disparo
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://momo-rust-nu.vercel.app";
    
    const pushRes = await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.N8N_SECRET ?? '' },
      body: JSON.stringify({
        userId,
        title: "🔔 Teste de Conexão",
        body: `Olá ${userEmail}, sua integração com o n8n está 100%!`,
        url: "/"
      })
    });

    const pushData = await pushRes.json();

    return NextResponse.json({ 
      ok: true, 
      message: "Comando de teste enviado!",
      recipient: userEmail,
      pushResponse: pushData
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
