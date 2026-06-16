import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// load .env
const env = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const term = process.argv[2] || 'תומר';
  const { data, error } = await supabase
    .from('reunion_badges')
    .select('*')
    .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,monday_name.ilike.%${term}%`);
  if (error) { console.error(error); process.exit(1); }
  console.log(JSON.stringify(data, null, 2));
}
main();
