import { createServerClient } from "@/lib/supabase-server";
import { DosesClient } from "./DosesClient";

export default async function DosesPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('dose_atual_mg')
    .eq('id', session.user.id)
    .single();

  const { data: doses } = await supabase
    .from('doses')
    .select('*')
    .eq('user_id', session.user.id)
    .order('data_aplicacao', { ascending: false });

  return (
    <DosesClient 
      userId={session.user.id} 
      initialDoses={doses || []} 
      currentDoseMg={profile?.dose_atual_mg || 2.5} 
    />
  );
}