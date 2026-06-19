import { redirect } from "next/navigation";
import { createServerClient, createServiceClient } from "@/lib/supabase-server";
import { AdminFinanceiroClient } from "@/components/AdminFinanceiroClient";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";
const ADMIN_EMAIL = "ryan@gmail.com";

export default async function AdminFinanceiroPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.email !== ADMIN_EMAIL) redirect("/login");

  const admin = createServiceClient();

  const [
    { count: premiumCount },
    { data: assinaturasAtivas },
    { data: todasAssinaturas },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("plano_ativo", "premium"),
    admin
      .from("assinaturas")
      .select("user_id, status, current_period_end, criado_em, profiles!user_id(nome, email)")
      .eq("status", "ativa")
      .order("criado_em", { ascending: false }),
    admin.from("assinaturas").select("status, criado_em").order("criado_em", { ascending: true }),
  ]);

  const mrrData: { mes: string; mrr: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const mesDate = subMonths(new Date(), i);
    const inicio = startOfMonth(mesDate).toISOString();
    const fim = endOfMonth(mesDate).toISOString();
    const count = (todasAssinaturas || []).filter(
      (a) => a.status === "ativa" && a.criado_em >= inicio && a.criado_em <= fim
    ).length;
    mrrData.push({ mes: format(mesDate, "MMM/yy"), mrr: count * 29.9 });
  }

  const mesPassadoInicio = startOfMonth(subMonths(new Date(), 1)).toISOString();
  const mesPassadoFim = endOfMonth(subMonths(new Date(), 1)).toISOString();
  const canceladasMesPassado = (todasAssinaturas || []).filter(
    (a) => a.status === "cancelada" && a.criado_em >= mesPassadoInicio && a.criado_em <= mesPassadoFim
  ).length;
  const totalMesPassado = (todasAssinaturas || []).filter(
    (a) => a.criado_em >= mesPassadoInicio && a.criado_em <= mesPassadoFim
  ).length;
  const churnRate = totalMesPassado > 0 ? ((canceladasMesPassado / totalMesPassado) * 100).toFixed(1) : "0.0";

  return (
    <AdminFinanceiroClient
      premiumCount={premiumCount || 0}
      assinaturasAtivas={(assinaturasAtivas || []) as any[]}
      mrrData={mrrData}
      churnRate={churnRate}
      totalAssinaturas={(todasAssinaturas || []).length}
    />
  );
}
