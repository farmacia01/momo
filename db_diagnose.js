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
  const result = await c.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles';");
  console.log(result.rows);
  await c.end();
}

run();
