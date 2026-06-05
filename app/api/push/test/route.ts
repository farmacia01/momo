import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/push/test
 * Body: { userId }
 *
 * Dispara uma notificação de teste para confirmar que o sistema está funcionando.
 */
export async function POST(req: Request) {
  const { userId } = await req.json().catch(() => ({}));
  if (!userId) {
    return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/push/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      title: "🌿 Momo funcionando!",
      body: "Suas notificações estão ativas e funcionando.",
      url: "/",
      tag: "test",
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
