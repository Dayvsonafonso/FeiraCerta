import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save, ShoppingBag, DollarSign, Layers, FileText, Hash } from "lucide-react";

interface ProductModalProps {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editingId: string | null;
  formData: any;
  setFormData: (data: any) => void;
  handleAddProduct: (e: React.FormEvent) => void;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categories: string[];
  formatInputCurrency: (val: string) => string;
  isPremium?: boolean;
}

export const PREMIUM_CATEGORIES = [
  "🥩 Carnes & Aves",
  "🐟 Peixes & Frutos do Mar",
  "👶 Bebê & Infantil",
  "🐾 Pet",
  "💊 Farmácia & Saúde",
  "🍬 Doces & Sobremesas",
  "🧴 Higiene Pessoal",
  "🧹 Limpeza & Químicos",
  "🧃 Bebidas / Prontas"
];

export function ProductModal({
  showForm,
  setShowForm,
  editingId,
  formData,
  setFormData,
  handleAddProduct,
  handleNameChange,
  categories,
  formatInputCurrency,
  isPremium = false
}: ProductModalProps) {
  return (
    <AnimatePresence>
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setShowForm(false)} 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }} 
            className="relative w-full max-w-lg glass dark:glass rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden"
          >
            <div className="bg-brand-primary/10 px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-brand-primary p-2.5 rounded-xl shadow-lg shadow-brand-primary/20">
                   <ShoppingBag className="text-white" size={20} />
                 </div>
                 <h2 className="text-xl font-black text-foreground tracking-tight">
                   {editingId ? "Editar Registro" : "Novo Registro"}
                 </h2>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                    <ShoppingBag size={18} />
                  </div>
                  <input 
                    required 
                    value={formData.name} 
                    onChange={handleNameChange} 
                    placeholder="Ex: Picanha Black"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border text-foreground pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-bold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                      <Hash size={18} />
                    </div>
                    <input 
                      type="number" 
                      min="1" 
                      step="any" 
                      required 
                      value={formData.quantity} 
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })} 
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border text-foreground pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-bold" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setor / Categoria</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors pointer-events-none">
                      <Layers size={18} />
                    </div>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({ ...formData, category: e.target.value })} 
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border text-foreground pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-bold appearance-none"
                    >
                      {categories.map(c => {
                        const isLocked = !isPremium && PREMIUM_CATEGORIES.includes(c);
                        return (
                          <option key={c} value={c} disabled={isLocked} className={isLocked ? "text-amber-600 dark:text-amber-500 font-bold" : ""}>
                            {isLocked ? `👑 ${c} (Premium)` : c}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Atual</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                      <DollarSign size={18} />
                    </div>
                    <input 
                      required 
                      value={formData.currentPrice} 
                      onChange={e => setFormData({ ...formData, currentPrice: formatInputCurrency(e.target.value) })} 
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border text-foreground pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-bold" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Anterior</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                      <DollarSign size={18} />
                    </div>
                    <input 
                      value={formData.previousPrice} 
                      onChange={e => setFormData({ ...formData, previousPrice: formatInputCurrency(e.target.value) })} 
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border text-foreground pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-bold opacity-70 focus:opacity-100" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Adicional</label>
                <div className="relative group">
                  <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                    <FileText size={18} />
                  </div>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Algum detalhe importante? (Ex: Estava em oferta relâmpago)"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border text-foreground pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary h-32 resize-none transition-all font-medium" 
                  />
                </div>
              </div>
            </form>

            <div className="p-8 border-t border-border flex flex-col sm:flex-row gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="flex-1 py-4 px-6 font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                onClick={handleAddProduct}
                className="flex-1 py-4 px-6 font-black text-white bg-brand-primary hover:bg-blue-700 rounded-2xl shadow-xl shadow-brand-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {editingId ? "Salvar Registro" : "Finalizar Item"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
