import { createServerClient } from "@/lib/supabase-server";
import { DosesClient } from "./DosesClient";
import { calcularProximaDose } from "@/lib/utils/dose";

export const dynamic = 'force-dynamic';

export default async function DosesPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  // Parallelize data fetching
  const [profileResult, dosesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('dose_atual_mg, data_inicio_tratamento')
      .eq('id', session.user.id)
      .single(),
    supabase
      .from('doses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('data_aplicacao', { ascending: false })
  ]);

  const profile = profileResult.data;
  const doses = dosesResult.data;

  const calculoDose = calcularProximaDose(
    doses?.[0]?.data_aplicacao,
    profile?.data_inicio_tratamento
  );

  return (
    <DosesClient 
      userId={session.user.id} 
      initialDoses={doses || []} 
      currentDoseMg={profile?.dose_atual_mg || 2.5}
      calculoDose={calculoDose}
    />
  );
}