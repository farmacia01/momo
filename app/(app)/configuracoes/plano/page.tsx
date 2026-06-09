import { createServerClient } from "@/lib/supabase-server";
import { PlanoClient } from "./PlanoClient";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function PlanoPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plano_ativo')
    .eq('id', session.user.id)
    .single();

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('user_id', session.user.id)
    .order('criado_em', { ascending: false })
    .limit(1)
    .single();

  return (
    <PlanoClient 
      planoAtivo={profile?.plano_ativo || 'free'}
      assinatura={assinatura}
      checkoutUrl={process.env.CAKTO_CHECKOUT_URL || 'https://pay.cakto.com.br/i75hqvn_913965'}
    />
  );
}