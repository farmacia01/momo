import { createServerClient } from "@/lib/supabase-server";
import { SaudeClient } from "./SaudeClient";
import { differenceInWeeks } from "date-fns";

export default async function SaudePage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  // Profile to get height and start date
  const { data: profile } = await supabase
    .from('profiles')
    .select('altura_cm, data_inicio_tratamento')
    .eq('id', session.user.id)
    .single();

  // Fetch medicoes
  const { data: medicoes } = await supabase
    .from('medicoes_saude')
    .select('*')
    .eq('user_id', session.user.id)
    .order('data_medicao', { ascending: false });

  // Fetch sintomas
  const { data: sintomas } = await supabase
    .from('sintomas')
    .select('*')
    .eq('user_id', session.user.id)
    .order('data', { ascending: false });

  // Calculate some achievements to pass down
  let lost5kg = false;
  let tenWeeks = false;
  let imcBelow30 = false;
  
  if (medicoes && medicoes.length > 0) {
    const firstWeight = medicoes[medicoes.length - 1].peso_kg;
    const currentWeight = medicoes[0].peso_kg;
    if (firstWeight && currentWeight && (firstWeight - currentWeight >= 5)) {
      lost5kg = true;
    }
    
    if (medicoes[0].imc && medicoes[0].imc < 30) {
      imcBelow30 = true;
    }
  }

  if (profile?.data_inicio_tratamento) {
    const weeks = differenceInWeeks(new Date(), new Date(profile.data_inicio_tratamento));
    if (weeks >= 10) tenWeeks = true;
  }

  const achievements = {
    lost5kg,
    tenWeeks,
    imcBelow30
  };

  return (
    <SaudeClient 
      userId={session.user.id}
      alturaCm={profile?.altura_cm || null}
      initialMedicoes={medicoes || []}
      initialSintomas={sintomas || []}
      achievements={achievements}
    />
  );
}