import { redirect, notFound } from "next/navigation";
import { createServerClient, createServiceClient } from "@/lib/supabase-server";
import { AdminUserDetailClient } from "@/components/AdminUserDetailClient";

export const dynamic = "force-dynamic";
const ADMIN_EMAIL = "ryan@gmail.com";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.email !== ADMIN_EMAIL) redirect("/login");

  const admin = createServiceClient();

  const [
    { data: usuario },
    { data: doses },
    { data: medicoes },
    { data: pedidos },
    { data: assinaturas },
    { data: avaliacoes },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", params.id).single(),
    admin.from("doses").select("*").eq("user_id", params.id).order("data_aplicacao", { ascending: false }).limit(10),
    admin.from("medicoes_saude").select("data_medicao, peso_kg, imc").eq("user_id", params.id).order("data_medicao", { ascending: false }).limit(30),
    admin.from("pedidos").select("id, codigo, status, preco_total, created_at").eq("paciente_id", params.id).order("created_at", { ascending: false }).limit(10),
    admin.from("assinaturas").select("status, criado_em, current_period_end").eq("user_id", params.id).order("criado_em", { ascending: false }),
    admin.from("avaliacoes_fornecedor").select("nota, comentario, created_at").eq("paciente_id", params.id).order("created_at", { ascending: false }).limit(5),
  ]);

  if (!usuario) notFound();

  return (
    <AdminUserDetailClient
      usuario={usuario}
      doses={doses || []}
      medicoes={medicoes || []}
      pedidos={pedidos || []}
      assinaturas={assinaturas || []}
      avaliacoes={avaliacoes || []}
    />
  );
}
