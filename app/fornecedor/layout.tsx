import type { Viewport } from "next";
import { createServerClient } from "@/lib/supabase-server";
import "./fornecedor.css";
import { SupplierBottomNav } from "@/components/SupplierBottomNav";

// Dark portal: status bar / theme-color should match the #0d0d0d background.
export const viewport: Viewport = {
  themeColor: "#0d0d0d",
};

export const dynamic = 'force-dynamic';

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
    <div data-portal="fornecedor" className="app-container min-h-screen bg-bg text-text transition-colors duration-300">
      <main className="mx-auto w-full max-w-lg px-6 pb-[100px] pt-8">
        {children}
      </main>
      <SupplierBottomNav />
    </div>
  );
}