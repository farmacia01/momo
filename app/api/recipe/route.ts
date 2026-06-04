import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { PLANOS, type FaseMounjaro } from '@/lib/diet-plans';

export const maxDuration = 60; // DALL-E 3 and GPT can take time

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { mealType, phase }: { mealType: string, phase: FaseMounjaro } = await req.json();

    const plano = PLANOS[phase];
    if (!plano) throw new Error("Plano não encontrado");

    // 1. Generate recipe text using GPT-4o
    const prompt = `Você é um nutricionista especializado em pacientes que utilizam Mounjaro (tirzepatida).
    Gere uma receita detalhada para ${mealType} adequada para a Fase ${phase} do tratamento (${plano.nome}).
    
    Contexto da Fase ${phase}:
    - Foco: ${plano.foco}
    - Resumo: ${plano.resumo}
    - Alimentos recomendados: ${plano.alimentosRecomendados.join(", ")}
    - Alimentos a evitar: ${plano.alimentosEvitar.join(", ")}
    
    Diretrizes nutricionais:
    - Alta proteína para preservar massa magra.
    - Baixa gordura e fácil digestão (especialmente se for Fase 1 ou 2) para evitar náuseas.
    - Porções moderadas.
    
    Retorne APENAS um JSON no seguinte formato:
    {
      "nome": "Título Criativo da Receita",
      "descricao": "Breve descrição focada nos benefícios para quem usa Mounjaro nesta fase",
      "calorias": 350,
      "macros": { "proteina": 30, "carbo": 20, "gordura": 10 },
      "tempoPreparo": "20 min",
      "ingredientes": ["item com quantidade 1", "item com quantidade 2"],
      "preparo": ["passo 1 bem explicado", "passo 2 bem explicado"],
      "imagePrompt": "A professional food photography of [dish name], [key ingredients visible], high resolution, clean plate, soft natural light, appetizing, top-down or 45-degree angle, white background."
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o for better nutritional accuracy
      messages: [{ role: "system", content: "Você é um nutricionista expert em GLP-1." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const recipeData = JSON.parse(completion.choices[0].message.content || '{}');

    // 2. Generate image using DALL-E 3
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: recipeData.imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = imageResponse.data?.[0]?.url ?? null;

    return NextResponse.json({
      ...recipeData,
      imageUrl
    });

  } catch (error: any) {
    console.error("Recipe Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
