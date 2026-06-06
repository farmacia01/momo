import { createServerClient } from "@/lib/supabase-server";
import { SaudeClient } from "./SaudeClient";

export const dynamic = 'force-dynamic';

export default async function SaudePage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  // Parallelize all data fetching
  const [profileResult, medicoesResult, sintomasResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('altura_cm, data_inicio_tratamento, peso_meta, peso_inicial')
      .eq('id', session.user.id)
      .single(),
    supabase
      .from('medicoes_saude')
      .select('*')
      .eq('user_id', session.user.id)
      .order('data_medicao', { ascending: false }),
    supabase
      .from('sintomas')
      .select('*')
      .eq('user_id', session.user.id)
      .order('data', { ascending: false })
  ]);

  const profile = profileResult.data;
  const medicoes = medicoesResult.data;
  const sintomas = sintomasResult.data;

  return (
    <SaudeClient 
      userId={session.user.id}
      profile={profile}
      initialMedicoes={medicoes || []}
      initialSintomas={sintomas || []}
    />
  );
}