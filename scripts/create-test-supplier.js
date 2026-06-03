require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestSupplier() {
  const email = 'fornecedor@teste.com';
  const password = 'senha123';
  const nomeFantasia = 'Farmácia Teste';

  console.log(`Creating user ${email}...`);

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nome: nomeFantasia,
      is_fornecedor: true
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists, continuing...');
      // Get the existing user
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existingUser = usersData.users.find(u => u.email === email);
      if (existingUser) {
        await createSupplierProfile(existingUser.id);
      }
    } else {
      console.error('Auth Error:', authError.message);
    }
    return;
  }

  if (authData.user) {
    console.log('User created:', authData.user.id);
    await createSupplierProfile(authData.user.id);
  }
}

async function createSupplierProfile(userId) {
  console.log('Creating supplier profile...');
  const { error: supplierError } = await supabase
    .from('fornecedores')
    .insert({
      user_id: userId,
      razao_social: 'Farmácia de Teste LTDA',
      nome_fantasia: 'Farmácia Teste',
      cnpj: '00.000.000/0001-99',
      tipo: 'farmacia',
      endereco_cidade: 'São Paulo',
      endereco_estado: 'SP',
      status: 'ativo' // Auto-approve for testing
    });

  if (supplierError) {
    if (supplierError.code === '23505') { // Unique violation
       console.log('Supplier profile already exists.');
    } else {
      console.error('Supplier Error:', supplierError.message);
    }
  } else {
    console.log('Supplier profile created and activated!');
  }
}

createTestSupplier();
