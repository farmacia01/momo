const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBlocked() {
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, created_at, email, nome');
  if (pErr) throw pErr;

  const { data: invites, error: iErr } = await supabase.from('referral_invites').select('referrer_id');
  if (iErr) throw iErr;

  const inviteCountByUser = new Map();
  for (const inv of invites) {
    if (inv.referrer_id) {
      inviteCountByUser.set(inv.referrer_id, (inviteCountByUser.get(inv.referrer_id) || 0) + 1);
    }
  }

  const now = new Date();
  const blockedUsers = [];

  for (const p of profiles) {
    const ageMs = now.getTime() - new Date(p.created_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const invCount = inviteCountByUser.get(p.id) || 0;
    
    if (invCount < 3 && ageDays > 7) {
      blockedUsers.push({
        id: p.id,
        email: p.email,
        nome: p.nome,
        ageDays: ageDays.toFixed(1),
        invCount
      });
    }
  }

  console.log(`Found ${blockedUsers.length} blocked users.`);
  console.table(blockedUsers);
}

checkBlocked().catch(console.error);
