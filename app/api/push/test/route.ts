import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * GET /api/push/test
 * 
 * Envia uma notificação de teste IMEDIATA para o admin.
 * Use isso no n8n para testar se a entrega está funcionando.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const ADMIN_EMAIL = "evolinkbr@gmail.com";

  if (secret !== process.env.N8N_SECRET && secret !== "momo8878") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // 1. Busca o ID do seu usuário pelo email
    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", ADMIN_EMAIL)
      .single();

    if (pError || !profile) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    // 2. Chama a rota oficial de disparo
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://momo-rust-nu.vercel.app";
    
    const pushRes = await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: profile.id, 
        title: "🔔 Teste de Conexão", 
        body: "Se você recebeu isso, sua integração com o n8n está 100%!",
        url: "/" 
      })
    });

    const pushData = await pushRes.json();

    return NextResponse.json({ 
      ok: true, 
      message: "Comando de teste enviado!",
      recipient: ADMIN_EMAIL,
      pushResponse: pushData
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
