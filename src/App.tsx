import React, { useState, useEffect } from "react";
import { 
  Plus, 
  AlertTriangle, 
  ShoppingBag,
  History,
  LayoutDashboard,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Copy,
  Search,
  Printer,
  Calendar as CalendarIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

import { Product } from "./lib/gemini";
import { formatCurrency } from "./lib/utils";
import { useAuth } from "./hooks/useAuth";
import { useProducts } from "./hooks/useProducts";

import { DashboardStats } from "./components/DashboardStats";
import { AiCard } from "./components/AiCard";
import { ProductList } from "./components/ProductList";
import { ProductModal } from "./components/ProductModal";
import { Auth } from "./components/Auth";

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
  const { session, loading: authLoading, signOut } = useAuth();
  const { 
    products, 
    currentMonthProducts, 
    prevMonthProducts,
    isLoading: productsLoading, 
    totals, 
    addProduct, 
    updateProduct, 
    removeProduct,
    importLastMonthItems
  } = useProducts(session?.user?.id);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  const [formData, setFormData] = useState({
    name: "",
    category: "🍎 Frutas",
    currentPrice: "",
    previousPrice: "",
    quantity: "",
    description: ""
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "alerts">("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

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

  const handleSaveProduct = async (e: React.FormEvent) => {
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
      description: formData.description,
      user_id: session?.user?.id
    };

    let error;
    if (editingId) {
      const res = await updateProduct(editingId, payload);
      error = res.error;
    } else {
      const res = await addProduct(payload);
      error = res.error;
    }

    if (!error) {
      setFormData({ name: "", category: "🍎 Frutas", currentPrice: "", previousPrice: "", quantity: "", description: "" });
      setEditingId(null);
      setShowForm(false);
    } else {
      console.error("Error saving product:", error);
      alert("Erro ao salvar!");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const chartData = CATEGORIES.map(cat => {
    const current = currentMonthProducts
      .filter(p => p.category === cat)
      .reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
    return { name: cat, total: current };
  }).filter(d => d.total > 0);

  const filteredHistory = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      {/* Premium Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-72 border-r border-border bg-card lg:flex flex-col z-50 shadow-sm">
        <div className="flex h-24 items-center gap-3 px-8 border-b border-border">
          <div className="h-12 w-12 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <ShoppingBag className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">FeiraCerta</h1>
            <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Smart Finance</p>
          </div>
        </div>

        <nav className="mt-8 space-y-2 px-4 flex-1">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Painel" },
            { id: "history", icon: History, label: "Histórico" },
            { id: "alerts", icon: AlertTriangle, label: "Alertas" },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 font-semibold transition-all duration-200 group ${
                activeTab === item.id 
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? "text-white" : "group-hover:translate-x-1 transition-transform"} />
              {item.label}
              {activeTab === item.id && <motion.div layoutId="activeTab" className="ml-auto"><ChevronRight size={16} /></motion.div>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-border space-y-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-border hover:border-brand-primary/30 transition-all"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{isDarkMode ? "Claro" : "Escuro"}</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-brand-primary' : 'bg-slate-300'}`}>
               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'left-6' : 'left-1'}`}></div>
            </div>
          </button>
          <button 
            onClick={signOut} 
            className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut size={20} />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-72 flex-1 min-h-screen p-6 lg:p-10 pb-28 lg:pb-10">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {activeTab === "dashboard" ? "Dashboard" : activeTab === "history" ? "Histórico" : "Alertas"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Bem-vindo, <span className="font-bold text-foreground">{session.user?.email?.split('@')[0]}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             {activeTab === "dashboard" && currentMonthProducts.length === 0 && prevMonthProducts.length > 0 && (
               <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={importLastMonthItems}
                className="hidden sm:flex items-center justify-center gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-border px-6 py-4 font-bold text-foreground shadow-sm hover:border-brand-primary/50 transition-all"
              >
                <Copy size={20} className="text-brand-primary" />
                Importar Lista Anterior
              </motion.button>
             )}
             <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setEditingId(null); setFormData({ name: "", category: "🍎 Frutas", currentPrice: "", previousPrice: "", quantity: "", description: "" }); setShowForm(true); }}
              className="flex items-center justify-center gap-3 rounded-2xl bg-brand-primary px-8 py-4 font-bold text-white shadow-xl shadow-brand-primary/20 hover:bg-blue-700 transition-all"
            >
              <Plus size={22} strokeWidth={3} />
              <span className="hidden sm:inline">Novo Item</span>
            </motion.button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "dashboard" && (
              <div className="space-y-10">
                <DashboardStats totals={totals} />

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <ProductList 
                      products={currentMonthProducts}
                      categories={CATEGORIES}
                      filterCategory={filterCategory}
                      setFilterCategory={setFilterCategory}
                      isLoadingProducts={productsLoading}
                      handleEditClick={handleEditClick}
                      removeProduct={removeProduct}
                    />
                  </div>

                  <div className="space-y-8">
                    <AiCard products={currentMonthProducts} />

                    {chartData.length > 0 && (
                      <div className="glass dark:glass rounded-3xl p-8 border border-border shadow-sm">
                        <h3 className="mb-8 font-bold text-lg tracking-tight">Gastos por Categoria</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ bottom: 20 }}>
                              <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                              />
                              <RechartsTooltip 
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                  if (active && payload?.length) return (
                                    <div className="glass p-4 shadow-2xl border border-border rounded-2xl">
                                      <p className="text-xs font-bold text-slate-500 mb-1">{payload[0].payload.name}</p>
                                      <p className="text-lg font-black text-brand-primary">{formatCurrency(payload[0].value as number)}</p>
                                    </div>
                                  );
                                  return null;
                                }}
                              />
                              <Bar dataKey="total" radius={[8, 8, 8, 8]} barSize={24}>
                                {chartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "var(--color-brand-primary)" : "var(--color-brand-secondary)"} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between no-print">
                  <div className="relative w-full sm:max-w-md group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                      <Search size={18} />
                    </div>
                    <input 
                      type="text"
                      placeholder="Buscar no histórico..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-card border border-border text-foreground pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium"
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-border px-8 py-4 font-bold text-foreground shadow-sm hover:border-brand-primary/50 transition-all w-full sm:w-auto"
                  >
                    <Printer size={20} className="text-brand-primary" />
                    Imprimir Relatório
                  </motion.button>
                </div>

                <div className="glass dark:glass rounded-3xl overflow-hidden border border-border shadow-sm print-area">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border">
                        <tr>
                          <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Data</th>
                          <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Produto</th>
                          <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-center">Qtd</th>
                          <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Unitário</th>
                          <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredHistory.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-8 py-5 font-medium text-slate-500 whitespace-nowrap">
                              {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-8 py-5 font-bold">{item.name}</td>
                            <td className="px-8 py-5 text-center text-slate-500 font-medium">{item.quantity}</td>
                            <td className="px-8 py-5 text-right text-slate-400">{formatCurrency(item.currentPrice)}</td>
                            <td className="px-8 py-5 text-right font-black text-brand-primary">{formatCurrency(item.currentPrice * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.filter(p => p.currentPrice > p.previousPrice).length === 0 ? (
                  <div className="col-span-full py-24 text-center border-2 border-dashed border-border rounded-[2.5rem]">
                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                       <AlertTriangle className="text-slate-300" size={32} />
                    </div>
                    <p className="text-slate-400 font-semibold text-lg">Nenhum alerta detectado</p>
                  </div>
                ) : (
                  products
                    .filter(p => p.currentPrice > p.previousPrice)
                    .map(item => {
                      const diff = item.currentPrice - item.previousPrice;
                      const percent = (diff / item.previousPrice) * 100;
                      return (
                        <motion.div 
                          key={item.id} 
                          whileHover={{ y: -5 }}
                          className="bg-red-50/30 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-8 rounded-[2rem] relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                             <AlertTriangle size={80} className="text-red-600" />
                          </div>
                          <h4 className="font-bold text-xl mb-1">{item.name}</h4>
                          <p className="text-red-600 dark:text-red-400 font-bold text-sm mb-6">Subiu {formatCurrency(diff)}</p>
                          <div className="flex items-end justify-between">
                            <div>
                               <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Variação</p>
                               <p className="text-3xl font-black text-red-600 dark:text-red-400">+{percent.toFixed(1)}%</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Premium Nav */}
      <nav className="fixed bottom-6 left-6 right-6 flex justify-around items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 py-4 lg:hidden z-50 rounded-[2rem] shadow-2xl">
        {[
          { id: "dashboard", icon: LayoutDashboard, label: "Início" },
          { id: "history", icon: History, label: "Histórico" },
          { id: "alerts", icon: AlertTriangle, label: "Alertas" },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)} 
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === item.id ? "text-brand-primary scale-110" : "text-slate-400"}`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Modal Integration */}
      <ProductModal 
        showForm={showForm}
        setShowForm={setShowForm}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        handleAddProduct={handleSaveProduct}
        handleNameChange={handleNameChange}
        categories={CATEGORIES}
        formatInputCurrency={formatInputCurrency}
      />
    </div>
  );
}
