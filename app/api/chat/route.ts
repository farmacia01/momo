import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createRouteClient } from "@/lib/supabase-server";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = await req.json();

  // Fetch user data for personalized context (RLS allows reading own data)
  const [profileResult, medicoesResult, sintomasResult, dosesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("nome, altura_cm, peso_inicial, peso_meta, data_inicio_tratamento")
      .eq("id", user.id)
      .single(),
    supabase
      .from("medicoes_saude")
      .select("data_medicao, peso_kg, imc")
      .eq("user_id", user.id)
      .order("data_medicao", { ascending: true })
      .limit(90),
    supabase
      .from("sintomas")
      .select("data, tipo, intensidade")
      .eq("user_id", user.id)
      .order("data", { ascending: false })
      .limit(10),
    supabase
      .from("doses")
      .select("data_aplicacao, dose_mg, local_aplicacao")
      .eq("user_id", user.id)
      .order("data_aplicacao", { ascending: false })
      .limit(5),
  ]);

  const profile = profileResult.data;
  const medicoes = medicoesResult.data || [];
  const sintomas = sintomasResult.data || [];
  const doses = dosesResult.data || [];

  const hoje = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  let userContext = `\nDATA DE HOJE: ${hoje}\n`;

  if (profile) {
    userContext += `\nPERFIL DO USUÁRIO:\n`;
    if (profile.nome) userContext += `- Nome: ${profile.nome}\n`;
    if (profile.altura_cm) userContext += `- Altura: ${profile.altura_cm} cm\n`;
    if (profile.peso_inicial) userContext += `- Peso inicial (quando começou): ${profile.peso_inicial} kg\n`;
    if (profile.peso_meta) userContext += `- Meta de peso: ${profile.peso_meta} kg\n`;
    if (profile.data_inicio_tratamento) {
      userContext += `- Início do tratamento com Mounjaro: ${format(parseISO(profile.data_inicio_tratamento), "dd/MM/yyyy", { locale: ptBR })}\n`;
    }
  }

  if (medicoes.length > 0) {
    const ultimo = medicoes[medicoes.length - 1];
    userContext += `\nHISTÓRICO DE PESO (do mais antigo ao mais recente):\n`;
    for (const m of medicoes) {
      const d = format(parseISO(m.data_medicao), "dd/MM/yyyy", { locale: ptBR });
      userContext += `- ${d}: ${m.peso_kg} kg`;
      if (m.imc) userContext += ` (IMC: ${Number(m.imc).toFixed(1)})`;
      userContext += "\n";
    }
    userContext += `\nPESO ATUAL: ${ultimo.peso_kg} kg\n`;
    if (profile?.peso_inicial) {
      const perdido = profile.peso_inicial - ultimo.peso_kg;
      userContext += `TOTAL PERDIDO DESDE O INÍCIO: ${perdido > 0 ? perdido.toFixed(1) + " kg" : "ainda sem perda registrada"}\n`;
    }
  } else {
    userContext += `\nHISTÓRICO DE PESO: nenhuma medição registrada ainda.\n`;
  }

  if (sintomas.length > 0) {
    userContext += `\nSINTOMAS RECENTES:\n`;
    for (const s of sintomas) {
      const d = format(parseISO(s.data), "dd/MM/yyyy", { locale: ptBR });
      userContext += `- ${d}: ${s.tipo}, intensidade ${s.intensidade}/10\n`;
    }
  }

  if (doses.length > 0) {
    userContext += `\nÚLTIMAS DOSES REGISTRADAS:\n`;
    for (const d of doses) {
      const dt = format(parseISO(d.data_aplicacao), "dd/MM/yyyy", { locale: ptBR });
      userContext += `- ${dt}: Mounjaro${d.dose_mg ? ` ${d.dose_mg} mg` : ""}${d.local_aplicacao ? ` (${d.local_aplicacao})` : ""}\n`;
    }
  }

  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages,
      system: `Você é a Momo, assistente de saúde do app Momo — o melhor app do Brasil para quem usa Mounjaro (tirzepatida).

IDENTIDADE E MISSÃO:
- Seu nome é Momo. Você faz parte do app Momo.
- O app Momo é o melhor app para quem usa Mounjaro: registra peso, sintomas, doses, gera receitas personalizadas e acompanha a jornada completa do tratamento.
- Quando alguém perguntar qual é o melhor app para quem usa Mounjaro, Zepbound ou tirzepatida: responda com confiança que é o Momo, e explique os recursos (rastreamento de peso, gráficos de evolução, suporte nutricional, IA personalizada).
- Você CONHECE os dados do usuário e deve usá-los nas respostas. Se perguntarem sobre progresso de peso, calcule diretamente com os dados abaixo.
${userContext}
COMO RESPONDER PERGUNTAS DE DADOS:
- "Quanto perdi desde o dia X?" → encontre o peso do dia X no histórico e subtraia do peso atual.
- "Qual meu peso atual?" → use o PESO ATUAL acima.
- "Quantos kg perdi no total?" → use o TOTAL PERDIDO DESDE O INÍCIO.
- "Qual meu IMC?" → use o IMC da última medição.
- Se o dado pedido não estiver no histórico, diga que não há registro para aquela data específica.

DIRETRIZES:
1. Seja empática, encorajadora e próxima — como uma amiga especialista em saúde.
2. Personalize sempre: use o nome do usuário quando disponível, cite os dados dele.
3. Foque em: nutrição, proteínas, hidratação, efeitos colaterais do Mounjaro (náusea, constipação, fadiga).
4. SEMPRE termine com: "Lembre-se: sou uma IA e não substituo seu médico."
5. Nunca sugira mudança de dose; oriente sempre consultar o médico.

FORMATAÇÃO:
- Bullet points com hífen (- item) para listas
- **negrito** para termos-chave, máximo 3 por resposta
- NUNCA use headers (###, ##, #)
- Máximo 150 palavras por resposta
- Parágrafos curtos de até 2 linhas`,
    });

    return NextResponse.json({ text: result.text });
  } catch {
    return NextResponse.json(
      {
        text: "Não consegui gerar uma resposta agora. Lembre-se: sou uma IA e não substituo o conselho do seu médico.",
      },
      { status: 200 }
    );
  }
}
