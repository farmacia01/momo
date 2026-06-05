import useSWR from "swr";
import { supabase } from "@/lib/supabase";

const fetcher = async (userId: string) => {
  const [peso, doses, estoque, profile] = await Promise.all([
    supabase
      .from("medicoes_saude")
      .select("peso_kg, imc, data_medicao")
      .eq("user_id", userId)
      .order("data_medicao", { ascending: false })
      .limit(30),
    supabase
      .from("doses")
      .select("data_aplicacao, dose_mg, local_aplicacao")
      .eq("user_id", userId)
      .order("data_aplicacao", { ascending: false })
      .limit(1),
    supabase
      .from("estoque_ampolas")
      .select("quantidade, dose_mg")
      .eq("user_id", userId)
      .limit(5),
    supabase
      .from("profiles")
      .select("nome, dose_atual_mg, data_inicio_tratamento, peso_meta, plano_ativo, trial_expira_em")
      .eq("id", userId)
      .single(),
  ]);

  return {
    peso: peso.data,
    doses: doses.data,
    estoque: estoque.data,
    profile: profile.data,
  };
};

export function useDashboardData(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? ["dashboard", userId] : null,
    ([_, id]) => fetcher(id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 segundos
    }
  );

  return { data, error, isLoading, refresh: mutate };
}
