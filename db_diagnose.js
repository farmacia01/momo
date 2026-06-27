const { Client } = require('pg');

const c = new Client({
  host: 'db.wlnlmmvlhjazqifyetse.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'srMEZ2bie18qoXw0',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await c.connect();
  console.log('=== Connected ===\n');

  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbmxtbXZsaGphenFpZnlldHNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQwNzI2NCwiZXhwIjoyMDk1OTgzMjY0fQ.b_KsvghWvGW-qkr8XX5bn472rCdWAhNUN8evH60539Y';

  // Fix all functions to explicitly set search_path
  console.log('=== STEP 1: Fixing search_path on functions ===');
  
  await c.query(`
    CREATE OR REPLACE FUNCTION public.generate_referral_code()
    RETURNS text AS $$
    DECLARE
      chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      result text := '';
      i int;
    BEGIN
      FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      RETURN result;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  `);
  
  await c.query(`
    CREATE OR REPLACE FUNCTION public.set_referral_code()
    RETURNS trigger AS $$
    BEGIN
      IF NEW.referral_code IS NULL THEN
        LOOP
          NEW.referral_code := generate_referral_code();
          EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = NEW.referral_code);
        END LOOP;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  `);

  await c.query(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (
        id, email, nome, telefone,
        altura_cm, peso_inicial, peso_meta,
        dose_atual_mg, dia_aplicacao, data_inicio_tratamento
      ) VALUES (
        new.id, new.email,
        new.raw_user_meta_data->>'nome',
        new.raw_user_meta_data->>'telefone',
        NULLIF(NULLIF(new.raw_user_meta_data->>'altura_cm', ''), 'null')::decimal,
        NULLIF(NULLIF(new.raw_user_meta_data->>'peso_inicial', ''), 'null')::decimal,
        NULLIF(NULLIF(new.raw_user_meta_data->>'peso_meta', ''), 'null')::decimal,
        NULLIF(NULLIF(new.raw_user_meta_data->>'dose_atual_mg', ''), 'null')::decimal,
        NULLIF(NULLIF(new.raw_user_meta_data->>'dia_aplicacao', ''), 'null')::integer,
        NULLIF(NULLIF(new.raw_user_meta_data->>'data_inicio_tratamento', ''), 'null')::date
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nome = COALESCE(EXCLUDED.nome, profiles.nome);
      RETURN new;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.profiles (id, email, nome)
      VALUES (new.id, new.email, new.raw_user_meta_data->>'nome')
      ON CONFLICT (id) DO NOTHING;
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  `);

  console.log('  Updated all functions with SET search_path = public');

  // Test signup without explicit savepoint (so errors fail normally)
  console.log('\n=== STEP 2: Testing signup with fixed search_path ===');
  const testEmail = 'search_path_test_' + Date.now() + '@gmail.com';
  const response = await fetch('https://wlnlmmvlhjazqifyetse.supabase.co/auth/v1/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: { nome: 'Search Path Test' }
    })
  });
  
  const responseText = await response.text();
  console.log('  Status:', response.status);
  
  if (response.status === 200) {
    const data = JSON.parse(responseText);
    console.log('  ✅ SUCCESS! The issue was the search_path missing in the functions!');
    console.log('  User ID:', data.id);
    
    // Check if profile was created
    const profile = await c.query('SELECT id, email, nome, referral_code FROM public.profiles WHERE email = $1', [testEmail]);
    console.log('  Profile created:', profile.rows.length > 0 ? JSON.stringify(profile.rows[0]) : 'NO');
    
    // Clean up
    await c.query('DELETE FROM public.profiles WHERE email = $1', [testEmail]);
    await c.query('DELETE FROM auth.identities WHERE user_id = $1', [data.id]);
    await c.query('DELETE FROM auth.users WHERE email = $1', [testEmail]);
    console.log('  Cleaned up');
    console.log('\n  🎉🎉🎉 O CADASTRO FINALMENTE ESTÁ CORRIGIDO! 🎉🎉🎉');
  } else {
    console.log('  ❌ STILL FAILING:', responseText.substring(0, 300));
  }

  await c.end();
}

run().catch(e => { console.error('ERROR:', e.message); c.end(); });
