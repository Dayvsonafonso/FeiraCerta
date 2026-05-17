import React, { useState } from "react";
import { Sparkles, BrainCircuit, Lightbulb, Zap } from "lucide-react";
import { Product, getSavingInsights, AiInsight } from "../lib/gemini";
import { motion, AnimatePresence } from "motion/react";

interface AiCardProps {
  products: Product[];
}

export function AiCard({ products }: AiCardProps) {
  const [aiInsights, setAiInsights] = useState<AiInsight | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const analyzeWithAi = async () => {
    if (products.length === 0 || cooldown > 0) return;
    setIsLoadingAi(true);
    try {
      const insights = await getSavingInsights(products);
      setAiInsights(insights);
      setCooldown(30); // 30 second cooldown between requests
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-accent p-8 text-white shadow-2xl shadow-brand-primary/20"
    >
      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl animate-float"></div>

      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/30">
            <Sparkles size={24} className="text-white animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
            Powered by Gemini 1.5
          </span>
        </div>

        <h3 className="mb-2 text-2xl font-black tracking-tight">Inteligência Artificial</h3>
        <p className="mb-8 text-sm text-white/80 leading-relaxed font-medium">
          Nossa IA analisa sua lista em tempo real para encontrar oportunidades de economia e sugerir trocas inteligentes.
        </p>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={analyzeWithAi}
          disabled={isLoadingAi || products.length === 0 || cooldown > 0}
          className="group relative w-full overflow-hidden rounded-2xl bg-white p-4 font-black text-brand-primary shadow-xl transition-all disabled:opacity-50"
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            {isLoadingAi ? (
              <div className="h-5 w-5 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            ) : cooldown > 0 ? (
              <span className="text-slate-400">Disponível em {cooldown}s</span>
            ) : (
              <>
                <BrainCircuit size={18} />
                <span>Gerar Insights Mágicos</span>
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        </motion.button>

        <AnimatePresence>
          {aiInsights && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 space-y-4 pt-8 border-t border-white/20"
            >
              {aiInsights.topIncreases.map((inc, i) => (
                <motion.div 
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm group hover:bg-white/20 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                       <Zap size={14} className="text-yellow-300" />
                       <span className="font-bold text-sm tracking-tight">{inc.name}</span>
                    </div>
                    <span className="bg-red-500/40 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-400/30">
                      +{inc.percent}%
                    </span>
                  </div>
                  <div className="flex gap-2 items-start mt-1">
                    <Lightbulb size={14} className="text-cyan-300 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-white/90 leading-normal font-medium italic">
                      {inc.suggestion}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
