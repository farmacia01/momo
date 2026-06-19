import { redirect } from "next/navigation";
import { createServerClient, createServiceClient } from "@/lib/supabase-server";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import { 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  isSameMonth, 
  parseISO,
  differenceInDays,
  startOfToday
} from "date-fns";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

// --- Helpers ---

function buildMonthlyChartData(records: any[], dateField: string, valueField?: string) {
  const map = new Map<string, number>();
  // Last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = format(subMonths(new Date(), i), "MMM", { locale: require('date-fns/locale').ptBR });
    map.set(d, 0);
  }

  for (const r of records) {
    const d = format(parseISO(r[dateField]), "MMM", { locale: require('date-fns/locale').ptBR });
    if (map.has(d)) {
      const val = valueField ? parseFloat(r[valueField] || 0) : 1;
      map.set(d, (map.get(d) || 0) + val);
    }
  }
  return Array.from(map.entries()).map(([date, value]) => ({ date, value }));
}

function calculateChurn(activeStart: number, canceledDuring: number) {
  if (activeStart === 0) return 0;
  return (canceledDuring / activeStart) * 100;
}

export default async function AdminDashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/login");

  const admin = createServiceClient();
  const now = new Date();
  const startCurrentMonth = startOfMonth(now);
  const endCurrentMonth = endOfMonth(now);
  const startLastMonth = startOfMonth(subMonths(now, 1));
  const endLastMonth = endOfMonth(subMonths(now, 1));
  const thirtyDaysAgo = subDays(now, 30);
  const fifteenDaysAgo = subDays(now, 15);
  const sevenDaysAgo = subDays(now, 7);
  const today = startOfToday();

  // --- Fetch All Real Data ---
  const [
    { data: allProfiles },
    { data: allAssinaturas },
    { data: allMedicoes },
    { data: allDoses },
    { data: recentOrders },
    { data: activeFornecedores },
    { data: allSubscriptions }, // from push_subscriptions for usage metrics
  ] = await Promise.all([
    admin.from("profiles").select("id, created_at, plano_ativo, trial_expira_em, assinatura_expira_em, nome, email"),
    admin.from("assinaturas").select("status, criado_em, user_id, current_period_end"),
    admin.from("medicoes_saude").select("user_id, data_medicao"),
    admin.from("doses").select("user_id, data_aplicacao"),
    admin.from("pedidos").select("id, codigo, status, created_at").order("created_at", { ascending: false }).limit(5),
    admin.from("fornecedores").select("id, nome_fantasia, status, created_at"),
    admin.from("push_subscriptions").select("user_id, created_at"),
  ]);

  const profiles = allProfiles || [];
  const assinaturas = allAssinaturas || [];
  const medicoes = allMedicoes || [];
  const doses = allDoses || [];

  // --- 1. Core Metrics ---
  
  // MRR (Active Premium Subscriptions)
  const activePremium = assinaturas.filter(s => s.status === 'ativa');
  const mrr = activePremium.length * 29.9;
  
  // Growth & Churn
  const newThisMonth = profiles.filter(p => parseISO(p.created_at) >= startCurrentMonth).length;
  const newLastMonth = profiles.filter(p => {
    const d = parseISO(p.created_at);
    return d >= startLastMonth && d <= endLastMonth;
  }).length;

  const canceledThisMonth = assinaturas.filter(s => 
    (s.status === 'cancelada' || s.status === 'expirada') && 
    s.criado_em && parseISO(s.criado_em) >= startCurrentMonth
  ).length;

  const activeStartOfMonth = profiles.filter(p => 
    parseISO(p.created_at) < startCurrentMonth && 
    (p.plano_ativo === 'premium' || p.plano_ativo === 'trial')
  ).length;

  const churnRate = calculateChurn(activeStartOfMonth, canceledThisMonth);

  // Conversion (Trial -> Premium)
  const totalTrials = profiles.filter(p => p.plano_ativo === 'trial' || p.plano_ativo === 'premium' || p.plano_ativo === 'expirado').length;
  const totalConverted = profiles.filter(p => p.plano_ativo === 'premium').length;
  const conversionRate = totalTrials > 0 ? (totalConverted / totalTrials) * 100 : 0;

  const ticketMedio = activePremium.length > 0 ? mrr / activePremium.length : 0;

  // --- 2. Usage Metrics (Based on activity logs: medicoes/doses) ---
  const activeUsers30d = new Set([
    ...medicoes.filter(m => parseISO(m.data_medicao) >= thirtyDaysAgo).map(m => m.user_id),
    ...doses.filter(d => parseISO(d.data_aplicacao) >= thirtyDaysAgo).map(d => d.user_id)
  ]).size;

  const activeUsers7d = new Set([
    ...medicoes.filter(m => parseISO(m.data_medicao) >= sevenDaysAgo).map(m => m.user_id),
    ...doses.filter(d => parseISO(d.data_aplicacao) >= sevenDaysAgo).map(d => d.user_id)
  ]).size;

  const activeUsersToday = new Set([
    ...medicoes.filter(m => parseISO(m.data_medicao) >= today).map(m => m.user_id),
    ...doses.filter(d => parseISO(d.data_aplicacao) >= today).map(d => d.user_id)
  ]).size;

  // --- 3. Chart Data ---
  const revenueChart = buildMonthlyChartData(activePremium.map(s => ({ ...s, valor: 29.9 })), "criado_em", "valor");
  const growthChart = buildMonthlyChartData(profiles, "created_at");

  // Plan Distribution
  const planDist = [
    { name: "Premium", value: profiles.filter(p => p.plano_ativo === 'premium').length },
    { name: "Trial", value: profiles.filter(p => p.plano_ativo === 'trial').length },
    { name: "Expirado/Free", value: profiles.filter(p => p.plano_ativo === 'free' || p.plano_ativo === 'expirado').length },
  ];

  // --- 4. Alertas Inteligentes ---
  const alerts: any[] = [];
  
  // Prox Renovacao (next 5 days)
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const proxRenovacao = activePremium.filter(s => s.current_period_end && new Date(s.current_period_end) <= fiveDaysFromNow).length;
  if (proxRenovacao > 0) alerts.push({ type: 'warning', text: `${proxRenovacao} assinaturas vencem nos próximos 5 dias` });

  // Inativos > 15 dias
  const activeRecent = new Set([
    ...medicoes.filter(m => parseISO(m.data_medicao) >= fifteenDaysAgo).map(m => m.user_id),
    ...doses.filter(d => parseISO(d.data_aplicacao) >= fifteenDaysAgo).map(d => d.user_id)
  ]);
  const inactiveUsers = profiles.filter(p => (p.plano_ativo === 'premium' || p.plano_ativo === 'trial') && !activeRecent.has(p.id)).length;
  if (inactiveUsers > 0) alerts.push({ type: 'info', text: `${inactiveUsers} usuários premium/trial inativos há +15 dias` });

  // Inadimplentes (Pendente status in assinaturas)
  const pendentes = assinaturas.filter(s => s.status === 'pendente').length;
  if (pendentes > 0) alerts.push({ type: 'danger', text: `${pendentes} pagamentos pendentes (Pix gerado)` });

  return (
    <AdminDashboardClient
      metrics={{
        mrr,
        activeCustomers: activePremium.length,
        newThisMonth,
        canceledThisMonth,
        churnRate,
        conversionRate,
        ticketMedio,
        activeUsers30d,
        activeUsers7d,
        activeUsersToday,
      }}
      revenueChart={revenueChart}
      growthChart={growthChart}
      planDistribution={planDist}
      recentCustomers={profiles.slice(0, 5).map(p => ({
        nome: p.nome || 'Sem nome',
        email: p.email,
        plano: p.plano_ativo,
        valor: 29.9,
        status: p.plano_ativo === 'premium' ? 'ativo' : p.plano_ativo,
        data: p.created_at
      }))}
      alerts={alerts}
    />
  );
}
