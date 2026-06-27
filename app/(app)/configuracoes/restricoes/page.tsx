import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { RestricoesClient } from "./RestricoesClient";

import { differenceInWeeks } from "date-fns";
import { parseDateStr } from "@/lib/utils/dose";

export const dynamic = "force-dynamic";

export default async function RestricoesPage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("restricoes_alimentares, dose_atual_mg, data_inicio_tratamento")
    .eq("id", session.user.id)
    .single();

  const startDate = profile?.data_inicio_tratamento ? parseDateStr(profile.data_inicio_tratamento) : null;
  const weeksCompleted = startDate ? differenceInWeeks(new Date(), startDate) : null;

  return (
    <RestricoesClient
      userId={session.user.id}
      doseMg={profile?.dose_atual_mg ?? 2.5}
      weeksCompleted={weeksCompleted}
      initial={profile?.restricoes_alimentares ?? []}
    />
  );
}
