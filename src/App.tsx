import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  ShoppingBag,
  History,
  LayoutDashboard,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell 
} from "recharts";
import { Product, getSavingInsights, AiInsight } from "./lib/gemini";
import { cn, formatCurrency, calculateVariation } from "./lib/utils";

import { supabase } from "./lib/supabase";

const CATEGORIES = [
  "Frutas", "Legumes", "Verduras", "Açougue", "Padaria", "Laticínios", "Limpeza", "Outros"
];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "Frutas",
    currentPrice: "",
    previousPrice: "",
    description: ""
  });

  const [aiInsights, setAiInsights] = useState<AiInsight | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "alerts">("dashboard");

  // Fetch products from Supabase on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const formatInputCurrency = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    
    // Convert to number and format
    const number = parseInt(digits) / 100;
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrencyToNumber = (value: string) => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, "").replace(",", "."));
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      // Map database snake_case to frontend camelCase
      const mappedProducts: Product[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        currentPrice: Number(p.current_price),
        previousPrice: Number(p.previous_price),
        description: p.description
      }));
      setProducts(mappedProducts);
    }
    setIsLoadingProducts(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.currentPrice) return;

    const currentPrice = parseCurrencyToNumber(formData.currentPrice);
    const previousPrice = formData.previousPrice ? parseCurrencyToNumber(formData.previousPrice) : currentPrice;

    const newProduct = {
      name: formData.name,
      category: formData.category,
      current_price: currentPrice,
      previous_price: previousPrice,
      description: formData.description
    };

    const { data, error } = await supabase
      .from("products")
      .insert([newProduct])
      .select();

    if (error) {
      console.error("Error adding product:", error);
      alert(`Erro ao adicionar produto: ${error.message}`);
    } else if (data) {
      const addedProduct: Product = {
        id: data[0].id,
        name: data[0].name,
        category: data[0].category,
        currentPrice: Number(data[0].current_price),
        previousPrice: Number(data[0].previous_price),
        description: data[0].description
      };
      setProducts([addedProduct, ...products]);
      setFormData({ name: "", category: "Frutas", currentPrice: "", previousPrice: "", description: "" });
      setShowForm(false);
    }
  };

  const removeProduct = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error removing product:", error);
      alert("Erro ao remover produto.");
    } else {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const analyzeWithAi = async () => {
    if (products.length === 0) return;
    setIsLoadingAi(true);
    try {
      const insights = await getSavingInsights(products);
      setAiInsights(insights);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const totals = useMemo(() => {
    const current = products.reduce((sum, p) => sum + p.currentPrice, 0);
    const prev = products.reduce((sum, p) => sum + p.previousPrice, 0);
    const { diff, percent } = calculateVariation(current, prev);
    return { current, prev, diff, percent };
  }, [products]);

  const filteredProducts = products.filter(p => 
    filterCategory === "Todas" ? true : p.category === filterCategory
  );

  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [filteredProducts]);

  const chartData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const current = products
        .filter(p => p.category === cat)
        .reduce((sum, p) => sum + p.currentPrice, 0);
      return { name: cat, total: current };
    }).filter(d => d.total > 0);
  }, [products]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      {/* Sidebar - Visual Mock for Desktop */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-gray-200 bg-white lg:block shadow-lg" style={{ zIndex: 9999 }}>
        <div className="flex h-20 items-center border-b border-gray-200 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB] text-white">
              <ShoppingBag size={24} />
            </div>
            <span className="text-xl font-bold text-[#111827]">FeiraCerta</span>
          </div>
        </div>
        <nav className="mt-8 space-y-2 px-4">
          <button 
            onClick={() => { console.log("Tab: dashboard"); setActiveTab("dashboard"); }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all cursor-pointer ${
              activeTab === "dashboard" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => { console.log("Tab: history"); setActiveTab("history"); }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all cursor-pointer ${
              activeTab === "history" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <History size={20} />
            Histórico
          </button>
          <button 
            onClick={() => { console.log("Tab: alerts"); setActiveTab("alerts"); }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all cursor-pointer ${
              activeTab === "alerts" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <AlertTriangle size={20} />
            Alertas
          </button>
        </nav>
      </aside>

      <main className="lg:ml-64 p-6 lg:p-8 pb-24 lg:pb-8">
        {activeTab === "dashboard" && (
          <section>
            {/* Header */}
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#111827]">Controle de Gastos de Feira</h1>
                <p className="text-gray-500">Acompanhe a variação de preços e economize de forma inteligente.</p>
              </div>
              <button 
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-[#1D4ED8] active:scale-95"
              >
                <Plus size={20} />
                Adicionar Item
              </button>
            </header>

        {/* Stats Summary */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Total Atual</span>
              <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                <ShoppingBag size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totals.current)}</p>
          </div>
          
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Mês Anterior</span>
              <div className="rounded-full bg-gray-50 p-2 text-gray-600">
                <History size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-600">{formatCurrency(totals.prev)}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Variação Real</span>
              <div className={cn(
                "rounded-full p-2",
                totals.diff > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
              )}>
                {totals.diff > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              </div>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              totals.diff > 0 ? "text-red-600" : "text-green-600"
            )}>
              {totals.diff > 0 ? "+" : ""}{formatCurrency(totals.diff)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Variação %</span>
              <div className={cn(
                "rounded-full p-2 text-xs font-bold",
                totals.percent > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
              )}>
                {totals.percent > 0 ? "ALTA" : "QUEDA"}
              </div>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              totals.percent > 0 ? "text-red-600" : "text-green-600"
            )}>
              {totals.percent > 1000 ? ">1000" : totals.percent.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main List */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">Lista de Compras</h2>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm">
                  <Filter size={16} className="text-gray-400" />
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-transparent focus:outline-none"
                  >
                    <option value="Todas">Todas as Categorias</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent"></div>
                </div>
              ) : Object.keys(groupedProducts).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                  <div className="mb-4 rounded-full bg-gray-50 p-4">
                    <ShoppingBag size={48} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Sua lista está vazia</h3>
                  <p className="max-w-xs text-gray-500">Comece adicionando os itens da sua feira para analisar os preços.</p>
                </div>
              ) : (
                (Object.entries(groupedProducts) as [string, Product[]][]).map(([category, items]) => (
                  <div key={category} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <h3 className="font-bold text-[#2563EB]">{category}</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {items.map(item => {
                        const { diff, percent } = calculateVariation(item.currentPrice, item.previousPrice);
                        return (
                          <div key={item.id} className="group flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-500">{item.description || "Sem descrição"}</p>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-500">Anterior</p>
                                <p className="text-gray-400 line-through">{formatCurrency(item.previousPrice)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-500">Atual</p>
                                <p className="font-bold text-gray-900">{formatCurrency(item.currentPrice)}</p>
                              </div>
                              <div className={cn(
                                "flex min-w-[100px] flex-col items-end rounded-lg p-2 px-3",
                                diff > 0 ? "bg-red-50" : "bg-green-50"
                              )}>
                                <div className="flex items-center gap-1">
                                  {diff > 0 ? <TrendingUp size={14} className="text-red-600" /> : <TrendingDown size={14} className="text-green-600" />}
                                  <span className={cn("text-sm font-bold", diff > 0 ? "text-red-700" : "text-green-700")}>
                                    {percent.toFixed(1)}%
                                  </span>
                                </div>
                                <span className={cn("text-xs font-medium", diff > 0 ? "text-red-600" : "text-green-600")}>
                                  {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                                </span>
                              </div>
                              <button 
                                onClick={() => removeProduct(item.id)}
                                className="rounded-lg p-2 text-gray-400 opacity-0 transition-all group-hover:bg-red-50 group-hover:text-red-500 group-hover:opacity-100"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Analysis & Charts */}
          <div className="space-y-8">
            {/* AI Action Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1E40AF] p-6 text-white shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-full bg-white/20 p-2">
                  <Sparkles size={24} />
                </div>
                {aiInsights && (
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Insights Gerados</span>
                )}
              </div>
              <h3 className="mb-2 text-xl font-bold">Análise Inteligente</h3>
              <p className="mb-6 text-sm text-blue-100">
                Use IA para identificar as maiores altas e descobrir como economizar nas suas próximas compras.
              </p>
              
              <button 
                onClick={analyzeWithAi}
                disabled={isLoadingAi || products.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-[#2563EB] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isLoadingAi ? "Analisando..." : "Analisar com IA"}
              </button>

              <AnimatePresence>
                {aiInsights && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-6 space-y-4 pt-6 border-t border-white/10"
                  >
                    <div>
                      <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-200">Maiores Altas e Sugestões</h4>
                      <div className="space-y-3">
                        {aiInsights.topIncreases.map((inc, idx: number) => (
                          <div key={idx} className="rounded-lg bg-white/10 p-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="font-bold">{inc.name}</span>
                              <span className="text-sm font-black text-red-300">+{inc.percent}%</span>
                            </div>
                            <p className="text-xs text-blue-100 leading-relaxed italic">" {inc.suggestion} "</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {aiInsights.generalTip && (
                      <div className="rounded-lg bg-amber-400/20 p-3 border border-amber-400/30">
                        <h4 className="mb-1 flex items-center gap-2 text-sm font-bold text-amber-200">
                          <AlertTriangle size={14} /> Dica Geral
                        </h4>
                        <p className="text-xs leading-relaxed">{aiInsights.generalTip}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Spending Chart */}
            {chartData.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 font-bold">Distribuição por Categoria</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#6B7280' }} 
                      />
                      <YAxis hide />
                      <RechartsTooltip 
                        cursor={{ fill: '#f9fafb' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg bg-white p-3 shadow-lg border border-gray-100 text-xs font-bold">
                                {formatCurrency(payload[0].value as number)}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                        {chartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#2563EB" : "#3B82F6"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "history" && (
          <section>
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-[#111827]">Histórico Completo</h1>
              <p className="text-gray-500">Lista cronológica de todos os itens registrados.</p>
            </header>
            
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">Produto</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">Categoria</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Anterior</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Atual</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Variação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(item => {
                    const { diff, percent } = calculateVariation(item.currentPrice, item.previousPrice);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-400 text-right line-through">{formatCurrency(item.previousPrice)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{formatCurrency(item.currentPrice)}</td>
                        <td className={cn(
                          "px-6 py-4 text-sm font-bold text-right",
                          diff > 0 ? "text-red-600" : diff < 0 ? "text-green-600" : "text-gray-400"
                        )}>
                          {diff > 0 ? "+" : ""}{percent.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "alerts" && (
          <section>
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-[#111827]">Alertas de Preço</h1>
              <p className="text-gray-500">Itens que sofreram as maiores altas na última feira.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
              {products.filter(p => p.currentPrice > p.previousPrice).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                  <div className="mb-4 rounded-full bg-green-50 p-4">
                    <Sparkles size={48} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Nenhum aumento detectado!</h3>
                  <p className="max-w-xs text-gray-500">Excelente! Nenhum item da sua lista ficou mais caro recentemente.</p>
                </div>
              ) : (
                products
                  .filter(p => p.currentPrice > p.previousPrice)
                  .sort((a, b) => {
                    const varA = calculateVariation(a.currentPrice, a.previousPrice).percent;
                    const varB = calculateVariation(b.currentPrice, b.previousPrice).percent;
                    return varB - varA;
                  })
                  .map(item => {
                    const { diff, percent } = calculateVariation(item.currentPrice, item.previousPrice);
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/30 p-6">
                        <div className="flex items-center gap-4">
                          <div className="rounded-full bg-red-100 p-3 text-red-600">
                            <AlertTriangle size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500">Subiu {formatCurrency(diff)} em relação à última compra</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-red-600">+{percent.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 flex w-full items-center justify-around border-t border-gray-200 bg-white px-4 py-3 lg:hidden shadow-2xl" style={{ zIndex: 9999 }}>
        <button 
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === "dashboard" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold uppercase">Início</span>
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === "history" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <History size={24} />
          <span className="text-[10px] font-bold uppercase">Histórico</span>
        </button>
        <button 
          onClick={() => setActiveTab("alerts")}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === "alerts" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <AlertTriangle size={24} />
          <span className="text-[10px] font-bold uppercase">Alertas</span>
        </button>
      </nav>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl"
            >
              <h2 className="mb-6 text-2xl font-bold">Novo Item</h2>
              <form onSubmit={handleAddProduct} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nome do Produto</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Tomate Italiano"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Preço Atual (R$)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">R$</span>
                      <input 
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="0,00"
                        value={formData.currentPrice}
                        onChange={e => setFormData({ ...formData, currentPrice: formatInputCurrency(e.target.value) })}
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-11 pr-4 py-3 outline-none transition-all focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Preço Anterior (R$)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">R$</span>
                      <input 
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        value={formData.previousPrice}
                        onChange={e => setFormData({ ...formData, previousPrice: formatInputCurrency(e.target.value) })}
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-11 pr-4 py-3 outline-none transition-all focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Categoria</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Observações (opcional)</label>
                  <textarea 
                    placeholder="Ex: No varejão estava mais caro"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="h-24 w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-xl bg-gray-100 px-6 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 rounded-xl bg-[#2563EB] px-6 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-[#1D4ED8] active:scale-95"
                  >
                    Salvar Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
