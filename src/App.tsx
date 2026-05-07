import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  AlertTriangle, 
  ShoppingBag,
  History,
  LayoutDashboard,
  Moon,
  Sun
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell 
} from "recharts";
import { Product } from "./lib/gemini";
import { formatCurrency, calculateVariation } from "./lib/utils";
import { supabase } from "./lib/supabase";

import { DashboardStats } from "./components/DashboardStats";
import { AiCard } from "./components/AiCard";
import { ProductList } from "./components/ProductList";
import { ProductModal } from "./components/ProductModal";

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
  "🫒 Óleos, Molhos & Temperos",
  "🧂 Ingredientes Secos",
  "🍞 Padaria",
  "🍪 Biscoitos & Bolachas",
  "🧃 Bebidas / Prontas",
  "🍬 Doces & Sobremesas",
  "🧴 Higiene Pessoal",
  "🧹 Limpeza",
  "👶 Bebê & Infantil",
  "🐾 Pet",
  "💊 Farmácia & Saúde",
  "📦 Outros"
];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "🍎 Frutas",
    currentPrice: "",
    previousPrice: "",
    quantity: "",
    description: ""
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "alerts">("dashboard");

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

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
        description: p.description,
        createdAt: p.created_at
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    let newPrevPrice = formData.previousPrice;
    
    if (!editingId && newName.length > 2) {
      const existing = products.find(p => p.name.toLowerCase() === newName.toLowerCase().trim());
      if (existing) {
        newPrevPrice = existing.currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      }
    }

    setFormData({ ...formData, name: newName, previousPrice: newPrevPrice });
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
    // The previous month's actual expenditure is the sum of its items' currentPrices!
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

  const chartData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const current = currentMonthProducts
        .filter(p => p.category === cat)
        .reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
      return { name: cat, total: current };
    }).filter(d => d.total > 0);
  }, [currentMonthProducts]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] text-[#111827] dark:text-gray-100 font-sans pb-24 lg:pb-0 transition-colors duration-200">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E293B] lg:flex flex-col shadow-sm z-50 transition-colors duration-200">
        <div className="flex h-20 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB] text-white">
              <ShoppingBag size={24} />
            </div>
            <span className="text-xl font-bold">FeiraCerta</span>
          </div>
        </div>
        <nav className="mt-8 space-y-2 px-4 flex-1">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
              activeTab === "dashboard" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
              activeTab === "history" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }`}
          >
            <History size={20} /> Histórico
          </button>
          <button 
            onClick={() => setActiveTab("alerts")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
              activeTab === "alerts" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }`}
          >
            <AlertTriangle size={20} /> Alertas
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDarkMode ? "Modo Claro" : "Modo Escuro"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {activeTab === "dashboard" && (
          <section>
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Controle de Gastos de Feira</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Acompanhe a variação de preços de forma inteligente.</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Mobile Theme Toggle */}
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  className="lg:hidden flex h-12 w-12 items-center justify-center rounded-lg bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 shadow-sm"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button 
                  onClick={() => { setEditingId(null); setFormData({ name: "", category: "🍎 Frutas", currentPrice: "", previousPrice: "", quantity: "", description: "" }); setShowForm(true); }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
                >
                  <Plus size={20} /> Adicionar Item
                </button>
              </div>
            </header>

            {/* Dashboard Stats */}
            <DashboardStats totals={totals} />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Product List Component */}
              <ProductList 
                products={currentMonthProducts}
                categories={CATEGORIES}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                isLoadingProducts={isLoadingProducts}
                handleEditClick={handleEditClick}
                removeProduct={removeProduct}
              />

              <div className="space-y-6">
                {/* AI Card Component */}
                <AiCard products={currentMonthProducts} />

                {chartData.length > 0 && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E293B] p-6 shadow-sm transition-colors">
                    <h3 className="mb-6 font-bold text-sm text-gray-900 dark:text-white">Gastos por Categoria</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ bottom: 20 }}>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 10, fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                          />
                          <RechartsTooltip 
                            content={({ active, payload }) => {
                              if (active && payload?.length) return (
                                <div className="bg-white dark:bg-[#0F172A] p-3 shadow-xl border border-gray-100 dark:border-gray-800 rounded-lg text-xs font-bold space-y-1">
                                  <p className="text-gray-500 dark:text-gray-400">{payload[0].payload.name}</p>
                                  <p className="text-blue-600 dark:text-blue-400 text-sm">{formatCurrency(payload[0].value as number)}</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Histórico Completo</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Todos os registros ordenados por data.</p>
            </header>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E293B] overflow-hidden shadow-sm overflow-x-auto transition-colors">
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-gray-50 dark:bg-[#0F172A] border-b border-gray-200 dark:border-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 font-bold">
                  <tr>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4 text-center">Qtd</th>
                    <th className="px-6 py-4 text-right">Unitário</th>
                    <th className="px-6 py-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {products.map(item => {
                    const totalItem = item.currentPrice * item.quantity;
                    return (
                      <tr key={item.id} className="text-sm">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                        <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 font-bold">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-400 dark:text-gray-500">{formatCurrency(item.previousPrice)}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(totalItem)}</td>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alertas de Preço</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Itens com maior aumento de custo.</p>
            </header>
            <div className="grid grid-cols-1 gap-4">
              {products.filter(p => p.currentPrice > p.previousPrice).length === 0 ? (
                <div className="py-20 text-center text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
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
                      <div key={item.id} className="flex items-center justify-between bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 rounded-2xl transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 dark:text-red-400">
                            <AlertTriangle size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{item.name}</h3>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Unitário subiu {formatCurrency(diff)}</p>
                          </div>
                        </div>
                        <div className="text-2xl font-black text-red-600 dark:text-red-400">+{percent.toFixed(1)}%</div>
                      </div>
                    );
                  })
              )}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 flex w-full justify-around bg-white dark:bg-[#1E293B] border-t border-gray-200 dark:border-gray-800 py-3 lg:hidden z-50 shadow-2xl transition-colors duration-200">
        <button onClick={() => setActiveTab("dashboard")} className={`flex flex-col items-center gap-1 ${activeTab === "dashboard" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}>
          <LayoutDashboard size={24} /> <span className="text-[10px] font-bold">Início</span>
        </button>
        <button onClick={() => setActiveTab("history")} className={`flex flex-col items-center gap-1 ${activeTab === "history" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}>
          <History size={24} /> <span className="text-[10px] font-bold">Histórico</span>
        </button>
        <button onClick={() => setActiveTab("alerts")} className={`flex flex-col items-center gap-1 ${activeTab === "alerts" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}>
          <AlertTriangle size={24} /> <span className="text-[10px] font-bold">Alertas</span>
        </button>
      </nav>

      {/* Product Modal Component */}
      <ProductModal 
        showForm={showForm}
        setShowForm={setShowForm}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        handleAddProduct={handleAddProduct}
        handleNameChange={handleNameChange}
        categories={CATEGORIES}
        formatInputCurrency={formatInputCurrency}
      />
    </div>
  );
}
