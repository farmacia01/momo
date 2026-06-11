import { NextResponse } from "next/server";
import { NOTIFICACOES, NotificationTemplateKey } from "@/lib/notificacoes-templates";

export const runtime = "nodejs";

/**
 * POST /api/push/enviar-template
 * 
 * Dispara uma notificação baseada em um template pré-definido.
 * Body: { userId, template, category, params: [] }
 */
export async function POST(req: Request) {
  // Somente callers autenticados (server-side via X-Internal-Key ou sessão de usuário)
  const internalKey = req.headers.get("x-internal-key");
  const n8nSecret = process.env.N8N_SECRET;
  const isInternal = n8nSecret && n8nSecret.length > 0 && internalKey === n8nSecret;

  if (!isInternal) {
    const { createRouteClient } = await import("@/lib/supabase-server");
    const supabase = createRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { userId, template, category, params = [] } = await req.json().catch(() => ({}));

  if (!userId || !template) {
    return NextResponse.json({ error: "userId and template are required" }, { status: 400 });
  }

  // 1. Validar template
  const categoryMap = category ? (NOTIFICACOES as any)[category] : null;
  const templateFn = categoryMap ? categoryMap[template] : (NOTIFICACOES as any)[template];

  if (!templateFn || typeof templateFn !== 'function') {
    return NextResponse.json({ error: "Invalid template key" }, { status: 400 });
  }

  try {
    // 2. Gerar conteúdo do template com os parâmetros fornecidos
    const payload = templateFn(...params);

    // 3. Chamar a rota interna de disparo oficial
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://momo-rust-nu.vercel.app";
    
    const pushRes = await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.N8N_SECRET ?? '' },
      body: JSON.stringify({
        userId,
        title: payload.title,
        body: payload.body,
        url: payload.url
      })
    });

    const pushData = await pushRes.json();

    return NextResponse.json({ 
      ok: true, 
      template,
      pushResponse: pushData
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
