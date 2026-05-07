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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.error_description || error.message || 'Erro ao entrar com Google');
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

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500">OU</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl shadow-sm transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continuar com Google
        </button>

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
