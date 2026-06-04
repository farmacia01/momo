import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * POST /api/n8n/trial-expirando
 *
 * Returns the users whose free trial expires within the next 2 days, along
 * with a short progress summary, so an n8n workflow can email them a reminder
 * with a Cakto checkout link.
 *
 * Protected by a shared secret: send header `x-n8n-secret: <N8N_SECRET>`.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const customSecret = req.headers.get("x-n8n-secret");
  
  const secret = process.env.N8N_SECRET;
  
  if (!secret || (bearerSecret !== secret && customSecret !== secret)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Service role não configurado." },
      { status: 500 },
    );
  }

  const supabase = createServiceClient();
  const agora = new Date();
  const limite = new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000);

  const { data: usuarios, error } = await supabase
    .from("profiles")
    .select("id, nome, email, trial_expira_em")
    .eq("plano_ativo", "trial")
    .gte("trial_expira_em", agora.toISOString())
    .lte("trial_expira_em", limite.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Monta um resumo de progresso por usuário (doses registradas + peso perdido).
  const lista = await Promise.all(
    (usuarios ?? []).map(async (u) => {
      const [{ count: dosesCount }, { data: medicoes }] = await Promise.all([
        supabase
          .from("doses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", u.id),
        supabase
          .from("medicoes_saude")
          .select("peso_kg, data_medicao")
          .eq("user_id", u.id)
          .not("peso_kg", "is", null)
          .order("data_medicao", { ascending: true }),
      ]);

      let pesoPerdido = 0;
      if (medicoes && medicoes.length >= 2) {
        const primeiro = medicoes[0].peso_kg;
        const ultimo = medicoes[medicoes.length - 1].peso_kg;
        pesoPerdido = Math.max(0, +(primeiro - ultimo).toFixed(1));
      }

      const diasRestantes = Math.ceil(
        (new Date(u.trial_expira_em).getTime() - agora.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        email: u.email,
        nome: u.nome,
        dias_restantes: diasRestantes,
        doses_registradas: dosesCount ?? 0,
        peso_perdido_kg: pesoPerdido,
        checkout: "https://pay.cakto.com.br/i75hqvn_913965",
      };
    }),
  );

  return NextResponse.json({ total: lista.length, usuarios: lista });
}
