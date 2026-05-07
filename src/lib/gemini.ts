import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Product {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  previousPrice: number;
  quantity: number;
  description?: string;
  createdAt: string;
}

export interface AiInsight {
  topIncreases: { name: string; percent: number; suggestion: string }[];
  generalTip: string;
  alerts: string[];
}

export async function getSavingInsights(products: Product[]): Promise<AiInsight | null> {
  if (products.length === 0) return null;

  const prompt = `
    Como um assistente especialista em economia doméstica e feira, analise a seguinte lista de produtos:
    ${JSON.stringify(products.map(p => ({
      name: p.name,
      current: p.currentPrice,
      prev: p.previousPrice,
      desc: p.description
    })))}

    Por favor:
    1. Identifique os 3 produtos com maior alta percentual.
    2. Para esses itens, sugira substituições mais baratas (ex: trocar marca, trocar por fruta da estação, etc).
    3. Dê uma dica geral de como economizar pelo menos 10% no total desta compra.
    4. Destaque alertas de preço abusivo se houver.

    Responda em JSON no seguinte formato:
    {
      "topIncreases": [{"name": string, "percent": number, "suggestion": string}],
      "generalTip": string,
      "alerts": string[]
    }
    Responda APENAS o JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}
