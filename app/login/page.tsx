"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, MailCheck } from 'lucide-react';

const getFriendlyLoginError = (error: { code?: string; message?: string; status?: number }) => {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return { message: "Seu e-mail ainda não foi confirmado. Confirme a caixa de entrada e tente novamente.", needsConfirmation: true };
  }
  if (code === "invalid_credentials" || message.includes("invalid login credentials") || message.includes("login credentials") || error.status === 400) {
    return { message: "E-mail ou senha incorretos. Confira os dados e tente novamente.", needsConfirmation: false };
  }
  if (error.status === 429) {
    return { message: "Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.", needsConfirmation: false };
  }
  return { message: error.message ?? "Não foi possível entrar. Tente novamente em instantes.", needsConfirmation: false };
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsConfirmation(false);
    setConfirmationSent(false);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const friendlyError = getFriendlyLoginError(error);
      setError(friendlyError.message);
      setNeedsConfirmation(friendlyError.needsConfirmation);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) { setError("Digite seu e-mail para reenviar a confirmação."); return; }
    setResendingConfirmation(true);
    setError(null);
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/login` } });
    if (error) { setError(error.message); } else { setConfirmationSent(true); }
    setResendingConfirmation(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) { setError(error.message); }
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#0d0d0d" }}>
      {/* Top splash area */}
      <div
        className="relative flex flex-col items-center justify-center px-6 pt-20 pb-24 text-center overflow-hidden"
        style={{ minHeight: "45vh" }}
      >
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,101,0,0.15) 0%, transparent 70%)" }}
        />

        {/* Logo */}
        <div className="z-10 flex flex-col items-center gap-3 animate-fade-up">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Momo"
            width={88}
            height={88}
            className="rounded-[24px]"
            style={{ boxShadow: "0 8px 32px rgba(255,101,0,0.45)" }}
          />
          <div className="mt-1 text-center">
            <h1 className="text-5xl font-black tracking-tighter text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
              Momo
            </h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] mt-1" style={{ color: "#ff6500" }}>
              Sua melhor versão
            </p>
          </div>
        </div>

        <p
          className="z-10 mt-6 max-w-[260px] text-base leading-relaxed animate-fade-up [animation-delay:200ms]"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Acompanhamento inteligente para sua jornada com Mounjaro
        </p>

        <div className="z-10 mt-4 flex gap-1.5 animate-fade-up [animation-delay:400ms]">
          <div className="h-1.5 w-5 rounded-full" style={{ background: "#ff6500" }} />
          <div className="h-1.5 w-2 rounded-full" style={{ background: "rgba(255,101,0,0.4)" }} />
          <div className="h-1.5 w-2 rounded-full" style={{ background: "rgba(255,101,0,0.2)" }} />
        </div>
      </div>

      {/* Card */}
      <div
        className="relative z-20 -mt-8 flex flex-1 flex-col rounded-t-[36px] px-8 pt-10 pb-16 animate-fade-up [animation-delay:500ms]"
        style={{ background: "#111111", borderTop: "1px solid #222" }}
      >
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
          <p className="text-sm mt-1" style={{ color: "#555" }}>Entre na sua conta para continuar</p>

          <form className="mt-8 space-y-4" onSubmit={handleEmailLogin}>
            {error && (
              <div className="rounded-xl p-4 text-sm text-red-400 animate-fade-up" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}
            {confirmationSent && (
              <div className="rounded-xl p-4 text-sm animate-fade-up" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
                Enviamos um novo link de confirmação para o seu e-mail.
              </div>
            )}

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4" style={{ color: "#555" }}>
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                required
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block h-[52px] w-full rounded-full pl-11 pr-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #2d2d2d",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#ff6500"; e.target.style.boxShadow = "0 0 0 3px rgba(255,101,0,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#2d2d2d"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div className="space-y-1">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4" style={{ color: "#555" }}>
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block h-[52px] w-full rounded-full pl-11 pr-12 py-3 text-sm text-white outline-none transition-all"
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #2d2d2d",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#ff6500"; e.target.style.boxShadow = "0 0 0 3px rgba(255,101,0,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#2d2d2d"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 transition-colors"
                  style={{ color: "#555" }}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-end px-2">
                <Link href="/esqueceu-senha" className="text-[13px] font-bold hover:underline" style={{ color: "#ff6500" }}>
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-[52px] w-full items-center justify-center rounded-full text-base font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #ff6500, #cc4c00)",
                boxShadow: "0 4px 20px rgba(255,101,0,0.4)",
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            {needsConfirmation && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendingConfirmation}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-all disabled:opacity-70"
                style={{ background: "rgba(255,101,0,0.08)", color: "#ff7a1a", border: "1px solid rgba(255,101,0,0.2)" }}
              >
                <MailCheck className="h-4 w-4" />
                {resendingConfirmation ? 'Reenviando confirmação...' : 'Reenviar e-mail de confirmação'}
              </button>
            )}
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: "1px solid #222" }} />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest" style={{ color: "#444" }}>
                <span className="px-4" style={{ background: "#111111" }}>ou</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="mt-6 flex h-[52px] w-full items-center justify-center gap-3 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.98]"
              style={{ background: "#1a1a1a", border: "1px solid #2d2d2d" }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" />
              </svg>
              Entrar com Google
            </button>
          </div>

          <p className="mt-10 text-center text-sm" style={{ color: "#555" }}>
            Não tem uma conta?{' '}
            <Link href="/cadastro" className="font-bold hover:underline" style={{ color: "#ff6500" }}>
              Cadastre-se
            </Link>
          </p>

          <div className="mt-4 text-center">
            <Link href="/cadastro/fornecedor" className="text-xs font-bold uppercase tracking-widest transition-colors" style={{ color: "#444" }}>
              Quero ser um fornecedor parceiro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
