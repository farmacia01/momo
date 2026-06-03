"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Store, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function FornecedorCadastroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    tipo: "farmacia",
    endereco_cidade: "",
    endereco_estado: "",
    prazo_entrega_dias: "",
  });
  const [regioes, setRegioes] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleRegiao = (uf: string) => {
    setRegioes((prev) => (prev.includes(uf) ? prev.filter((r) => r !== uf) : [...prev, uf]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.razao_social || !form.cnpj) {
      toast.error("Preencha a razão social e o CNPJ.");
      return;
    }
    if (form.endereco_estado && form.endereco_estado.length !== 2) {
      toast.error("UF deve ter 2 letras.");
      return;
    }
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("fornecedores").insert({
      user_id: session.user.id,
      razao_social: form.razao_social,
      nome_fantasia: form.nome_fantasia || null,
      cnpj: form.cnpj,
      tipo: form.tipo,
      endereco_cidade: form.endereco_cidade || null,
      endereco_estado: form.endereco_estado ? form.endereco_estado.toUpperCase() : null,
      regioes_entrega: regioes.length ? regioes : null,
      prazo_entrega_dias: form.prazo_entrega_dias ? Number(form.prazo_entrega_dias) : null,
      status: "pendente",
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Cadastro enviado! Aguarde a aprovação.");
    router.push("/fornecedor/aguardando");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 px-6 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-forest shrink-0">
            <Store size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Torne-se um Fornecedor</h1>
            <p className="text-sm text-slate-500">Complete os dados da sua empresa para começar a vender.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Razão Social" name="razao_social" value={form.razao_social} onChange={handleChange} placeholder="Nome jurídico da empresa" />
          <Input label="Nome Fantasia" name="nome_fantasia" value={form.nome_fantasia} onChange={handleChange} placeholder="Como o cliente te vê" />
          <Input label="CNPJ" name="cnpj" value={form.cnpj} onChange={handleChange} placeholder="00.000.000/0001-00" />

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">Tipo de Negócio</label>
            <div className="grid grid-cols-3 gap-2">
              {["farmacia", "distribuidor", "fabricante"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, tipo: t })}
                  className={`rounded-xl py-3 text-xs font-bold capitalize transition-all ${
                    form.tipo === t ? "bg-forest text-white shadow-md" : "bg-white border border-slate-100 text-slate-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Cidade" name="endereco_cidade" value={form.endereco_cidade} onChange={handleChange} placeholder="Ex: São Paulo" />
            <Input label="UF" name="endereco_estado" value={form.endereco_estado} onChange={handleChange} placeholder="SP" maxLength={2} />
          </div>

          <Input label="Prazo médio de entrega (dias)" name="prazo_entrega_dias" type="number" value={form.prazo_entrega_dias} onChange={handleChange} placeholder="Ex: 3" />

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">Regiões de entrega (UFs atendidas)</label>
            <div className="flex flex-wrap gap-2">
              {UFS.map((uf) => (
                <button
                  key={uf}
                  type="button"
                  onClick={() => toggleRegiao(uf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    regioes.includes(uf) ? "bg-forest text-white" : "bg-white border border-slate-100 text-slate-500"
                  }`}
                >
                  {uf}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Para garantir a segurança dos pacientes, novos fornecedores passam por uma análise documental manual antes de aparecerem na busca.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-forest text-base font-bold text-white shadow-lg active:scale-95 disabled:opacity-70"
          >
            {loading ? <LoadingSpinner size="sm" /> : "Enviar cadastro"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-700 ml-1">{label}</label>
      <input
        {...props}
        className="block h-12 w-full rounded-2xl border-none bg-white px-4 text-sm shadow-sm transition-all focus:ring-2 focus:ring-forest focus:outline-none"
      />
    </div>
  );
}
