import { createServerClient } from "@/lib/supabase-server";
import { MeusPedidosClient } from "./MeusPedidosClient";
import { redirect } from "next/navigation";

export default async function MeusPedidosPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select(`
      *,
      fornecedor:fornecedores(razao_social, nome_fantasia, logo_url),
      produto:fornecedor_produtos(tipo_produto, dose_mg, unidades_por_caixa)
    `)
    .eq("paciente_id", session.user.id)
    .order("created_at", { ascending: false });

  return (
    <MeusPedidosClient 
      initialPedidos={pedidos || []} 
    />
  );
}
