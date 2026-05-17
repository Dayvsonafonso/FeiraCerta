import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { Product } from "../lib/gemini";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(200, "Nome muito longo"),
  category: z.string().min(1, "Categoria obrigatória"),
  current_price: z.number().min(0, "Preço não pode ser negativo").max(999999, "Preço inválido"),
  previous_price: z.number().min(0, "Preço não pode ser negativo").max(999999, "Preço inválido"),
  quantity: z.number().min(0.01, "Quantidade mínima: 0.01").max(9999, "Quantidade inválida"),
  description: z.string().max(500, "Descrição muito longa").optional().default(""),
});

export function useProducts(userId: string | undefined) {
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined" && userId) {
      const cached = localStorage.getItem(`products_cache_${userId}`);
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = async () => {
    if (!userId) return;
    if (products.length === 0) setIsLoading(true);
    
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      const mapped = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        currentPrice: Number(p.current_price),
        previousPrice: Number(p.previous_price),
        quantity: Number(p.quantity || 1),
        description: p.description,
        createdAt: p.created_at
      }));
      
      setProducts(mapped);
      localStorage.setItem(`products_cache_${userId}`, JSON.stringify(mapped));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (userId) {
      const cached = localStorage.getItem(`products_cache_${userId}`);
      if (cached) setProducts(JSON.parse(cached));
      else setProducts([]);
      
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [userId]);

  const addProduct = async (payload: any) => {
    if (!userId) return { error: new Error("User not authenticated") };
    
    const validation = productSchema.safeParse(payload);
    if (!validation.success) {
      return { error: new Error(validation.error.errors[0]?.message || "Dados inválidos") };
    }
    
    const { data, error } = await supabase.from("products").insert([{ ...validation.data, user_id: userId }]).select();
    if (!error) await fetchProducts();
    return { data, error };
  };

  const updateProduct = async (id: string, payload: any) => {
    if (!userId) return { error: new Error("User not authenticated") };
    
    const validation = productSchema.partial().safeParse(payload);
    if (!validation.success) {
      return { error: new Error(validation.error.errors[0]?.message || "Dados inválidos") };
    }
    
    const { data, error } = await supabase.from("products").update(validation.data).eq("id", id).eq("user_id", userId).select();
    if (!error) await fetchProducts();
    return { data, error };
  };

  const removeProduct = async (id: string) => {
    if (!userId) return { error: new Error("User not authenticated") };
    const { error } = await supabase.from("products").delete().eq("id", id).eq("user_id", userId);
    if (!error) setProducts(products.filter(p => p.id !== id));
    return { error };
  };

  const currentMonthProducts = useMemo(() => {
    const now = new Date();
    return products.filter(p => {
      const d = new Date(p.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [products]);

  const prevMonthProducts = useMemo(() => {
    const now = new Date();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return products.filter(p => {
      const d = new Date(p.createdAt);
      return d.getMonth() === prevMonthDate.getMonth() && d.getFullYear() === prevMonthDate.getFullYear();
    });
  }, [products]);

  const totals = useMemo(() => {
    const currentTotal = currentMonthProducts.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
    const prevTotal = prevMonthProducts.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
    const diff = currentTotal - prevTotal;
    
    let percent = 0;
    if (prevTotal > 0) {
      percent = (diff / prevTotal) * 100;
    } else if (currentTotal > 0) {
      percent = 100;
    }

    return { current: currentTotal, prev: prevTotal, diff, percent };
  }, [currentMonthProducts, prevMonthProducts]);

  const importLastMonthItems = async () => {
    if (!userId || prevMonthProducts.length === 0) return;
    setIsLoading(true);
    
    try {
      const newItems = prevMonthProducts.map(p => ({
        name: p.name,
        category: p.category,
        current_price: p.currentPrice, // Initialize with same price
        previous_price: p.currentPrice, // Set the old price as baseline
        quantity: p.quantity,
        description: p.description,
        user_id: userId
      }));

      const { error } = await supabase.from("products").insert(newItems);
      if (error) throw error;
      
      await fetchProducts();
    } catch (error) {
      console.error("Error importing items:", error);
      alert("Erro ao importar itens!");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    products,
    currentMonthProducts,
    prevMonthProducts,
    isLoading,
    totals,
    fetchProducts,
    addProduct,
    updateProduct,
    removeProduct,
    importLastMonthItems
  };
}
