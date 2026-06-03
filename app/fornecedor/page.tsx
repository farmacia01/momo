import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SupplierDashboardClient } from "@/components/SupplierDashboardClient";

export default async function FornecedorDashboardPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: fornecedor } = await supabase
    .from("fornecedores")
    .select("id, nome_fantasia, razao_social, status")
    .eq("user_id", session.user.id)
    .single();

  if (!fornecedor) redirect("/fornecedor/cadastro");
  if (fornecedor.status !== "ativo") redirect("/fornecedor/aguardando");

  const [{ data: pedidos }, { count: produtosCount }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*, produto:fornecedor_produtos(tipo_produto, dose_mg)")
      .eq("fornecedor_id", fornecedor.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("fornecedor_produtos")
      .select("id", { count: "exact", head: true })
      .eq("fornecedor_id", fornecedor.id),
  ]);

  const lista = pedidos || [];
  const novos = lista.filter((p) => p.status === "novo").length;
  const faturamento = lista
    .filter((p) => p.status === "entregue")
    .reduce((acc, p) => acc + Number(p.preco_total || 0), 0);

  const stats = {
    novos,
    total: lista.length,
    produtos: produtosCount || 0,
    faturamento
  };

  return (
    <SupplierDashboardClient 
      userId={session.user.id}
      fornecedor={fornecedor}
      stats={stats}
      recentes={lista.slice(0, 5)}
    />
  );
}
