import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { FornecedorClient } from "./FornecedorClient";
import type {
  Fornecedor,
  FornecedorProduto,
  Avaliacao,
} from "@/lib/fornecedores";

export const dynamic = "force-dynamic";

export default async function FornecedorPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: fornecedor } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("id", params.id)
    .eq("status", "ativo")
    .single();

  if (!fornecedor) notFound();

  const [{ data: produtos }, { data: avaliacoes }, { data: profile }] =
    await Promise.all([
      supabase
        .from("fornecedor_produtos")
        .select("*")
        .eq("fornecedor_id", params.id)
        .eq("ativo", true)
        .order("dose_mg", { ascending: true }),
      supabase
        .from("avaliacoes_fornecedor")
        .select("*")
        .eq("fornecedor_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select(
          "nome, cep, logradouro, numero, complemento, bairro, cidade, estado",
        )
        .eq("id", session.user.id)
        .single(),
    ]);

  return (
    <FornecedorClient
      userId={session.user.id}
      fornecedor={fornecedor as Fornecedor}
      produtos={(produtos ?? []) as FornecedorProduto[]}
      avaliacoes={(avaliacoes ?? []) as Avaliacao[]}
      profile={profile ?? {}}
    />
  );
}
