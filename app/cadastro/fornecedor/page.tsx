"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ArrowRight, Check, Store, ShieldCheck, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';

export default function CadastroFornecedorPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    email: '',
    password: '',
    tipo: 'farmacia', // farmacia, distribuidor
    endereco_cidade: '',
    endereco_estado: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    if (step === 1 && (!formData.razao_social || !formData.cnpj || !formData.email || !formData.password)) {
      toast.error('Preencha os dados da empresa');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Sign up user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nome: formData.nome_fantasia || formData.razao_social,
          is_fornecedor: true,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Create supplier profile
      const { error: supplierError } = await supabase
        .from('fornecedores')
        .insert({
          user_id: authData.user.id,
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia,
          cnpj: formData.cnpj,
          tipo: formData.tipo,
          endereco_cidade: formData.endereco_cidade,
          endereco_estado: formData.endereco_estado,
          status: 'pendente' // Needs approval
        });

      if (supplierError) {
        setError(supplierError.message);
        setLoading(false);
      } else {
        toast.success('Cadastro realizado! Aguarde a aprovação.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.push('/login')} className="rounded-full p-2 text-gray-400 hover:bg-gray-50">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Seja um Fornecedor</h1>
        <div className="w-10" />
      </header>

      {/* Progress */}
      <div className="flex px-6 pt-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex flex-1 items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
              step >= s ? 'bg-forest text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 2 && <div className={`h-1 flex-1 ${step > s ? 'bg-forest' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <main className="flex-1 px-6 pt-8 overflow-y-auto">
        <div className="mx-auto max-w-md pb-32">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 animate-fade-up">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-up">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-forest shrink-0">
                  <Store size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Dados da Empresa</h2>
                  <p className="text-sm text-gray-500">Comece a vender Mounjaro na plataforma</p>
                </div>
              </div>

              <Input label="Razão Social" name="razao_social" value={formData.razao_social} onChange={handleChange} placeholder="Nome jurídico da empresa" />
              <Input label="Nome Fantasia" name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} placeholder="Como o cliente te vê" />
              <Input label="CNPJ" name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="00.000.000/0001-00" />
              <Input label="E-mail de Acesso" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" />
              <Input label="Senha" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-up">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-forest shrink-0">
                  <MapPin size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Localização e Tipo</h2>
                  <p className="text-sm text-gray-500">Onde sua empresa está baseada?</p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Tipo de Negócio</label>
                <div className="grid grid-cols-2 gap-2">
                  {['farmacia', 'distribuidor'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo: t })}
                      className={`rounded-xl py-4 text-sm font-bold capitalize transition-all ${
                        formData.tipo === t 
                          ? 'bg-forest text-white shadow-md' 
                          : 'bg-white border border-gray-100 text-gray-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Cidade" name="endereco_cidade" value={formData.endereco_cidade} onChange={handleChange} placeholder="Ex: São Paulo" />
                <Input label="UF" name="endereco_estado" value={formData.endereco_estado} onChange={handleChange} placeholder="SP" maxLength={2} />
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Para garantir a segurança dos pacientes, novos fornecedores passam por uma análise documental manual antes de aparecerem na busca.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white p-6 shadow-premium">
        <div className="mx-auto max-w-md">
          {step < 2 ? (
            <button
              onClick={nextStep}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-forest text-base font-bold text-white shadow-lg active:scale-95"
            >
              Próximo
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-forest text-base font-bold text-white shadow-lg active:scale-95 disabled:opacity-70"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Finalizar Cadastro'}
              {!loading && <Check className="h-5 w-5" />}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-gray-700 uppercase tracking-widest text-[10px] ml-1">{label}</label>
      <input
        {...props}
        className="block h-12 w-full rounded-2xl border-none bg-white px-4 text-sm shadow-sm transition-all focus:ring-2 focus:ring-forest focus:outline-none"
      />
    </div>
  );
}
