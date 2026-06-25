import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { TratamentoClient } from "./TratamentoClient";

export const dynamic = "force-dynamic";

export default async function TratamentoPage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("dose_atual_mg, data_inicio_tratamento, medico_nome, peso_inicial, peso_meta, altura_cm")
    .eq("id", session.user.id)
    .single();

  return (
    <TratamentoClient
      userId={session.user.id}
      initial={{
        dose_atual_mg: profile?.dose_atual_mg != null ? String(profile.dose_atual_mg) : "",
        data_inicio_tratamento: profile?.data_inicio_tratamento ?? "",
        medico_nome: profile?.medico_nome ?? "",
        peso_inicial: profile?.peso_inicial != null ? String(profile.peso_inicial) : "",
        peso_meta: profile?.peso_meta != null ? String(profile.peso_meta) : "",
        altura_cm: profile?.altura_cm != null ? String(profile.altura_cm) : "",
      }}
    />
  );
}
