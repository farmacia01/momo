import { createServerClient } from "@/lib/supabase-server";
import "./fornecedor.css";
import { SupplierBottomNav } from "@/components/SupplierBottomNav";

export default async function FornecedorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  let fornecedorNome = "Painel Fornecedor";
  let status = "pendente";

  if (session) {
    const { data: fornecedor } = await supabase
      .from('fornecedores')
      .select('nome_fantasia, razao_social, status')
      .eq('user_id', session.user.id)
      .single();
      
    if (fornecedor) {
      fornecedorNome = fornecedor.nome_fantasia || fornecedor.razao_social;
      status = fornecedor.status;
    }
  }

  return (
    <div data-portal="fornecedor" className="min-h-screen bg-[#0d0d0d] text-white">
      <main className="mx-auto w-full max-w-lg px-6 pb-[100px] pt-8">
        {children}
      </main>
      <SupplierBottomNav />
    </div>
  );
}