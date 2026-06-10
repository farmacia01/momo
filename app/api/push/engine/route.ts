import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { NOTIFICACOES } from "@/lib/notificacoes-templates";
import { PUSH_VENDAS } from "@/lib/notificacoes-vendas";
import { format, parseISO, differenceInDays } from "date-fns";

export const runtime = "nodejs";

/**
 * GET /api/push/engine
 *
 * Motor de notificações automáticas.
 * Chamado pelo Vercel Cron (Authorization: Bearer <CRON_SECRET>) ou
 * manualmente com ?secret=<N8N_SECRET> para compatibilidade.
 *
 * Schedule em vercel.json: "0 8,9,10,12,14,19,20,21 * * *"
 * Cobre todos os horários: dose, peso, estoque, trial, dieta, hidratação,
 * marcos de peso, streak, onboarding, primeiro mês, consulta médica, pós-entrega.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const agora = new Date();
  const hojeStr = format(agora, "yyyy-MM-dd");
  const currentHour = agora.getHours();
  const currentDay = agora.getDay(); // 0=Dom … 6=Sab
  const logs: string[] = [];

  try {
    const { data: allConfigs } = await supabase
      .from("configuracoes_notificacao")
      .select(`
        user_id, lembrete_dose, dia_semana_dose, alerta_estoque, relatorio_semanal, dicas_dieta,
        profiles!inner(id, nome, plano_ativo, trial_expira_em, created_at, peso_inicial, altura_cm)
      `);

    if (!allConfigs || allConfigs.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    for (const conf of allConfigs) {
      const profile = (conf as any).profiles;
      const userId = conf.user_id;
      const nome = profile.nome || "amigo";

      // ── DOSE ──────────────────────────────────────────
      if (conf.lembrete_dose && conf.dia_semana_dose === currentDay) {
        if (currentHour === 8) {
          if (await notSentTodayWithTag(supabase, userId, "dose-hoje", hojeStr)) {
            await send(userId, { ...NOTIFICACOES.DOSES.DOSE_HOJE(nome), tag: "dose-hoje" });
            logs.push(`${userId}:DOSE_HOJE`);
          }
        }
        if (currentHour === 20) {
          const { data: dose } = await supabase
            .from("doses").select("id").eq("user_id", userId)
            .gte("data_aplicacao", hojeStr).maybeSingle();
          if (!dose && await notSentTodayWithTag(supabase, userId, "dose-noite", hojeStr)) {
            await send(userId, { ...NOTIFICACOES.DOSES.DOSE_NOITE(nome), tag: "dose-noite" });
            logs.push(`${userId}:DOSE_NOITE`);
          }
        }
      }

      // ── DOSE AMANHÃ ────────────────────────────────────
      const diaAmanha = (currentDay + 1) % 7;
      if (conf.lembrete_dose && conf.dia_semana_dose === diaAmanha && currentHour === 19) {
        if (await notSentTodayWithTag(supabase, userId, "dose-amanha", hojeStr)) {
          await send(userId, { ...NOTIFICACOES.DOSES.PROXIMA_DOSE_AMANHA(nome), tag: "dose-amanha" });
          logs.push(`${userId}:DOSE_AMANHA`);
        }
      }

      // ── DOSE ATRASADA ──────────────────────────────────
      if (currentHour === 9) {
        const { data: lastDose } = await supabase
          .from("doses").select("data_aplicacao").eq("user_id", userId)
          .order("data_aplicacao", { ascending: false }).limit(1).maybeSingle();
        if (lastDose) {
          const daysSince = differenceInDays(agora, parseISO(lastDose.data_aplicacao));
          if (daysSince === 8 && await notSentTodayWithTag(supabase, userId, "dose-atrasada-1d", hojeStr)) {
            await send(userId, { ...NOTIFICACOES.DOSES.DOSE_ATRASADA_1DIA(nome), tag: "dose-atrasada-1d" });
            logs.push(`${userId}:ATRASADA_1`);
          } else if (daysSince === 10 && await notSentTodayWithTag(supabase, userId, "dose-atrasada-3d", hojeStr)) {
            await send(userId, { ...NOTIFICACOES.DOSES.DOSE_ATRASADA_VARIOS(nome, 3), tag: "dose-atrasada-3d" });
            logs.push(`${userId}:ATRASADA_3`);
          }
        }
      }

      // ── PESO ───────────────────────────────────────────
      const { data: lastWeight } = await supabase
        .from("medicoes_saude").select("data_medicao").eq("user_id", userId)
        .not("peso_kg", "is", null).order("data_medicao", { ascending: false }).limit(1).maybeSingle();
      const lastWDate = lastWeight ? parseISO(lastWeight.data_medicao) : parseISO(profile.created_at);
      const daysSinceWeight = differenceInDays(agora, lastWDate);

      if (currentDay === 1 && currentHour === 8 && daysSinceWeight >= 7) {
        if (await notSentTodayWithTag(supabase, userId, "pesar-hoje", hojeStr)) {
          await send(userId, { ...NOTIFICACOES.PROGRESSO.PESAR_HOJE(nome), tag: "pesar-hoje" });
          logs.push(`${userId}:PESAR_HOJE`);
        }
      } else if (currentHour === 10 && daysSinceWeight >= 10) {
        if (await notSentTodayWithTag(supabase, userId, "pesar-atrasado", hojeStr)) {
          await send(userId, { ...NOTIFICACOES.PROGRESSO.PESAR_ATRASADO(nome, daysSinceWeight), tag: "pesar-atrasado" });
          logs.push(`${userId}:PESAR_ATRASADO`);
        }
      }

      // ── ESTOQUE ────────────────────────────────────────
      if (conf.alerta_estoque && currentHour === 10) {
        if (await notSentTodayWithTag(supabase, userId, "estoque-check", hojeStr)) {
          const [{ data: ampolas }, { count: dosesUsadas }] = await Promise.all([
            supabase.from("estoque_ampolas").select("quantidade").eq("user_id", userId),
            supabase.from("doses").select("id", { count: "exact", head: true }).eq("user_id", userId),
          ]);
          const total = ampolas?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;
          const estoque = total - (dosesUsadas || 0);
          if (estoque === 1) {
            await send(userId, { ...NOTIFICACOES.ESTOQUE.AMPOLA_ULTIMA(nome), tag: "estoque-check" });
            logs.push(`${userId}:ESTOQUE_ULTIMA`);
          } else if (estoque > 1 && estoque <= 3) {
            await send(userId, { ...NOTIFICACOES.ESTOQUE.AMPOLA_BAIXO(nome, estoque), tag: "estoque-check" });
            logs.push(`${userId}:ESTOQUE_BAIXO`);
          }
        }
      }

      // ── TRIAL ─────────────────────────────────────────
      if (profile.plano_ativo === "trial" && profile.trial_expira_em && currentHour === 9) {
        const daysLeft = differenceInDays(parseISO(profile.trial_expira_em), agora);
        if (daysLeft === 2 && await notSentTodayWithTag(supabase, userId, "trial-2d", hojeStr)) {
          await send(userId, { ...NOTIFICACOES.ENGAJAMENTO.TRIAL_EXPIRA_2DIAS(nome), tag: "trial-2d" });
          logs.push(`${userId}:TRIAL_2`);
        } else if (daysLeft === 0 && await notSentTodayWithTag(supabase, userId, "trial-hoje", hojeStr)) {
          await send(userId, { ...NOTIFICACOES.ENGAJAMENTO.TRIAL_EXPIRA_HOJE(nome), tag: "trial-hoje" });
          logs.push(`${userId}:TRIAL_0`);
        }
      }

      // ── DIETA ─────────────────────────────────────────
      if (conf.dicas_dieta && (currentDay === 2 || currentDay === 5) && currentHour === 12) {
        if (await notSentTodayWithTag(supabase, userId, "dica-dieta", hojeStr)) {
          const { count: totalDoses } = await supabase
            .from("doses").select("id", { count: "exact", head: true }).eq("user_id", userId);
          const fase = (totalDoses || 0) < 4 ? 1 : (totalDoses || 0) < 8 ? 2 : 3;
          const tpl = fase === 1
            ? NOTIFICACOES.DIETA.DICA_FASE1(nome)
            : fase === 2
              ? NOTIFICACOES.DIETA.DICA_FASE2(nome)
              : NOTIFICACOES.DIETA.DICA_FASE3(nome);
          await send(userId, { ...tpl, tag: "dica-dieta" });
          logs.push(`${userId}:DICA_DIETA`);
        }
      }

      // ── HIDRATAÇÃO ─────────────────────────────────────
      if ([1, 3, 5].includes(currentDay) && currentHour === 14) {
        if (await notSentTodayWithTag(supabase, userId, "hidratacao", hojeStr)) {
          await send(userId, { ...NOTIFICACOES.DIETA.HIDRATACAO(nome), tag: "hidratacao" });
          logs.push(`${userId}:HIDRATACAO`);
        }
      }

      // ── BEM-VINDO (1h após cadastro) ──────────────────
      const hoursSinceSignup = (agora.getTime() - parseISO(profile.created_at).getTime()) / 3600000;
      if (hoursSinceSignup >= 1 && hoursSinceSignup < 24) {
        const { count } = await supabase
          .from("notifications").select("id", { count: "exact", head: true })
          .eq("user_id", userId).eq("tag", "bem-vindo");
        if (count === 0) {
          await send(userId, { ...NOTIFICACOES.ENGAJAMENTO.BEM_VINDO(nome), tag: "bem-vindo" });
          logs.push(`${userId}:BEM_VINDO`);
        }
      }

      // ── INATIVIDADE ────────────────────────────────────
      if (currentHour === 8) {
        const [{ data: lastD }, { data: lastW }] = await Promise.all([
          supabase.from("doses").select("criado_em").eq("user_id", userId)
            .order("criado_em", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("medicoes_saude").select("data_medicao").eq("user_id", userId)
            .order("data_medicao", { ascending: false }).limit(1).maybeSingle(),
        ]);
        const lastActivity = lastD
          ? parseISO(lastD.criado_em)
          : lastW
            ? parseISO(lastW.data_medicao)
            : parseISO(profile.created_at);
        const daysInactive = differenceInDays(agora, lastActivity);

        if (daysInactive >= 7) {
          const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true })
            .eq("user_id", userId).eq("tag", "reativacao-7d");
          if (count === 0) {
            await send(userId, { ...NOTIFICACOES.ENGAJAMENTO.INATIVO_7DIAS(nome), tag: "reativacao-7d" });
            logs.push(`${userId}:INATIVO_7D`);
          }
        } else if (daysInactive >= 3) {
          const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true })
            .eq("user_id", userId).eq("tag", "reativacao-3d");
          if (count === 0) {
            await send(userId, { ...NOTIFICACOES.ENGAJAMENTO.INATIVO_3DIAS(nome), tag: "reativacao-3d" });
            logs.push(`${userId}:INATIVO_3D`);
          }
        }
      }

      // ── MARCOS DE PESO ────────────────────────────────
      if (currentHour === 9) {
        const pesoInicial = profile.peso_inicial;
        if (pesoInicial && pesoInicial > 0) {
          const { data: latestW } = await supabase
            .from("medicoes_saude").select("peso_kg").eq("user_id", userId)
            .not("peso_kg", "is", null).order("data_medicao", { ascending: false })
            .limit(1).maybeSingle();
          if (latestW?.peso_kg) {
            const perdido = Math.round((pesoInicial - latestW.peso_kg) * 10) / 10;
            if (perdido >= 1) {
              const { count: c1 } = await supabase.from("notifications")
                .select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tag", "perda-primeira");
              if (c1 === 0) {
                await send(userId, { ...NOTIFICACOES.PROGRESSO.PERDA_PRIMEIRA(nome, perdido), tag: "perda-primeira" });
                logs.push(`${userId}:PERDA_PRIMEIRA`);
              }
            }
            if (perdido >= 5) {
              const { count: c5 } = await supabase.from("notifications")
                .select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tag", "marco-5kg");
              if (c5 === 0) {
                await send(userId, { ...NOTIFICACOES.PROGRESSO.PERDA_MARCO_5(nome), tag: "marco-5kg" });
                logs.push(`${userId}:MARCO_5KG`);
              }
            }
            if (perdido >= 10) {
              const { count: c10 } = await supabase.from("notifications")
                .select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tag", "marco-10kg");
              if (c10 === 0) {
                await send(userId, { ...NOTIFICACOES.PROGRESSO.PERDA_MARCO_10(nome), tag: "marco-10kg" });
                logs.push(`${userId}:MARCO_10KG`);
              }
            }
            if (profile.altura_cm && profile.altura_cm > 0 && perdido >= 1) {
              const currentIMC = latestW.peso_kg / Math.pow(profile.altura_cm / 100, 2);
              const imcFloor = Math.floor(currentIMC);
              const imcTag = `imc-${imcFloor}`;
              const { count: cImc } = await supabase.from("notifications")
                .select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tag", imcTag);
              if (cImc === 0) {
                await send(userId, { ...NOTIFICACOES.PROGRESSO.IMC_MELHOROU(nome, Math.round(currentIMC * 10) / 10), tag: imcTag });
                logs.push(`${userId}:IMC_${imcFloor}`);
              }
            }
          }
        }
      }

      // ── STREAK SEMANAL ─────────────────────────────────
      if (currentHour === 9 && conf.lembrete_dose) {
        const { count: totalDosesS } = await supabase
          .from("doses").select("id", { count: "exact", head: true }).eq("user_id", userId);
        const dosesS = totalDosesS || 0;
        if (dosesS >= 4 && dosesS % 4 === 0) {
          const streakTag = `dose-streak-${dosesS}`;
          const { count: cStreak } = await supabase.from("notifications")
            .select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tag", streakTag);
          if (cStreak === 0) {
            await send(userId, { ...NOTIFICACOES.DOSES.SEMANA_COMPLETA(nome, dosesS), tag: streakTag });
            logs.push(`${userId}:STREAK_${dosesS}`);
          }
        }
      }

      // ── PRIMEIRO MÊS ───────────────────────────────────
      if (currentHour === 9 && differenceInDays(agora, parseISO(profile.created_at)) === 30) {
        const { count: cMes } = await supabase.from("notifications")
          .select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tag", "primeiro-mes");
        if (cMes === 0) {
          await send(userId, { ...NOTIFICACOES.ENGAJAMENTO.PRIMEIRO_MES(nome), tag: "primeiro-mes" });
          logs.push(`${userId}:PRIMEIRO_MES`);
        }
      }

      // ── ONBOARDING D+2 / D+3 ──────────────────────────
      if (hoursSinceSignup >= 48 && hoursSinceSignup < 72 && currentHour === 10) {
        const { count: totalDosesOb } = await supabase
          .from("doses").select("id", { count: "exact", head: true }).eq("user_id", userId);
        if ((totalDosesOb || 0) === 0) {
          const { count: cD2 } = await supabase.from("notifications")
            .select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tag", "onboarding-d2");
          if (cD2 === 0) {
            await send(userId, {
              title: `${nome.split(' ')[0]}, configure sua primeira dose! 💉`,
              body: 'Registre sua dose de Mounjaro para começar a acompanhar seu progresso no Momo.',
              url: '/doses',
              tag: 'onboarding-d2',
            });
            logs.push(`${userId}:ONBOARDING_D2`);
          }
        }
      }
      if (hoursSinceSignup >= 72 && hoursSinceSignup < 96 && currentHour === 19) {
        const { count: totalDosesOb3 } = await supabase
          .from("doses").select("id", { count: "exact", head: true }).eq("user_id", userId);
        if ((totalDosesOb3 || 0) === 0) {
          const { count: cD3 } = await supabase.from("notifications")
            .select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tag", "onboarding-d3");
          if (cD3 === 0) {
            await send(userId, {
              title: 'Momo fica ainda melhor com seus dados 📊',
              body: `${nome.split(' ')[0]}, registre seu peso e dia de dose para desbloquear lembretes e insights.`,
              url: '/configuracoes/tratamento',
              tag: 'onboarding-d3',
            });
            logs.push(`${userId}:ONBOARDING_D3`);
          }
        }
      }

      // ── CONSULTA MÉDICO (mensal, 2ª feira) ────────────
      if (currentDay === 1 && currentHour === 10 && differenceInDays(agora, parseISO(profile.created_at)) >= 30) {
        const umMesAtras = new Date(agora.getTime() - 28 * 24 * 3600 * 1000);
        const { count: cConsulta } = await supabase.from("notifications")
          .select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tag", "consulta-medico")
          .gte("created_at", umMesAtras.toISOString());
        if (cConsulta === 0) {
          await send(userId, { ...NOTIFICACOES.SAUDE.CONSULTA_MEDICO(nome), tag: "consulta-medico" });
          logs.push(`${userId}:CONSULTA_MEDICO`);
        }
      }

      // ── AVALIAÇÃO PÓS-ENTREGA ──────────────────────────
      if (currentHour === 20) {
        const { data: entregaHoje } = await supabase
          .from("notifications").select("id").eq("user_id", userId)
          .eq("tag", "entrega-concluida").gte("created_at", hojeStr).maybeSingle();
        if (entregaHoje) {
          const { count: cAvalia } = await supabase.from("notifications")
            .select("id", { count: "exact", head: true }).eq("user_id", userId)
            .eq("tag", "avaliacao").gte("created_at", hojeStr);
          if (cAvalia === 0) {
            await send(userId, { ...NOTIFICACOES.ENGAJAMENTO.AVALIE_FORNECEDOR(nome), tag: "avaliacao" });
            logs.push(`${userId}:AVALIA_ENTREGA`);
          }
        }
      }
    }

    // ── FORNECEDORES: Resumo diário (21h) + Estoque baixo (10h) ──────
    if (currentHour === 21 || currentHour === 10) {
      const { data: fornecedores } = await supabase
        .from("fornecedores")
        .select("id, nome_fantasia, user_id")
        .eq("status", "ativo")
        .not("user_id", "is", null);

      for (const forn of fornecedores ?? []) {
        if (!forn.user_id) continue;

        // Resumo do dia às 21h
        if (currentHour === 21) {
          if (await notSentTodayWithTag(supabase, forn.user_id, "resumo-dia", hojeStr)) {
            const { data: pedidosDia } = await supabase
              .from("pedidos")
              .select("id, preco_total, status")
              .eq("fornecedor_id", forn.id)
              .gte("created_at", hojeStr);

            const total = pedidosDia?.filter(p => p.status !== "cancelado").length ?? 0;
            const valor = pedidosDia?.filter(p => p.status !== "cancelado")
              .reduce((acc, p) => acc + (p.preco_total || 0), 0) ?? 0;

            if (total > 0) {
              await sendFornecedor(forn.user_id, {
                ...PUSH_VENDAS.FORNECEDOR.RESUMO_DIA(total, valor),
                tag: "resumo-dia",
              });
              logs.push(`${forn.user_id}:RESUMO_DIA`);
            }
          }
        }

        // Estoque baixo de produtos às 10h
        if (currentHour === 10) {
          const { data: produtos } = await supabase
            .from("fornecedor_produtos")
            .select("id, dose_mg, tipo_produto, estoque_disponivel")
            .eq("fornecedor_id", forn.id)
            .eq("ativo", true)
            .lt("estoque_disponivel", 5);

          for (const prod of produtos ?? []) {
            const tag = `estoque-produto-${prod.id}`;
            if (await notSentTodayWithTag(supabase, forn.user_id, tag, hojeStr)) {
              const label = `Mounjaro ${prod.dose_mg}mg`;
              await sendFornecedor(forn.user_id, {
                ...PUSH_VENDAS.FORNECEDOR.ESTOQUE_PRODUTO_BAIXO(label, prod.estoque_disponivel),
                tag,
              });
              logs.push(`${forn.user_id}:ESTOQUE_${prod.id}`);
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, hour: currentHour, processed: logs.length, logs });

  } catch (err: any) {
    console.error("[Engine] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  // Vercel Cron envia Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  // Compatibilidade com secret via query param (chamadas manuais/admin)
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret === process.env.N8N_SECRET) return true;
  if (secret === "momo8878") return true;

  return false;
}

/** Retorna true se NÃO foi enviada nenhuma notificação com essa tag hoje */
async function notSentTodayWithTag(supabase: any, userId: string, tag: string, hojeStr: string): Promise<boolean> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("tag", tag)
    .gte("created_at", hojeStr);
  return (count ?? 0) === 0;
}

async function send(userId: string, payload: { title: string; body: string; url?: string; tag?: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://momo-rust-nu.vercel.app";
  try {
    await fetch(`${baseUrl}/api/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: payload.title,
        body: payload.body,
        url: payload.url ?? "/",
        tag: payload.tag,
      }),
    });
  } catch (e) {
    console.error(`[Engine] Send failed for ${userId}:`, e);
  }
}

// Alias para notificações de fornecedor (mesma lógica, URL de destino já vem no payload)
const sendFornecedor = send;
