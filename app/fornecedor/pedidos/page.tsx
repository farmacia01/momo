import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { PedidosFornecedorClient } from "./PedidosFornecedorClient";

export default async function PedidosFornecedorPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  // Verificar se o usuário é um fornecedor
  const { data: fornecedor } = await supabase
    .from('fornecedores')
    .select('id')
    .eq('user_id', session.user.id)
    .single();

  if (!fornecedor) {
    // Se não for fornecedor, redireciona para home
    redirect("/");
  }

  return <PedidosFornecedorClient fornecedorId={fornecedor.id} />;
}
