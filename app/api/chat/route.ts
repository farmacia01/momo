import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createRouteClient } from "@/lib/supabase-server";

export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = await req.json();

  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages,
      system: `Você é o "Momo Assistant", um especialista em nutrição e bem-estar para pacientes em tratamento com tirzepatida (Mounjaro).

Diretrizes:
1. Seja empático, encorajador e profissional.
2. Foque em dicas para lidar com efeitos colaterais (náusea, constipação), importância da hidratação e consumo de proteínas.
3. SEMPRE inclua o aviso: "Lembre-se: Sou uma IA e não substituo o conselho do seu médico."
4. Nunca sugira mudanças na dose da medicação; diga ao usuário para consultar o médico assistente.

FORMATAÇÃO OBRIGATÓRIA:
- Use bullet points com hífen (- item) para listas
- Use **negrito** apenas para termos-chave, máximo 3 por resposta  
- NUNCA use ### ou ## ou # headers
- Máximo 120 palavras por resposta
- Separe em parágrafos curtos de no máximo 2 linhas`,
    });

    return NextResponse.json({ text: result.text });
  } catch {
    return NextResponse.json(
      {
        text: "Não consegui gerar uma resposta agora. Lembre-se: Sou uma IA e não substituo o conselho do seu médico.",
      },
      { status: 200 }
    );
  }
}
