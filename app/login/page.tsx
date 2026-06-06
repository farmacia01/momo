"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, Droplets } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-forest">
      {/* 60% Superior - Splash Area */}
      <div className="relative flex h-[60%] flex-col items-center justify-center px-6 text-center text-white">
        {/* Decorative Circles */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white opacity-10" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white opacity-10" />

        {/* Logo Area */}
        <div className="z-10 flex flex-col items-center gap-2 animate-fade-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
            <Droplets className="h-10 w-10 text-white fill-white/20" />
          </div>
          <div className="mt-2 text-center">
            <h1 className="text-4xl font-black tracking-tighter">Momo</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Sua melhor versão</p>
          </div>
        </div>

        {/* Tagline */}
        <p className="z-10 mt-8 max-w-[280px] text-lg font-medium leading-tight opacity-90 animate-fade-up [animation-delay:200ms]">
          Acompanhamento inteligente para sua jornada com Mounjaro
        </p>

        {/* decorative dots */}
        <div className="z-10 mt-6 flex gap-2 animate-fade-up [animation-delay:400ms]">
          <div className="h-2 w-2 rounded-full bg-green-300" />
          <div className="h-2 w-2 rounded-full bg-green-300/60" />
          <div className="h-2 w-2 rounded-full bg-green-300/30" />
        </div>
      </div>

      {/* Card Area (Overlap) */}
      <div className="relative z-20 -mt-[15%] flex flex-1 flex-col overflow-y-auto rounded-t-[32px] bg-white px-8 pt-10 shadow-2xl transition-all animate-fade-up [animation-delay:600ms]">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
          
          <form className="mt-8 space-y-5" onSubmit={handleEmailLogin}>
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 animate-fade-up">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                required
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block h-[52px] w-full rounded-full border-gray-200 bg-gray-50 pl-11 pr-4 py-3 text-sm focus:border-forest focus:ring-forest"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block h-[52px] w-full rounded-full border-gray-200 bg-gray-50 pl-11 pr-12 py-3 text-sm focus:border-forest focus:ring-forest"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-end px-2">
                <Link 
                  href="/esqueceu-senha" 
                  className="text-[13px] font-bold text-forest hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-[52px] w-full items-center justify-center rounded-full bg-forest text-base font-bold text-white shadow-lg transition-all hover:bg-forest/90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400"><span className="bg-white px-4">ou</span></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="mt-6 flex h-[52px] w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" /></svg>
              Google
            </button>
          </div>

          <p className="mt-10 pb-8 text-center text-sm text-gray-500">
            Não tem uma conta?{' '}
            <Link href="/cadastro" className="font-bold text-forest hover:underline">
              Cadastre-se
            </Link>
          </p>

          <div className="pb-10 text-center">
            <Link href="/cadastro/fornecedor" className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-forest transition-colors">
              Quero ser um fornecedor parceiro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
