"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { m  } from 'framer-motion';
import toast from "react-hot-toast";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a session (the hash token is handled by Supabase client automatically)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session, it might be an invalid or expired link
        // Note: For password reset links, Supabase automatically logs in the user 
        // temporarily so we can call updateUser.
      }
    };
    checkSession();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      toast.success("Senha alterada com sucesso!");
      setTimeout(() => {
        router.push("/login");
      }, 2500);
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
        {success ? (
          <div className="text-center space-y-6 py-4">
            <div className="h-20 w-20 bg-green-50 text-forest rounded-3xl flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Senha Redefinida!</h1>
              <p className="text-sm text-slate-500">
                Sua senha foi atualizada. Você será redirecionado para o login em instantes...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="h-12 w-12 bg-[#e8f5ee] text-forest rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Nova Senha</h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Crie uma senha forte de pelo menos 8 caracteres.
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nova Senha</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Pelo menos 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block h-12 w-full rounded-2xl border-none bg-[#f9fafb] pl-11 pr-12 text-sm shadow-sm transition-all focus:ring-2 focus:ring-forest focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-forest"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block h-12 w-full rounded-2xl border-none bg-[#f9fafb] pl-11 pr-4 text-sm shadow-sm transition-all focus:ring-2 focus:ring-forest focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] bg-[#1c4d2e] text-white rounded-full font-bold text-sm shadow-lg shadow-forest/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Redefinir senha"}
              </button>
            </form>
          </div>
        )}
      </m.div>
    </div>
  );
}
