import { createServerClient } from "@/lib/supabase-server";
import { DashboardClient } from "@/components/DashboardClient";
import { differenceInDays, differenceInWeeks } from "date-fns";
import { calcularProximaDose, parseDateStr } from "@/lib/utils/dose";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  // Parallelize all data fetching
  const [profileResult, dosesResult, weightsResult, ampolasResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('nome, dose_atual_mg, data_inicio_tratamento, peso_meta, peso_inicial, altura_cm')
      .eq('id', session.user.id)
      .single(),

    supabase
      .from('doses')
      .select('data_aplicacao, dose_mg, local_aplicacao, observacoes')
      .eq('user_id', session.user.id)
      .order('data_aplicacao', { ascending: false }),

    supabase
      .from('medicoes_saude')
      .select('data_medicao, peso_kg, imc')
      .eq('user_id', session.user.id)
      .not('peso_kg', 'is', null)
      .order('data_medicao', { ascending: false })
      .limit(30),

    supabase
      .from('estoque_ampolas')
      .select('quantidade')
      .eq('user_id', session.user.id)
  ]);

  let profile = profileResult.data;
  const doses = dosesResult.data;
  const weights = weightsResult.data;
  const ampolas = ampolasResult.data;

  // Fallback for name if missing in profile
  if (profile && !profile.nome && session.user.user_metadata?.nome) {
    profile.nome = session.user.user_metadata.nome;
  } else if (!profile && session.user.user_metadata?.nome) {
    // If profile query failed entirely, create a partial profile object for the UI
    (profile as any) = {
      nome: session.user.user_metadata.nome
    };
  }

  const lastDose = doses?.[0];
  
  const totalPurchased = ampolas?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;
  const ampolasUsadas = doses?.length || 0;
  const totalAmpolas = Math.max(0, totalPurchased - ampolasUsadas);

  // Calculations — use explicit start date (consistent with dieta page)
  const startTreatmentDate = profile?.data_inicio_tratamento
    ? parseDateStr(profile.data_inicio_tratamento)
    : null;
  const firstDoseDate = doses?.length ? parseDateStr(doses[doses.length - 1].data_aplicacao) : null;
  const weeksCompleted = startTreatmentDate
    ? differenceInWeeks(new Date(), startTreatmentDate)
    : firstDoseDate
      ? differenceInWeeks(new Date(), firstDoseDate)
      : 0;
  
  const lastWeight = weights?.[0];
  const firstWeight = weights?.[weights.length - 1];
  // Prefer profile.peso_inicial as the baseline; fall back to oldest recorded measurement
  const pesoBaselineDashboard = profile?.peso_inicial || firstWeight?.peso_kg;
  const weightDelta = (pesoBaselineDashboard && lastWeight?.peso_kg)
    ? (pesoBaselineDashboard - lastWeight.peso_kg).toFixed(1)
    : 0;
  const daysSinceLastWeight = lastWeight ? differenceInDays(new Date(), new Date(lastWeight.data_medicao)) : null;
  
  const calculoDose = calcularProximaDose(
    lastDose?.data_aplicacao,
    profile?.data_inicio_tratamento
  );

  return (
    <DashboardClient 
      userId={session.user.id}
      profile={profile}
      lastDose={lastDose}
      calculoDose={calculoDose}
      weeksCompleted={weeksCompleted}
      lastWeight={lastWeight}
      weightDelta={weightDelta}
      daysSinceLastWeight={daysSinceLastWeight}
      totalAmpolas={totalAmpolas}
      weights={weights || []}
      doses={doses || []}
    />
  );
}
