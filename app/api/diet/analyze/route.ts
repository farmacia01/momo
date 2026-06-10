import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const { text, image } = await req.json();

    if (!text && !image) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const messages: any[] = [
      {
        role: "system",
        content: `Você é um nutricionista digital especializado em estimar macros.
Analise a refeição descrita (texto ou imagem) e retorne um JSON com:
{
  "nome": "nome da refeição",
  "calorias": 0,
  "proteinas": 0,
  "carboidratos": 0,
  "gorduras": 0,
  "confianca": "alta/media/baixa"
}
Sempre retorne apenas o JSON puro.`
      }
    ];

    if (image) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Analise esta imagem de refeição:" },
          { type: "image_url", image_url: { url: image } }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: text
      });
    }

    const response = await openai.chat.completions.create({
      model: image ? "gpt-4o" : "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Meal Analysis Error:", error);
    return NextResponse.json({ error: "Falha ao analisar refeição" }, { status: 500 });
  }
}
