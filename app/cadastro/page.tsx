"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ArrowRight, Check, User, Activity, Target, Smartphone, Share2, MoreVertical, Plus, Mail, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const DOSES = ['2.5', '5', '7.5', '10', '12.5', '15'];
const DIAS_SEMANA = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
];

const getFriendlySignupError = (error: { code?: string; message?: string; status?: number }) => {
  const msg = error.message?.toLowerCase() ?? "";
  if (msg.includes("already registered") || msg.includes("user already exists") || msg.includes("already been registered")) {
    return "Este e-mail já tem uma conta. Tente fazer login.";
  }
  if (msg.includes("invalid email") || msg.includes("unable to validate email")) {
    return "Digite um e-mail válido.";
  }
  if (msg.includes("password") && (msg.includes("characters") || msg.includes("least"))) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }
  if (msg.includes("network") || msg.includes("fetch") || error.status === 0) {
    return "Sem conexão. Verifique sua internet e tente novamente.";
  }
  return "Não foi possível criar a conta. Tente novamente.";
};


export default function CadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailPendente, setEmailPendente] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [refCode, setRefCode] = useState('');
  const creatingRef = React.useRef(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setRefCode(ref);
  }, []);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    password: '',
    data_inicio_tratamento: '',
    dose_atual_mg: '2.5',
    altura_cm: '',
    peso_inicial: '',
    peso_meta: '',
    dia_aplicacao: '0',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const createAccount = async () => {
    if (creatingRef.current) return false;
    creatingRef.current = true;
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nome: formData.nome,
          telefone: formData.telefone,
          skip_trial: 'true',
          altura_cm: Number(formData.altura_cm),
          peso_inicial: Number(formData.peso_inicial),
          peso_meta: formData.peso_meta ? Number(formData.peso_meta) : null,
          data_inicio_tratamento: formData.data_inicio_tratamento,
          dose_atual_mg: Number(formData.dose_atual_mg),
          dia_aplicacao: Number(formData.dia_aplicacao),
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      creatingRef.current = false;
      setError(getFriendlySignupError(signUpError));
      return false;
    }

    // Supabase retorna session=null quando email confirmation está ativo
    if (!data.session) {
      setEmailPendente(true);
    }

    // Processa referral se veio de convite
    if (refCode) {
      await fetch('/api/referral/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: refCode }),
      }).catch(() => {}); // não bloqueia o fluxo se falhar
    }

    return true;
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!formData.nome || !formData.email || !formData.telefone || !formData.password) {
        toast.error('Preencha todos os dados');
        return;
      }
      if (!formData.email.includes('@')) {
        toast.error('Digite um e-mail válido');
        return;
      }
      const digits = formData.telefone.replace(/\D/g, '');
      if (digits.length < 10) {
        toast.error('Digite um telefone válido com DDD');
        return;
      }
      if (formData.password.length < 8) {
        toast.error('A senha deve ter pelo menos 8 caracteres');
        return;
      }
    }
    if (step === 2 && (!formData.data_inicio_tratamento || !formData.altura_cm || !formData.peso_inicial)) {
      toast.error('Preencha os dados do tratamento');
      return;
    }
    if (step === 3) {
      const ok = await createAccount();
      if (!ok) return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    if (step === 1) { router.push('/login'); }
    else if (step === 4) { /* can't go back after account created */ }
    else { setStep(step - 1); }
  };

  const TOTAL_STEPS = 4;

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text transition-colors duration-300">
      <header
        className="flex items-center justify-between px-6 py-4 shadow-sm"
        style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-surface-border)" }}
      >
        <button
          onClick={prevStep}
          className="rounded-full p-2 transition-all active:scale-95"
          style={{
            background: "var(--color-surface-mid)",
            color: step >= 4 ? "transparent" : "var(--color-text-muted)",
            border: "1px solid var(--color-surface-border)",
            pointerEvents: step >= 4 ? "none" : "auto",
          }}
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-text">Criar conta</h1>
        <div className="w-10" />
      </header>

      {/* Progress Bar */}
      <div className="flex px-6 pt-6">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex flex-1 items-center">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
              style={
                step >= s
                  ? { background: "var(--color-ember)", color: "#fff", boxShadow: "var(--shadow-ember)" }
                  : { background: "var(--color-surface-mid)", color: "var(--color-text-dim)", border: "1px solid var(--color-surface-border)" }
              }
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < TOTAL_STEPS && (
              <div
                className="h-0.5 flex-1 transition-all duration-300"
                style={{ background: step > s ? "var(--color-ember)" : "var(--color-surface-border)" }}
              />
            )}
          </div>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto px-6 pt-8">
        <div className="mx-auto max-w-md pb-32">
          {error && (
            <div className="mb-6 animate-fade-up rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-up">
              <StepHeader icon={<User className="h-5 w-5" />} title="Dados pessoais" subtitle="Comece sua jornada" />

              <DarkInput label="Nome completo" name="nome" value={formData.nome} onChange={handleChange} placeholder="Como deseja ser chamado?" />
              <DarkInput label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" />
              <DarkInput label="Telefone (WhatsApp)" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
              <DarkInput label="Senha" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 8 caracteres" />

            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-up">
              <StepHeader icon={<Activity className="h-5 w-5" />} title="Seu tratamento" subtitle="Personalize seu acompanhamento" />

              <DarkInput label="Início do tratamento" name="data_inicio_tratamento" type="date" value={formData.data_inicio_tratamento} onChange={handleChange} />

              <div>
                <label className="mb-2 block text-sm font-bold text-text">Dose atual (mg)</label>
                <div className="grid grid-cols-3 gap-2">
                  {DOSES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ ...formData, dose_atual_mg: d })}
                      className="rounded-xl py-3 text-sm font-bold transition-all duration-200"
                      style={
                        formData.dose_atual_mg === d
                          ? { background: "var(--color-ember)", color: "#fff", boxShadow: "var(--shadow-ember)", transform: "scale(1.02)" }
                          : { background: "var(--color-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-surface-border)" }
                      }
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DarkInput label="Altura (cm)" name="altura_cm" type="number" value={formData.altura_cm} onChange={handleChange} placeholder="Ex: 175" />
                <DarkInput label="Peso inicial (kg)" name="peso_inicial" type="number" value={formData.peso_inicial} onChange={handleChange} placeholder="Ex: 95.5" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-up">
              <StepHeader icon={<Target className="h-5 w-5" />} title="Metas e rotina" subtitle="Onde você quer chegar?" />
              <DarkInput label="Peso meta (opcional)" name="peso_meta" type="number" value={formData.peso_meta} onChange={handleChange} placeholder="Ex: 70.0" />

              <div>
                <label className="mb-2 block text-sm font-bold text-text">Dia da aplicação</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, dia_aplicacao: String(d.id) })}
                      className="min-w-[60px] flex-1 rounded-full py-2.5 text-xs font-bold transition-all duration-200"
                      style={
                        formData.dia_aplicacao === String(d.id)
                          ? { background: "var(--color-ember)", color: "#fff", boxShadow: "var(--shadow-ember)", transform: "scale(1.05)" }
                          : { background: "var(--color-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-surface-border)" }
                      }
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-text-dim">Enviaremos lembretes neste dia para você não esquecer a dose.</p>
              </div>
            </div>
          )}

          {step === 4 && emailPendente && (
            <div className="space-y-5 animate-fade-up">
              <StepHeader icon={<Mail className="h-5 w-5" />} title="Confirme seu e-mail" subtitle="Um link foi enviado para você" />
              <div
                className="rounded-[24px] p-6 space-y-4 text-center"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
              >
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: "var(--color-ember-glow)", color: "var(--color-ember)" }}
                >
                  <MailCheck className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  Enviamos um link de confirmação para{' '}
                  <span className="font-bold" style={{ color: "var(--color-text)" }}>{formData.email}</span>.
                  Clique no link para ativar sua conta e continuar.
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                  Não encontrou? Verifique a pasta de spam.
                </p>
              </div>

            </div>
          )}

          {step === 4 && !emailPendente && (
            <div className="space-y-5 animate-fade-up">
              <StepHeader icon={<Smartphone className="h-5 w-5" />} title="Instale o app" subtitle="Adicione o Momo à tela inicial" />

              {isMobile ? (
                <div
                  className="rounded-[24px] p-5 space-y-5"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
                >
                  <p className="text-sm font-medium text-center" style={{ color: "var(--color-text-muted)" }}>
                    O Momo funciona direto no navegador — sem App Store.
                  </p>

                  {/* iOS */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🍎</span>
                      <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>iPhone (Safari)</p>
                    </div>
                    <div className="space-y-2 ml-6">
                      {[
                        { icon: <Share2 size={14} />, text: 'Toque no botão Compartilhar (ícone de caixa com seta)' },
                        { icon: <Plus size={14} />, text: 'Role e toque em "Adicionar à Tela de Início"' },
                        { icon: <Check size={14} />, text: 'Toque em "Adicionar" — pronto!' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "var(--color-surface-mid)", border: "1px solid var(--color-surface-border)" }}>
                          <span className="mt-0.5 shrink-0" style={{ color: "var(--color-ember)" }}>{item.icon}</span>
                          <p className="text-xs font-medium leading-snug" style={{ color: "var(--color-text)" }}>{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Android */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🤖</span>
                      <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Android (Chrome)</p>
                    </div>
                    <div className="space-y-2 ml-6">
                      {[
                        { icon: <MoreVertical size={14} />, text: 'Toque no menu (3 pontinhos) no canto superior direito' },
                        { icon: <Plus size={14} />, text: 'Toque em "Adicionar à tela inicial"' },
                        { icon: <Check size={14} />, text: 'Confirme tocando em "Adicionar" — pronto!' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "var(--color-surface-mid)", border: "1px solid var(--color-surface-border)" }}>
                          <span className="mt-0.5 shrink-0" style={{ color: "var(--color-ember)" }}>{item.icon}</span>
                          <p className="text-xs font-medium leading-snug" style={{ color: "var(--color-text)" }}>{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-[24px] p-6 text-center space-y-3"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
                >
                  <Smartphone className="mx-auto h-10 w-10" style={{ color: "var(--color-ember)" }} />
                  <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                    Para instalar o Momo como app, abra este site no seu celular e siga as instruções.
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                    No computador, você pode usar normalmente pelo navegador.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <footer
        className="fixed bottom-0 left-0 right-0 z-40 px-6 pt-6"
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-surface-border)",
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
        }}
      >
        <div className="mx-auto max-w-md">
          {step < 3 && (
            <button
              onClick={nextStep}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-bold text-white shadow-lg transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))", boxShadow: "var(--shadow-ember)" }}
            >
              Próximo
              <ArrowRight className="h-5 w-5" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={nextStep}
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))", boxShadow: "var(--shadow-ember)" }}
            >
              {loading ? 'Criando conta...' : 'Próximo'}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </button>
          )}

          {step === 4 && emailPendente && (
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-bold text-white shadow-lg transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))", boxShadow: "var(--shadow-ember)" }}
              >
                <MailCheck className="h-5 w-5" />
                Já confirmei, ir para login
              </button>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.resend({ type: 'signup', email: formData.email, options: { emailRedirectTo: `${window.location.origin}/login` } });
                  toast.success('E-mail reenviado!');
                }}
                className="flex h-12 w-full items-center justify-center rounded-full text-sm font-bold transition-all active:scale-95"
                style={{ background: "transparent", border: "1px solid var(--color-surface-border)", color: "var(--color-text-dim)" }}
              >
                Reenviar e-mail de confirmação
              </button>
            </div>
          )}

          {step === 4 && !emailPendente && (
            <button
              onClick={() => router.push('/')}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-bold text-white shadow-lg transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))", boxShadow: "var(--shadow-ember)" }}
            >
              Já adicionei, continuar
              <ArrowRight className="h-5 w-5" />
            </button>
          )}

        </div>
        <p className="mt-4 text-center text-sm text-text-dim">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-bold hover:underline" style={{ color: "var(--color-ember)" }}>
            Entrar
          </Link>
        </p>
      </footer>
    </div>
  );
}

function StepHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: "var(--color-ember-glow)", color: "var(--color-ember)", border: "1px solid var(--color-ember-glow-strong)" }}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold text-text">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function DarkInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-text">{label}</label>
      <input
        {...props}
        className="block h-12 w-full rounded-xl px-4 text-sm text-text outline-none transition-all"
        style={{ background: "var(--color-surface-mid)", border: "1px solid var(--color-surface-border)" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-ember)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-ember-glow)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-surface-border)"; e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
}
