import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { FornecedoresSectionClient } from "@/app/(app)/estoque/FornecedoresSectionClient";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function FornecedoresPage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  // 1. Get patient's location for region filtering
  const { data: profile } = await supabase
    .from("profiles")
    .select("cidade, estado")
    .eq("id", session.user.id)
    .single();

  const cidade = profile?.cidade || null;
  const estado = profile?.estado || null;

  // 2. Fetch suppliers with their minimum product price
  const { data: fornecedores } = await supabase.rpc(
    "get_active_suppliers_with_prices",
    {
      p_cidade: cidade,
      p_estado: estado,
    }
  );

  // Fallback if RPC is not available or fails
  let suppliersList = fornecedores || [];

  if (!fornecedores) {
    const { data: simpleFornecedores } = await supabase
      .from("fornecedores")
      .select(
        `
        *,
        produtos:fornecedor_produtos(preco)
      `
      )
      .eq("status", "ativo")
      .order("avaliacao_media", { ascending: false });

    suppliersList = (simpleFornecedores || []).map((f: any) => ({
      ...f,
      preco_minimo:
        f.produtos?.length > 0
          ? Math.min(...f.produtos.map((p: any) => p.preco))
          : null,
    }));
  }

  return (
    <div className="space-y-6 pb-32">
      <PageHeader title="Fornecedores" />
      <FornecedoresSectionClient
        fornecedores={suppliersList}
        cidade={cidade}
        estado={estado}
      />
    </div>
  );
}
