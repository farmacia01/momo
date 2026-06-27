import { redirect } from "next/navigation";
import { createServerClient, createServiceClient } from "@/lib/supabase-server";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import {
  format,
  subDays,
  startOfMonth,
  subMonths,
  parseISO,
  startOfToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

function buildMonthlyChart(records: any[], dateField: string) {
  const map = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const label = format(subMonths(new Date(), i), "MMM", { locale: ptBR });
    map.set(label, 0);
  }
  for (const r of records) {
    try {
      const label = format(parseISO(r[dateField]), "MMM", { locale: ptBR });
      if (map.has(label)) map.set(label, (map.get(label) || 0) + 1);
    } catch {}
  }
  return Array.from(map.entries()).map(([date, value]) => ({ date, value }));
}

export default async function AdminDashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) redirect("/login");

  const admin = createServiceClient();
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const fifteenDaysAgo = subDays(now, 15);
  const sevenDaysAgo = subDays(now, 7);
  const today = startOfToday();
  const startCurrentMonth = startOfMonth(now);

  const [
    { data: rawProfiles },
    { data: rawInvites },
    { data: rawMedicoes },
    { data: rawDoses },
  ] = await Promise.all([
    admin.from("profiles").select("id, created_at, nome, email"),
    admin.from("referral_invites").select("referrer_id, invited_id, criado_em"),
    admin.from("medicoes_saude").select("user_id, data_medicao"),
    admin.from("doses").select("user_id, data_aplicacao"),
  ]);

  const profiles = rawProfiles || [];
  const invites = rawInvites || [];
  const medicoes = rawMedicoes || [];
  const doses = rawDoses || [];

  // ── Users ──
  const totalUsers = profiles.length;
  const newThisMonth = profiles.filter(p => parseISO(p.created_at) >= startCurrentMonth).length;

  // ── Referral K-factor ──
  const kFactor = totalUsers > 0 ? +(invites.length / totalUsers).toFixed(2) : 0;

  // ── Gate metrics ──
  const oldProfiles = profiles.filter(p => parseISO(p.created_at) < sevenDaysAgo);
  const inviteCountByUser = new Map<string, number>();
  for (const inv of invites) {
    inviteCountByUser.set(inv.referrer_id, (inviteCountByUser.get(inv.referrer_id) || 0) + 1);
  }
  const gateCleared = oldProfiles.filter(p => (inviteCountByUser.get(p.id) || 0) >= 3).length;
  const gateAtRisk  = oldProfiles.filter(p => { const c = inviteCountByUser.get(p.id) || 0; return c >= 1 && c < 3; }).length;
  const gateBlocked = oldProfiles.filter(p => (inviteCountByUser.get(p.id) || 0) === 0).length;
  const gateNew     = totalUsers - oldProfiles.length;

  // ── Engagement ──
  const activeUsers30d = new Set([
    ...medicoes.filter(m => parseISO(m.data_medicao) >= thirtyDaysAgo).map(m => m.user_id),
    ...doses.filter(d => parseISO(d.data_aplicacao) >= thirtyDaysAgo).map(d => d.user_id),
  ]).size;
  const activeUsers7d = new Set([
    ...medicoes.filter(m => parseISO(m.data_medicao) >= sevenDaysAgo).map(m => m.user_id),
    ...doses.filter(d => parseISO(d.data_aplicacao) >= sevenDaysAgo).map(d => d.user_id),
  ]).size;
  const activeUsersToday = new Set([
    ...medicoes.filter(m => parseISO(m.data_medicao) >= today).map(m => m.user_id),
    ...doses.filter(d => parseISO(d.data_aplicacao) >= today).map(d => d.user_id),
  ]).size;

  // ── Charts ──
  const growthChart  = buildMonthlyChart(profiles, "created_at");
  const invitesChart = buildMonthlyChart(invites, "criado_em");

  // ── Gate donut ──
  const gateDistribution = [
    { name: "Liberados (≥3)", value: gateCleared },
    { name: "Em Risco (1-2)", value: gateAtRisk },
    { name: "Bloqueados",     value: gateBlocked },
    { name: "Novos (<7d)",    value: gateNew },
  ];

  // ── Alerts ──
  const alerts: { type: "warning" | "info" | "danger"; text: string }[] = [];
  if (gateBlocked > 0)   alerts.push({ type: "danger",  text: `${gateBlocked} usuário(s) bloqueados pelo gate — risco de abandono` });
  const activeRecent = new Set([
    ...medicoes.filter(m => parseISO(m.data_medicao) >= fifteenDaysAgo).map(m => m.user_id),
    ...doses.filter(d => parseISO(d.data_aplicacao) >= fifteenDaysAgo).map(d => d.user_id),
  ]);
  const inactiveCount = oldProfiles.filter(p => !activeRecent.has(p.id)).length;
  if (inactiveCount > 5) alerts.push({ type: "info", text: `${inactiveCount} usuários inativos há +15 dias` });

  // ── Recent users ──
  const recentUsers = [...profiles]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
    .map(p => ({
      id: p.id,
      nome: p.nome || "Sem nome",
      email: p.email || "",
      data: p.created_at,
      inviteCount: inviteCountByUser.get(p.id) || 0,
    }));

  return (
    <AdminDashboardClient
      metrics={{
        totalUsers,
        newThisMonth,
        kFactor,
        gateBlocked,
        gateCleared,
        gateAtRisk,
        totalReferralInvites: invites.length,
        activeUsers30d,
        activeUsers7d,
        activeUsersToday,
      }}
      growthChart={growthChart}
      invitesChart={invitesChart}
      gateDistribution={gateDistribution}
      recentUsers={recentUsers}
      alerts={alerts}
    />
  );
}
