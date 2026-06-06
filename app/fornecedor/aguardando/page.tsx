import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Clock, ShieldCheck, Mail } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

export const dynamic = 'force-dynamic';

export default async function AguardandoPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: fornecedor } = await supabase
    .from("fornecedores")
    .select("nome_fantasia, razao_social, status")
    .eq("user_id", session.user.id)
    .single();

  if (!fornecedor) redirect("/fornecedor/cadastro");
  if (fornecedor.status === "ativo") redirect("/fornecedor");

  const suspenso = fornecedor.status === "suspenso";
  const nome = fornecedor.nome_fantasia || fornecedor.razao_social;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d0d] text-white px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl ${
            suspenso ? "bg-[#f87171]/10 text-[#f87171]" : "bg-[#fbbf24]/10 text-[#fbbf24]"
          }`}
        >
          <Clock size={40} strokeWidth={2.5} />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">
          {suspenso ? "Conta suspensa" : "Cadastro em análise"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[rgba(255,255,255,0.4)]">
          {suspenso ? (
            <>
              A conta de <strong className="text-white">{nome}</strong> está temporariamente suspensa. Entre em contato com o suporte para
              regularizar sua situação.
            </>
          ) : (
            <>
              Recebemos o cadastro de <strong className="text-white">{nome}</strong>. Para garantir a segurança dos pacientes, novos
              fornecedores passam por uma análise documental manual antes de aparecerem na busca.
            </>
          )}
        </p>

        <div className="mt-8 space-y-3 text-left">
          <div className="flex items-start gap-3 rounded-2xl bg-[#111111] border border-[rgba(255,255,255,0.07)] p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#4ade80]" />
            <p className="text-xs leading-relaxed text-[rgba(255,255,255,0.6)]">
              Verificamos os dados da empresa (CNPJ, documentação e regiões de entrega).
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-[#111111] border border-[rgba(255,255,255,0.07)] p-4">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#4ade80]" />
            <p className="text-xs leading-relaxed text-[rgba(255,255,255,0.6)]">
              Você receberá um e-mail assim que a análise for concluída.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
