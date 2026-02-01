import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
// Note: This script requires environment variables to be set
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file
// Or export them before running: export VITE_SUPABASE_URL=... && export VITE_SUPABASE_ANON_KEY=...

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials.');
  console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.error('   Or export them: export VITE_SUPABASE_URL=... && export VITE_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking database for client data...\n');

// Check all clients
const { data: clients, error: clientsError } = await supabase
  .from('clients')
  .select('*');

if (clientsError) {
  console.error('❌ Error fetching clients:', clientsError.message);
  process.exit(1);
}

console.log(`Found ${clients.length} clients\n`);

if (clients.length === 0) {
  console.log('✅ No clients in database. Database is clean.');
  process.exit(0);
}

// Group by case
const casesMap = new Map();

clients.forEach(client => {
  const caseId = client.casefile_id;
  if (!casesMap.has(caseId)) {
    casesMap.set(caseId, []);
  }
  casesMap.get(caseId).push(client);
});

console.log(`Found ${casesMap.size} case(s) with clients\n`);

// Analyze each case
let casesWithMissingNames = 0;
let casesWithCompleteNames = 0;

for (const [caseId, clients] of casesMap) {
  const incomplete = clients.filter(c => !c.first_name || !c.last_name || c.first_name.trim() === '' || c.last_name.trim() === '');
  
  console.log(`\n📁 Case #${caseId}:`);
  console.log(`   ${clients.length} client(s)`);
  
  clients.forEach((client, index) => {
    const nameStatus = (client.first_name && client.last_name) ? '✅' : '❌';
    const fullName = `${client.first_name || '(no first)'} ${client.last_name || '(no last)'}`;
    console.log(`   Client #${index + 1}: ${nameStatus} ${fullName}`);
    console.log(`      - Driver: ${client.is_driver ? 'Yes' : 'No'}`);
    console.log(`      - Client Order: ${client.client_order}`);
  });
  
  if (incomplete.length > 0) {
    casesWithMissingNames++;
    console.log(`   ⚠️  This case has ${incomplete.length} client(s) with missing/incomplete names`);
  } else {
    casesWithCompleteNames++;
    console.log(`   ✅ All client names are complete`);
  }
}

console.log(`\n\nSummary:`);
console.log(`✅ Cases with complete client data: ${casesWithCompleteNames}`);
console.log(`❌ Cases with missing/incomplete data: ${casesWithMissingNames}`);

if (casesWithMissingNames > 0) {
  console.log(`\n⚠️  WARNING: Some cases have incomplete client data!`);
  console.log(`   This will cause "undefined undefined" to display in the UI.`);
  console.log(`\n   Recommended: Delete test data and create a new case via intake form.`);
}

