import { createServerClient } from "@/lib/supabase-server";
import { EstoqueClient } from "./EstoqueClient";
import { FornecedoresSection } from "./FornecedoresSection";

export default async function EstoquePage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('dose_atual_mg, farmacia_preferida')
    .eq('id', session.user.id)
    .single();

  const { data: ampolas } = await supabase
    .from('estoque_ampolas')
    .select('*')
    .eq('user_id', session.user.id)
    .order('data_compra', { ascending: false });

  // Get or create alerta
  let { data: alerta } = await supabase
    .from('alertas_estoque')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (!alerta) {
    const { data: newAlerta } = await supabase
      .from('alertas_estoque')
      .insert({ user_id: session.user.id, quantidade_minima: 2, dias_antecedencia_notificacao: 7, ativo: true })
      .select()
      .single();
    alerta = newAlerta;
  }

  // Also count used doses to calculate remaining ampoules.
  // Assuming 1 dose = 1 ampoule (Mounjaro single-dose pens).
  const { count: dosesCount } = await supabase
    .from('doses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id);

  // Total purchased
  const totalPurchased = ampolas?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;
  
  // Remaining = Purchased - Used. If negative, user didn't register all purchases, default to totalPurchased for safety or let it be.
  // Actually, to make it simple without enforcing strict matching (since user can start tracking later), 
  // let's treat "quantidade" in estoque_ampolas as what they added to stock.
  // Wait, if they inject, we should deduct. Let's calculate remaining = totalPurchased - (dosesCount || 0)
  // If remaining < 0, maybe they didn't add the initial stock.
  const ampolasUsadas = dosesCount || 0;
  let ampolasDisponiveis = totalPurchased - ampolasUsadas;
  if (ampolasDisponiveis < 0) ampolasDisponiveis = 0; // Prevent negative display

  return (
    <div className="space-y-6">
      <EstoqueClient
        userId={session.user.id}
        initialAmpolas={ampolas || []}
        initialAlerta={alerta}
        profile={profile}
        ampolasUsadas={ampolasUsadas}
      />
      <FornecedoresSection userId={session.user.id} />
    </div>
  );
}