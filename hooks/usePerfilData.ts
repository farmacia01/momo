import useSWR from "swr";
import { supabase } from "@/lib/supabase";

const fetcher = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, email, avatar_url, plano_ativo, trial_expira_em, dose_atual_mg, data_inicio_tratamento, peso_meta, peso_inicial, altura_cm, restricoes_alimentares")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

export function usePerfilData(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? ["perfil", userId] : null,
    ([_, id]) => fetcher(id),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 1000 * 60 * 5, // 5 minutos
    }
  );

  return { perfil: data, error, isLoading, refresh: mutate };
}
