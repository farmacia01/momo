import { createServerClient } from "@/lib/supabase-server";
import { subDays, differenceInWeeks } from "date-fns";
import { DietaClient } from "./DietaClient";
import { parseDateStr } from "@/lib/utils/dose";

// Reads the user's profile + recent food diary, so render per-request.
export const dynamic = "force-dynamic";

export default async function DietaPage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const desde = subDays(new Date(), 30).toISOString();

  const [profileResult, weightResult, refeicoesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("dose_atual_mg, altura_cm, data_inicio_tratamento")
      .eq("id", session.user.id)
      .single(),
    supabase
      .from("medicoes_saude")
      .select("peso_kg")
      .eq("user_id", session.user.id)
      .not("peso_kg", "is", null)
      .order("data_medicao", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("refeicoes_registradas")
      .select("*")
      .eq("user_id", session.user.id)
      .gte("data", desde)
      .order("data", { ascending: false }),
  ]);

  const profile = profileResult.data;
  const alturaM = (profile?.altura_cm || 0) / 100;
  const pesoKg = weightResult.data?.peso_kg ?? null;
  const imc = alturaM > 0 && pesoKg ? pesoKg / (alturaM * alturaM) : null;
  const startDate = profile?.data_inicio_tratamento ? parseDateStr(profile.data_inicio_tratamento) : null;
  const weeksCompleted = startDate ? differenceInWeeks(new Date(), startDate) : null;

  return (
    <DietaClient
      userId={session.user.id}
      doseMg={profile?.dose_atual_mg ?? 2.5}
      refeicoesIniciais={refeicoesResult.data ?? []}
      weeksCompleted={weeksCompleted}
      imc={imc}
    />
  );
}
