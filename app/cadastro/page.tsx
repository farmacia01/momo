"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ArrowRight, Check, User, Activity, Target, Star, Bell, TrendingUp, Utensils, Package, BookOpen, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { AbacateCheckout } from '@/components/AbacateCheckout';

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

const BENEFICIOS = [
  { icon: <Bell size={15} />, text: 'Lembretes automáticos de dose' },
  { icon: <TrendingUp size={15} />, text: 'Gráficos de peso e progresso' },
  { icon: <Utensils size={15} />, text: 'Receitas para sua fase do tratamento' },
  { icon: <Package size={15} />, text: 'Alerta de estoque de ampolas' },
  { icon: <BookOpen size={15} />, text: 'Histórico completo para o médico' },
];

export default function CadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creatingRef = React.useRef(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
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

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nome: formData.nome,
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
      creatingRef.current = false;  // allow retry on error
      setError(signUpError.message);
      return false;
    }
    return true;
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!formData.nome || !formData.email || !formData.password) {
        toast.error('Preencha os dados básicos');
        return;
      }
      if (!formData.email.includes('@')) {
        toast.error('Digite um e-mail válido');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
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
            color: step === 4 ? "transparent" : "var(--color-text-muted)",
            border: "1px solid var(--color-surface-border)",
            pointerEvents: step === 4 ? "none" : "auto",
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
              <DarkInput label="Senha" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" />
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

          {step === 4 && (
            <div className="space-y-5 animate-fade-up">
              <StepHeader icon={<Star className="h-5 w-5" />} title="Seu plano" subtitle="7 dias grátis para começar" />

              <div
                className="space-y-5 rounded-[24px] p-6"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
              >
                {/* Header do plano */}
                <div
                  className="relative overflow-hidden rounded-2xl p-5"
                  style={{ background: "linear-gradient(135deg, #1a0800, #2d1200)", border: "1px solid rgba(255,101,0,0.2)" }}
                >
                  <div
                    className="absolute right-0 top-0 h-32 w-32 rounded-full opacity-10"
                    style={{ background: "#ff6500", filter: "blur(40px)", transform: "translate(20%, -20%)" }}
                  />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,101,0,0.8)" }}>
                      Momo Premium
                    </p>
                    <div className="mt-2 flex items-end gap-1">
                      <span className="text-3xl font-black text-white">R$ 29,90</span>
                      <span className="mb-1 text-sm font-medium text-white/50">/mês</span>
                    </div>
                    <p className="mt-1 text-sm font-bold" style={{ color: "rgba(255,101,0,0.9)" }}>
                      Cancele quando quiser
                    </p>
                  </div>
                </div>

                {/* Benefícios */}
                <div className="space-y-3">
                  {BENEFICIOS.map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: "rgba(255,101,0,0.1)", color: "#ff6500" }}
                      >
                        {b.icon}
                      </div>
                      <span className="text-sm font-medium text-text">{b.text}</span>
                    </div>
                  ))}
                </div>

                {/* Badge segurança */}
                <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-text-dim">
                  <ShieldCheck size={13} style={{ color: "#ff6500" }} />
                  Pagamento seguro · Cancele quando quiser
                </div>

                <AbacateCheckout />
              </div>
            </div>
          )}
        </div>
      </main>

      <footer
        className="fixed bottom-0 left-0 right-0 z-40 p-6"
        style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-surface-border)" }}
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

          {step === 4 && (
            <button
              onClick={() => router.push('/')}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-all active:scale-95"
              style={{
                background: "transparent",
                border: "1px solid var(--color-surface-border)",
                color: "var(--color-text-dim)",
              }}
            >
              Prefiro pular por agora
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
