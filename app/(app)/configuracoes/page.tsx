import { createServerClient } from "@/lib/supabase-server";
import { ConfiguracoesClient } from "./ConfiguracoesClient";
import { redirect } from "next/navigation";

export default async function ConfiguracoesPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nome, cep, logradouro, numero, complemento, bairro, cidade, estado")
    .eq("id", session.user.id)
    .single();

  const initialProfile = profile ?? {
    id: session.user.id,
    nome: null,
    cep: null,
    logradouro: null,
    numero: null,
    complemento: null,
    bairro: null,
    cidade: null,
    estado: null,
  };

  return (
    <ConfiguracoesClient initialProfile={initialProfile} />
  );
}
