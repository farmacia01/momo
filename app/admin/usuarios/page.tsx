import { redirect } from "next/navigation";
import { createServerClient, createServiceClient } from "@/lib/supabase-server";
import { AdminUsuariosClient } from "@/components/AdminUsuariosClient";

export const dynamic = "force-dynamic";
const ADMIN_EMAIL = "evolinkbr@gmail.com";

export default async function AdminUsuariosPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.email !== ADMIN_EMAIL) redirect("/login");

  const admin = createServiceClient();

  const [{ data: usuarios }, { data: ultimasDoses }, { data: fornecedores }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, nome, email, plano_ativo, trial_expira_em, assinatura_expira_em, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("doses")
      .select("user_id, data_aplicacao")
      .order("data_aplicacao", { ascending: false }),
    admin
      .from("fornecedores")
      .select("user_id"),
  ]);

  const doseMap = new Map<string, string>();
  for (const d of ultimasDoses || []) {
    if (!doseMap.has(d.user_id)) doseMap.set(d.user_id, d.data_aplicacao);
  }

  const supplierIds = new Set((fornecedores || []).map(f => f.user_id));

  const usuariosComDose = (usuarios || []).map((u) => ({
    ...u,
    ultima_dose: doseMap.get(u.id) || null,
    is_fornecedor: supplierIds.has(u.id),
  }));

  return <AdminUsuariosClient usuarios={usuariosComDose} />;
}
