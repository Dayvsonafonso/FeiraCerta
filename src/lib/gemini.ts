import { supabase } from "./supabase";

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

/**
 * Chama a Edge Function no backend para gerar insights com IA.
 * A chave da API Gemini fica protegida no servidor — nunca exposta ao browser.
 */
export async function getSavingInsights(products: Product[]): Promise<AiInsight | null> {
  if (products.length === 0) return null;

  try {
    const { data, error } = await supabase.functions.invoke("ai-insights", {
      body: { products },
    });

    if (error) {
      console.error("Edge Function Error:", error);
      return null;
    }

    return data as AiInsight;
  } catch (error) {
    console.error("AI Insights Error:", error);
    return null;
  }
}
