import { redirect } from "next/navigation";
import { createServerClient, createServiceClient } from "@/lib/supabase-server";
import { AdminPedidosClient } from "@/components/AdminPedidosClient";

export const dynamic = "force-dynamic";
const ADMIN_EMAIL = "evolinkbr@gmail.com";

export default async function AdminPedidosPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.email !== ADMIN_EMAIL) redirect("/login");

  const admin = createServiceClient();

  const { data: raw } = await admin
    .from("pedidos")
    .select(`
      id, codigo, status, preco_total, cancelamento_motivo,
      observacoes_paciente, observacoes_fornecedor, created_at,
      paciente:profiles!paciente_id(nome, email),
      fornecedor:fornecedores!fornecedor_id(nome_fantasia, razao_social, email_contato),
      produto:fornecedor_produtos!produto_id(tipo_produto, dose_mg)
    `)
    .order("created_at", { ascending: false });

  // Supabase returns joins as arrays; unbox to first element
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pedidos = (raw || []).map((p: any) => ({
    ...p,
    paciente: Array.isArray(p.paciente) ? (p.paciente[0] ?? null) : (p.paciente ?? null),
    fornecedor: Array.isArray(p.fornecedor) ? (p.fornecedor[0] ?? null) : (p.fornecedor ?? null),
    produto: Array.isArray(p.produto) ? (p.produto[0] ?? null) : (p.produto ?? null),
  }));

  return <AdminPedidosClient pedidos={pedidos} />;
}
