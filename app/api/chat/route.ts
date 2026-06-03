import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
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
4. Mantenha as respostas concisas e formatadas em Markdown para fácil leitura.
5. Nunca sugira mudanças na dose da medicação; diga ao usuário para consultar o médico assistente.`,
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
