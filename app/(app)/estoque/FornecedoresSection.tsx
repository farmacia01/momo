import { createServerClient } from "@/lib/supabase-server";
import { FornecedoresSectionClient } from "./FornecedoresSectionClient";

/**
 * "Comprar de fornecedores" — active suppliers that deliver to the patient's
 * state. Re-implemented as a thin server wrapper for a high-fidelity client section.
 */
export async function FornecedoresSection({ userId }: { userId: string }) {
  const supabase = createServerClient();

  // 1. Get patient's state for region filtering
  const { data: profile } = await supabase
    .from("profiles")
    .select("estado")
    .eq("id", userId)
    .single();

  const estado = profile?.estado || null;

  // 2. Fetch suppliers with their minimum product price in a single efficient query
  const { data: fornecedores } = await supabase
    .rpc('get_active_suppliers_with_prices', { 
      p_estado: estado 
    });

  // Fallback if RPC is not available or fails (initial dev setup)
  let suppliersList = fornecedores || [];
  
  if (!fornecedores) {
    const { data: simpleFornecedores } = await supabase
      .from("fornecedores")
      .select(`
        *,
        produtos:fornecedor_produtos(preco)
      `)
      .eq("status", "ativo")
      .order("avaliacao_media", { ascending: false });
    
    suppliersList = (simpleFornecedores || []).map(f => ({
      ...f,
      preco_minimo: f.produtos?.length > 0 
        ? Math.min(...f.produtos.map((p: any) => p.preco)) 
        : null
    }));
  }

  return (
    <section className="mt-8">
      <FornecedoresSectionClient 
        fornecedores={suppliersList} 
        estado={estado} 
      />
    </section>
  );
}
