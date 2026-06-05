import useSWR from "swr";
import { supabase } from "@/lib/supabase";

const fetcher = async (fornecedorId: string) => {
  const { data, error } = await supabase
    .from("pedidos")
    .select("id, status, total, user_id, items, created_at")
    .eq("fornecedor_id", fornecedorId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export function usePedidosData(fornecedorId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    fornecedorId ? ["pedidos", fornecedorId] : null,
    ([_, id]) => fetcher(id),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10 segundos
    }
  );

  return { pedidos: data, error, isLoading, refresh: mutate };
}
