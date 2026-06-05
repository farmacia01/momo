"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft, CheckCircle2, Droplets } from "lucide-react";
import Link from "next/link";
import { m  } from 'framer-motion';

export default function EsqueceuSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col items-center justify-center p-6">
      <m.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-xl shadow-black/5"
      >
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-forest transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-bold">Voltar ao login</span>
        </Link>

        {sent ? (
          <div className="text-center space-y-6 py-4">
            <div className="h-20 w-20 bg-green-50 text-forest rounded-3xl flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Verifique seu e-mail</h1>
              <p className="text-sm text-slate-500 leading-relaxed px-4">
                Enviamos um link de redefinição para <strong className="text-slate-900">{email}</strong>. 
                Verifique sua caixa de entrada e spam.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest/10 mb-4">
                <Droplets className="h-6 w-6 text-forest fill-forest/20" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Recuperar acesso</h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Digite seu e-mail para receber as instruções de redefinição de senha.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Seu e-mail</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block h-[52px] w-full rounded-full border-none bg-gray-50 pl-11 pr-4 text-sm shadow-sm transition-all focus:ring-2 focus:ring-forest focus:outline-none"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] bg-[#1c4d2e] text-white rounded-full font-bold text-base shadow-lg shadow-forest/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </button>
            </form>
          </div>
        )}
      </m.div>
    </div>
  );
}
