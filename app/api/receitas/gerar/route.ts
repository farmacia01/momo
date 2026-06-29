import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { createHash } from "crypto";
import { createRouteClient } from "@/lib/supabase-server";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { fase, dose_mg, restricoes = [], forcar = false } = await req.json();

  // Always return cached recipes unless the user explicitly forces a refresh
  if (!forcar) {
    const { data: cached } = await supabase
      .from("receitas_geradas")
      .select("receitas, gerado_em")
      .eq("user_id", user.id)
      .eq("fase", fase)
      .maybeSingle();

    if (cached?.receitas) {
      return NextResponse.json({ receitas: cached.receitas });
    }
    // No cache yet and not forced — return empty immediately, don't call OpenAI
    return NextResponse.json({ receitas: [] });
  }

  // --- Verificação de Limite Diário ---
  const { data: profile } = await supabase
    .from("profiles")
    .select("receitas_geradas_hoje, ultima_receita_data")
    .eq("id", user.id)
    .single();

  const hojeStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  let geradasHoje = profile?.receitas_geradas_hoje || 0;
  
  if (profile?.ultima_receita_data !== hojeStr) {
    geradasHoje = 0; // Resetou o dia
  }

  if (geradasHoje >= 3) {
    return NextResponse.json(
      { error: "Limite diário atingido. Você pode gerar ou atualizar receitas até 3 vezes por dia." },
      { status: 429 }
    );
  }
  // ------------------------------------

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const faseMap: Record<number, string> = {
    1: "Fase 1 — Adaptação (2.5–5 mg): porções pequenas, digestão fácil, evitar náusea e saciedade precoce, meta 1600–1800 kcal/dia. Priorizar alimentos macios, cozidos, sem fritura pesada.",
    2: "Fase 2 — Aceleração (7.5–10 mg): alta proteína (≥120 g/dia), déficit calórico moderado, meta 1400–1600 kcal/dia. Evitar carboidratos simples, priorizar proteínas magras.",
    3: "Fase 3 — Otimização (12.5–15 mg): máximo resultado, preservar massa muscular, meta 1200–1400 kcal/dia. Refeições densas em proteína, baixíssimo carboidrato, gorduras boas.",
  };
  const faseTexto = faseMap[fase] ?? faseMap[1];
  const restricoesTexto = restricoes.length > 0 ? restricoes.join(", ") : "nenhuma";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você é nutricionista brasileiro especializado em pacientes usando Mounjaro (tirzepatida).
Crie receitas 100% brasileiras usando ingredientes facilmente encontrados em qualquer supermercado do Brasil.
Use linguagem brasileira natural. Retorne apenas JSON válido sem comentários.`,
        },
        {
          role: "user",
          content: `Gere 8 receitas brasileiras para paciente em: ${faseTexto}
Dose atual: ${dose_mg ?? "—"} mg
Restrições alimentares: ${restricoesTexto}

REGRAS OBRIGATÓRIAS:
- Use exclusivamente ingredientes comuns no Brasil: frango, carne bovina, tilápia, atum, ovos, queijo minas, ricota, iogurte natural, feijão, lentilha, grão-de-bico, arroz integral, batata-doce, mandioca, couve, brócolis, abobrinha, tomate, cebola, alho, tapioca, aveia, whey protein, leite desnatado
- Inspire-se em pratos brasileiros reais: frango xadrez light, caldo verde com frango, omelete de forno, filé de tilápia ao molho de limão, carne moída com legumes, feijão tropeiro light, vitamina proteica, panqueca de aveia, moqueca leve, arroz de forno, frango ensopado, sopa de legumes com frango
- NÃO use: quinoa, kale, tahini, hummus, edamame, tofu, miso, alimentos importados difíceis de achar
- Cada receita deve ter nome em português informal brasileiro (ex: "Frango Grelhado com Couve Refogada", não "Chicken Salad")
- dica_mounjaro: dica prática específica para quem usa o remédio (ex: "Coma devagar — o Mounjaro já reduz sua fome, não force mais do que conseguir")
- Distribua os tipos: 2 cafés da manhã, 3 almoços/jantares, 3 lanches
- Varie as proteínas entre frango, peixe, carne, ovos e laticínios

Retorne JSON com este formato exato:
{
  "receitas": [
    {
      "id": "rec_001",
      "nome": "Nome da receita",
      "tipo": "cafe",
      "emoji": "🍳",
      "tempo_preparo": 15,
      "calorias": 350,
      "proteinas": 28,
      "carboidratos": 20,
      "gorduras": 10,
      "dificuldade": "facil",
      "dica_mounjaro": "Dica curta específica para quem usa Mounjaro",
      "ingredientes": ["200g frango desfiado", "2 ovos", "sal a gosto"],
      "modo_preparo": ["Aqueça a frigideira.", "Adicione os ingredientes.", "Cozinhe por 10 min."]
    }
  ]
}

Tipos: cafe, almoco, jantar, lanche
Emojis por tipo: cafe=☕🍳🥞, almoco=🍗🥘🍲, jantar=🐟🥩🍜, lanche=🧀🥜🍌`,
        },
      ],
    });

    const content = response.choices[0].message.content ?? "{}";
    const data = JSON.parse(content);

    const receitasComId = (data.receitas ?? []).map((r: any) => ({
      ...r,
      id: createHash('sha1')
        .update(`${user.id}-${r.nome}-${r.calorias}`)
        .digest('hex')
        .slice(0, 16),
    }));

    await supabase.from("receitas_geradas").upsert(
      { user_id: user.id, fase, receitas: receitasComId, gerado_em: new Date().toISOString() },
      { onConflict: "user_id,fase" }
    );

    // Atualiza o contador diário do usuário
    await supabase.from("profiles").update({
      receitas_geradas_hoje: geradasHoje + 1,
      ultima_receita_data: hojeStr,
    }).eq("id", user.id);

    return NextResponse.json({ ...data, receitas: receitasComId });
  } catch (error: any) {
    console.error("[Receitas] Error:", error?.message ?? error);
    return NextResponse.json({ error: "Erro ao gerar receitas" }, { status: 500 });
  }
}

