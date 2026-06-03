import { createServerClient } from "@/lib/supabase-server";
import { subDays } from "date-fns";
import { DietaClient } from "./DietaClient";

// Reads the user's profile + recent food diary, so render per-request.
export const dynamic = "force-dynamic";

export default async function DietaPage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("dose_atual_mg")
    .eq("id", session.user.id)
    .single();

  // Last 30 days of meals — used for today's list and the streak calculation.
  const desde = subDays(new Date(), 30).toISOString();
  const { data: refeicoes } = await supabase
    .from("refeicoes_registradas")
    .select("*")
    .eq("user_id", session.user.id)
    .gte("data", desde)
    .order("data", { ascending: false });

  return (
    <DietaClient
      userId={session.user.id}
      doseMg={profile?.dose_atual_mg ?? 2.5}
      initialRefeicoes={refeicoes ?? []}
    />
  );
}
