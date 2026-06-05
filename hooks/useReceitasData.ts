import useSWR from "swr";
import { supabase } from "@/lib/supabase";

const fetcher = async (userId: string) => {
  const { data, error } = await supabase
    .from("receitas_geradas")
    .select("id, titulo, descricao, ingredientes, instrucoes, tags, macros, imagem_url, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export function useReceitasData(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? ["receitas", userId] : null,
    ([_, id]) => fetcher(id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000 * 60 * 60 * 24 * 7, // 7 dias
    }
  );

  return { receitas: data, error, isLoading, refresh: mutate };
}
