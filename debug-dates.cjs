
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manual .env parser
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, ''); // strip quotes
        env[key] = val;
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'UNDEFINED');
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'UNDEFINED');

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching schedule dates...');
    const { data, error } = await supabase
        .from('schedule_dates')
        .select('id, date')
        .order('date');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} dates.`);
    data.forEach(d => {
        console.log(`- Date: "${d.date}" (ID: ${d.id})`);
    });

    console.log('--- Search Test ---');
    const searchDate = '2026-02-07';
    const { data: searchData } = await supabase
        .from('schedule_dates')
        .select('*')
        .eq('date', searchDate);

    console.log(`Searching for "${searchDate}": Found ${searchData?.length || 0} rows.`);
}

run();
