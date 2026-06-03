import { createServerClient } from "@/lib/supabase-server";
import { DetalhePedidoClient } from "./DetalhePedidoClient";
import { notFound, redirect } from "next/navigation";

export default async function DetalhePedidoPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: pedido } = await supabase
    .from("pedidos")
    .select(`
      *,
      fornecedor:fornecedores(*),
      produto:fornecedor_produtos(*)
    `)
    .eq("id", params.id)
    .eq("paciente_id", session.user.id)
    .single();

  if (!pedido) {
    notFound();
  }

  return (
    <DetalhePedidoClient 
      pedido={pedido} 
    />
  );
}
