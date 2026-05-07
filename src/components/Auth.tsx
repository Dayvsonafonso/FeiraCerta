import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock } from 'lucide-react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Cadastro realizado com sucesso! Faça o login agora.');
        setIsLogin(true);
      }
    } catch (error: any) {
      alert(error.error_description || error.message || 'Erro ao realizar autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0F172A] p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#1E293B] rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="FeiraCerta" className="h-20 w-20 object-contain mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center">
            {isLogin ? 'Entre para gerenciar seus gastos de feira.' : 'Comece a economizar de verdade no supermercado.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white pl-10 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-colors" 
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white pl-10 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-colors" 
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100/20 dark:shadow-blue-900/20 transition-colors disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
}
