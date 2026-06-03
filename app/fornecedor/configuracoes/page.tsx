import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ConfigFornecedorClient } from "./ConfigFornecedorClient";

export default async function ConfigFornecedorPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: fornecedor } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  if (!fornecedor) redirect("/fornecedor/cadastro");

  return <ConfigFornecedorClient initial={fornecedor} />;
}
