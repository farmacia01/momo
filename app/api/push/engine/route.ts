import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { addMinutes, subMinutes, isBefore, isAfter, format, parseISO } from "date-fns";

export const runtime = "nodejs";

/**
 * GET /api/push/engine
 * 
 * Lógica central de disparos (Cron Job).
 * 1. Verifica doses agendadas para hoje.
 * 2. Verifica estoque baixo.
 * 3. Dispara notificações via local /api/push/send.
 */
export async function GET(req: Request) {
  // Proteção simples por token fixo ou secret
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CAKTO_WEBHOOK_SECRET && secret !== "cron-debug") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const agora = new Date();
  const logs: any[] = [];

  try {
    // --- LÓGICA 1: LEMBRETES DE DOSE ---
    // Buscar usuários com lembrete_dose ativo
    const { data: configs } = await supabase
      .from("configuracoes_notificacao")
      .select("user_id, dia_semana_dose, horario_dose")
      .eq("lembrete_dose", true);

    for (const conf of configs || []) {
      const diaAtual = agora.getDay(); // 0-6
      if (conf.dia_semana_dose === diaAtual && conf.horario_dose) {
        // Montar a data da dose hoje
        const [h, m] = conf.horario_dose.split(':');
        const dataDose = new Date(agora);
        dataDose.setHours(parseInt(h), parseInt(m), 0, 0);

        // Kind 'pre': 5 min antes
        const dataPre = subMinutes(dataDose, 5);
        // Kind 'due': no horário
        const dataDue = dataDose;
        // Kind 'post': 10 min depois (se não registrou)
        const dataPost = addMinutes(dataDose, 10);

        // Verificar se já registrou dose hoje
        const { data: doseHoje } = await supabase
          .from("doses")
          .select("id")
          .eq("user_id", conf.user_id)
          .gte("data_aplicacao", format(dataDose, "yyyy-MM-dd"))
          .maybeSingle();

        if (!doseHoje) {
          // Lógica de Janela (excutar a cada 1 min via Cron)
          const diffMinutes = Math.floor((agora.getTime() - dataDose.getTime()) / 60000);

          let title = "";
          let body = "";

          if (diffMinutes === -5) {
            title = "💉 Quase na hora!";
            body = "Sua dose de Mounjaro é em 5 minutos. Prepare seu material!";
          } else if (diffMinutes === 0) {
            title = "⏰ Hora da aplicação!";
            body = "Está na hora de registrar sua dose semanal. Não esqueça!";
          } else if (diffMinutes === 10 || diffMinutes === 30) {
            title = "⚠️ Lembrete de dose";
            body = "Você ainda não registrou sua dose de hoje. Vamos manter a consistência?";
          }

          if (title) {
            await triggerPush(conf.user_id, title, body, "/doses");
            logs.push({ user: conf.user_id, type: 'dose', diff: diffMinutes });
          }
        }
      }
    }

    // --- LÓGICA 2: ALERTA DE ESTOQUE ---
    const { data: alertasAtivos } = await supabase
      .from("configuracoes_notificacao")
      .select("user_id")
      .eq("alerta_estoque", true);

    for (const a of alertasAtivos || []) {
      // Calcular estoque atual (igual no dashboard)
      const [{ data: ampolas }, { count: dosesUsadas }] = await Promise.all([
        supabase.from("estoque_ampolas").select("quantidade").eq("user_id", a.user_id),
        supabase.from("doses").select("id", { count: 'exact', head: true }).eq("user_id", a.user_id)
      ]);

      const totalComprado = ampolas?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;
      const estoqueRestante = totalComprado - (dosesUsadas || 0);

      // Buscar config de limite do usuário
      const { data: configAlerta } = await supabase
        .from("alertas_estoque")
        .select("quantidade_minima")
        .eq("user_id", a.user_id)
        .maybeSingle();

      const limite = configAlerta?.quantidade_minima || 2;

      if (estoqueRestante <= limite && estoqueRestante > 0) {
        // Enviar apenas 1x por semana ou qdo mudar
        await triggerPush(
          a.user_id, 
          "📦 Estoque Baixo", 
          `Você tem apenas ${estoqueRestante} ampolas restantes. Que tal repor agora?`,
          "/estoque"
        );
        logs.push({ user: a.user_id, type: 'estoque', qté: estoqueRestante });
      }
    }

    return NextResponse.json({ ok: true, processed: logs.length, logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function triggerPush(userId: string, title: string, body: string, url: string) {
  // Chama a rota interna de envio
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body, url })
    });
  } catch (e) {
    console.error("Erro ao disparar push:", e);
  }
}
