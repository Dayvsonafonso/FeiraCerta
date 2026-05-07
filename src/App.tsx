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
  Filter,
  Pencil
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
  "🥩 Carnes & Aves",
  "🐟 Peixes & Frutos do Mar",
  "🥚 Ovos & Frios",
  "🥛 Laticínios",
  "🍎 Frutas",
  "🥦 Verduras & Folhas",
  "🥕 Legumes & Raízes",
  "🌾 Grãos & Cereais",
  "🫙 Enlatados & Conservas",
  "🍝 Massas & Farinhas",
  "🫒 Óleos & Temperos",
  "🧂 Ingredientes Secos",
  "🍞 Padaria",
  "🍪 Biscoitos & Bolachas",
  "🧃 Bebidas",
  "🍬 Doces & Sobremesas",
  "🧴 Higiene Pessoal",
  "🧹 Limpeza",
  "👶 Bebê & Infantil",
  "🐾 Pet",
  "💊 Farmácia & Saúde",
  "📦 Outros"
];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "🍎 Frutas",
    currentPrice: "",
    previousPrice: "",
    quantity: "",
    description: ""
  });
  const [aiInsights, setAiInsights] = useState<AiInsight | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "alerts">("dashboard");

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatInputCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
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
      console.error("Error:", error);
    } else {
      const mapped = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        currentPrice: Number(p.current_price),
        previousPrice: Number(p.previous_price),
        quantity: Number(p.quantity || 1),
        description: p.description
      }));
      setProducts(mapped);
    }
    setIsLoadingProducts(false);
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      currentPrice: product.currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      previousPrice: product.previousPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      quantity: product.quantity.toString(),
      description: product.description || ""
    });
    setShowForm(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.currentPrice) return;
    const currentPrice = parseCurrencyToNumber(formData.currentPrice);
    const previousPrice = formData.previousPrice ? parseCurrencyToNumber(formData.previousPrice) : currentPrice;
    const quantity = Number(formData.quantity) || 1;

    const payload = {
      name: formData.name,
      category: formData.category,
      current_price: currentPrice,
      previous_price: previousPrice,
      quantity: quantity,
      description: formData.description
    };

    let result;
    if (editingId) {
      result = await supabase.from("products").update(payload).eq("id", editingId).select();
    } else {
      result = await supabase.from("products").insert([payload]).select();
    }

    if (!result.error) {
      fetchProducts();
      setFormData({ name: "", category: "🍎 Frutas", currentPrice: "", previousPrice: "", quantity: "", description: "" });
      setEditingId(null);
      setShowForm(false);
    } else {
      console.error("Supabase error:", result.error);
      alert("Erro ao salvar!");
    }
  };

  const removeProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) setProducts(products.filter(p => p.id !== id));
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
    const current = products.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
    const prev = products.reduce((sum, p) => sum + (p.previousPrice * p.quantity), 0);
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
        .reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
      return { name: cat, total: current };
    }).filter(d => d.total > 0);
  }, [products]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans pb-24 lg:pb-0">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-gray-200 bg-white lg:block shadow-sm z-50">
        <div className="flex h-20 items-center border-b border-gray-200 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB] text-white">
              <ShoppingBag size={24} />
            </div>
            <span className="text-xl font-bold">FeiraCerta</span>
          </div>
        </div>
        <nav className="mt-8 space-y-2 px-4">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
              activeTab === "dashboard" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
              activeTab === "history" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <History size={20} /> Histórico
          </button>
          <button 
            onClick={() => setActiveTab("alerts")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
              activeTab === "alerts" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <AlertTriangle size={20} /> Alertas
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {activeTab === "dashboard" && (
          <section>
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Controle de Gastos de Feira</h1>
                <p className="text-gray-500 text-sm">Acompanhe a variação de preços de forma inteligente.</p>
              </div>
              <button 
                onClick={() => { setEditingId(null); setFormData({ name: "", category: "🍎 Frutas", currentPrice: "", previousPrice: "", quantity: "", description: "" }); setShowForm(true); }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
              >
                <Plus size={20} /> Adicionar Item
              </button>
            </header>

            {/* Stats */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Atual</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.current)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Mês Anterior</p>
                <p className="text-2xl font-bold text-gray-400">{formatCurrency(totals.prev)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Variação Real</p>
                <p className={`text-2xl font-bold ${totals.diff > 0 ? "text-red-600" : "text-green-600"}`}>
                  {totals.diff > 0 ? "+" : ""}{formatCurrency(totals.diff)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Variação %</p>
                <p className={`text-2xl font-bold ${totals.percent > 0 ? "text-red-600" : "text-green-600"}`}>
                  {totals.percent.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Lista de Compras</h2>
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none"
                  >
                    <option value="Todas">Todas</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  {isLoadingProducts ? (
                    <div className="py-20 text-center text-gray-500">Carregando itens...</div>
                  ) : Object.keys(groupedProducts).length === 0 ? (
                    <div className="py-20 text-center text-gray-400 border-2 border-dashed rounded-2xl">
                      Sua lista está vazia
                    </div>
                  ) : (
                    Object.entries(groupedProducts).map(([category, items]) => (
                      <div key={category} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-blue-600 text-sm">
                          {category}
                        </div>
                        <div className="divide-y divide-gray-100">
                          {items.map(item => {
                            const unitPrice = item.currentPrice;
                            const totalItem = unitPrice * item.quantity;
                            const { diff, percent } = calculateVariation(item.currentPrice, item.previousPrice);
                            return (
                              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                                      x{item.quantity}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">{item.description || "Sem descrição"}</p>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-6">
                                  <div className="text-right hidden sm:block">
                                    <p className="text-[10px] text-gray-400 uppercase">Unitário</p>
                                    <p className="text-sm text-gray-500">{formatCurrency(unitPrice)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] text-gray-400 uppercase">Subtotal</p>
                                    <p className="text-sm font-bold">{formatCurrency(totalItem)}</p>
                                  </div>
                                  <div className={`text-right min-w-[60px] ${diff > 0 ? "text-red-600" : "text-green-600"}`}>
                                    <p className="text-xs font-bold">{percent.toFixed(1)}%</p>
                                    <p className="text-[10px] font-medium">{diff > 0 ? "+" : ""}{formatCurrency(diff)}</p>
                                  </div>
                                  <div className="flex items-center gap-2 border-l pl-3 ml-1">
                                    <button onClick={() => handleEditClick(item)} className="text-gray-400 hover:text-blue-500 transition-colors">
                                      <Pencil size={18} />
                                    </button>
                                    <button onClick={() => removeProduct(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
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

              <div className="space-y-6">
                <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <Sparkles size={24} className="text-blue-200" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">AI Power</span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold">Análise com IA</h3>
                  <p className="mb-6 text-sm text-blue-100 leading-relaxed">
                    Descubra como economizar analisando as variações da sua feira.
                  </p>
                  <button 
                    onClick={analyzeWithAi}
                    disabled={isLoadingAi || products.length === 0}
                    className="w-full rounded-xl bg-white py-3 font-bold text-blue-600 hover:scale-[1.02] transition-transform disabled:opacity-50"
                  >
                    {isLoadingAi ? "Analisando..." : "Gerar Insights"}
                  </button>

                  {aiInsights && (
                    <div className="mt-6 space-y-4 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-4">
                      {aiInsights.topIncreases.map((inc, i) => (
                        <div key={i} className="bg-white/10 p-3 rounded-lg border border-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm">{inc.name}</span>
                            <span className="text-red-300 text-xs font-black">+{inc.percent}%</span>
                          </div>
                          <p className="text-[11px] text-blue-100 italic">"{inc.suggestion}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {chartData.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-6 font-bold text-sm">Gastos por Categoria</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ bottom: 20 }}>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 10, fill: '#6B7280' }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                          />
                          <RechartsTooltip 
                            content={({ active, payload }) => {
                              if (active && payload?.length) return (
                                <div className="bg-white p-3 shadow-xl border rounded-lg text-xs font-bold space-y-1">
                                  <p className="text-gray-500">{payload[0].payload.name}</p>
                                  <p className="text-blue-600 text-sm">{formatCurrency(payload[0].value as number)}</p>
                                </div>
                              );
                              return null;
                            }}
                          />
                          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                            {chartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#2563EB" : "#3B82F6"} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "history" && (
          <section>
            <header className="mb-8">
              <h1 className="text-2xl font-bold">Histórico Completo</h1>
              <p className="text-gray-500 text-sm">Todos os registros ordenados por data.</p>
            </header>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4 text-center">Qtd</th>
                    <th className="px-6 py-4 text-right">Unitário</th>
                    <th className="px-6 py-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(item => {
                    const totalItem = item.currentPrice * item.quantity;
                    return (
                      <tr key={item.id} className="text-sm">
                        <td className="px-6 py-4 font-medium">{item.name}</td>
                        <td className="px-6 py-4 text-center text-gray-500 font-bold">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-400">{formatCurrency(item.previousPrice)}</td>
                        <td className="px-6 py-4 text-right font-bold">{formatCurrency(totalItem)}</td>
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
              <h1 className="text-2xl font-bold">Alertas de Preço</h1>
              <p className="text-gray-500 text-sm">Itens com maior aumento de custo.</p>
            </header>
            <div className="grid grid-cols-1 gap-4">
              {products.filter(p => p.currentPrice > p.previousPrice).length === 0 ? (
                <div className="py-20 text-center text-gray-400 border-2 border-dashed rounded-2xl">
                  Nenhum aumento detectado
                </div>
              ) : (
                products
                  .filter(p => p.currentPrice > p.previousPrice)
                  .sort((a, b) => {
                    const vA = calculateVariation(a.currentPrice, a.previousPrice).percent;
                    const vB = calculateVariation(b.currentPrice, b.previousPrice).percent;
                    return vB - vA;
                  })
                  .map(item => {
                    const { diff, percent } = calculateVariation(item.currentPrice, item.previousPrice);
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-red-50/50 border border-red-100 p-6 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="bg-red-100 p-3 rounded-full text-red-600">
                            <AlertTriangle size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-red-600 font-medium">Unitário subiu {formatCurrency(diff)}</p>
                          </div>
                        </div>
                        <div className="text-2xl font-black text-red-600">+{percent.toFixed(1)}%</div>
                      </div>
                    );
                  })
              )}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 flex w-full justify-around bg-white border-t border-gray-200 py-3 lg:hidden z-50 shadow-2xl">
        <button onClick={() => setActiveTab("dashboard")} className={`flex flex-col items-center gap-1 ${activeTab === "dashboard" ? "text-blue-600" : "text-gray-400"}`}>
          <LayoutDashboard size={24} /> <span className="text-[10px] font-bold">Início</span>
        </button>
        <button onClick={() => setActiveTab("history")} className={`flex flex-col items-center gap-1 ${activeTab === "history" ? "text-blue-600" : "text-gray-400"}`}>
          <History size={24} /> <span className="text-[10px] font-bold">Histórico</span>
        </button>
        <button onClick={() => setActiveTab("alerts")} className={`flex flex-col items-center gap-1 ${activeTab === "alerts" ? "text-blue-600" : "text-gray-400"}`}>
          <AlertTriangle size={24} /> <span className="text-[10px] font-bold">Alertas</span>
        </button>
      </nav>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white p-8 rounded-3xl shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">{editingId ? "Editar Item" : "Novo Item"}</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">Nome</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Preço Unitário Atual</label>
                    <input required value={formData.currentPrice} onChange={e => setFormData({ ...formData, currentPrice: formatInputCurrency(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Preço Unitário Anterior</label>
                    <input value={formData.previousPrice} onChange={e => setFormData({ ...formData, previousPrice: formatInputCurrency(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Quantidade</label>
                    <input type="number" min="1" step="any" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Categoria</label>
                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">Observações (opcional)</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none h-24 resize-none" placeholder="Ex: Estava mais caro no varejão" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
                    {editingId ? "Salvar Alterações" : "Salvar Item"}
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
