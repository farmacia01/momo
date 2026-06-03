import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { DetalhePedidoClient } from "./DetalhePedidoClient";

export default async function DetalhePedidoPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // Buscar pedido
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("*, produto:fornecedor_produtos(tipo_produto, dose_mg), fornecedor:fornecedores(user_id)")
    .eq("id", params.id)
    .single();

  if (error || !pedido) redirect("/fornecedor/pedidos");

  // Verificar se o usuário é o fornecedor do pedido ou o paciente
  const isPaciente = pedido.paciente_id === session.user.id;
  const isFornecedor = pedido.fornecedor.user_id === session.user.id;

  if (!isPaciente && !isFornecedor) {
    redirect("/");
  }

  return <DetalhePedidoClient initialPedido={pedido} isFornecedor={isFornecedor} />;
}
