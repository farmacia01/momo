import { createServerClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import { ProdutoDetalheClient } from "./ProdutoDetalheClient";

export default async function ProdutoPage({
  params,
}: {
  params: { id: string; prodId: string };
}) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch product and supplier in one go
  const { data: produto } = await supabase
    .from("fornecedor_produtos")
    .select("*, fornecedores(*)")
    .eq("id", params.prodId)
    .single();

  if (!produto || !produto.fornecedores) {
    notFound();
  }

  // Fetch reviews for the product
  const { data: avaliacoes } = await supabase
    .from("avaliacoes_produto")
    .select(`
      *,
      profiles (
        nome
      )
    `)
    .eq("produto_id", params.prodId)
    .order("criado_em", { ascending: false });

  // Fetch patient profile for default address
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return (
    <ProdutoDetalheClient
      userId={session.user.id}
      produto={produto}
      fornecedor={produto.fornecedores}
      avaliacoes={avaliacoes || []}
      initialProfile={profile}
    />
  );
}
