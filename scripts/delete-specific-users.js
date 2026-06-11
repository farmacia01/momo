require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const ids = ["bb35b0ef-ffcc-47f1-b5ee-a36b8cbf446b", "83b59fc0-f1a7-4e49-b19d-af99654b5605"];
  
  for (const id of ids) {
    let userId = id;
    
    // First, check if this ID is a fornecedor_id
    const { data: fornecedor } = await supabase.from('fornecedores').select('user_id, razao_social').eq('id', id).single();
    if (fornecedor) {
      console.log(`ID ${id} é um fornecedor. user_id associado: ${fornecedor.user_id} (${fornecedor.razao_social})`);
      userId = fornecedor.user_id;
    } else {
      console.log(`ID ${id} não encontrado na tabela fornecedores, assumindo que seja user_id`);
    }

    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (user && user.user) {
      console.log(`Usuário encontrado: ${user.user.email} (${userId})`);
      
      console.log(`Deletando dados do usuário ${userId}...`);
      
      await supabase.from('configuracoes_notificacao').delete().eq('user_id', userId);
      await supabase.from('push_subscriptions').delete().eq('user_id', userId);
      await supabase.from('receitas_geradas').delete().eq('user_id', userId);
      
      const { data: fornecedores } = await supabase.from('fornecedores').select('id').eq('user_id', userId);
      if (fornecedores && fornecedores.length > 0) {
        for (const f of fornecedores) {
          const { data: pedidosFornec } = await supabase.from('pedidos').select('id').eq('fornecedor_id', f.id);
          if (pedidosFornec && pedidosFornec.length > 0) {
            for (const p of pedidosFornec) {
              await supabase.from('historico_status_pedido').delete().eq('pedido_id', p.id);
              await supabase.from('avaliacoes_produto').delete().eq('pedido_id', p.id);
              await supabase.from('pedidos').delete().eq('id', p.id);
            }
          }
          await supabase.from('avaliacoes_produto').delete().eq('fornecedor_id', f.id);
          await supabase.from('fornecedor_produtos').delete().eq('fornecedor_id', f.id);
          await supabase.from('fornecedores').delete().eq('id', f.id);
        }
      }

      await supabase.from('profiles').delete().eq('id', userId);

      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error(`Erro ao excluir ${userId}:`, deleteError.message);
      } else {
        console.log(`Usuário ${userId} excluído com sucesso do Auth.`);
      }

    } else {
      console.log(`Usuário ${userId} não encontrado no Auth.`);
    }
  }
}

run();
