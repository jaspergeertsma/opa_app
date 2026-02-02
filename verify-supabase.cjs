
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pandqesnxpdvbsyclbts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbmRxZXNueHBkdmJzeWNsYnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMDIwNjYsImV4cCI6MjA4NTU3ODA2Nn0.JIPq72WBmE4BFsYDW3KsqnabUOzLb-GmegteCtEUpgM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    console.log("Verbinding testen...");

    // Probeer de 'app_settings' tabel te lezen
    // We verwachten een resultaat, of een lege array.
    const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ Fout bij verbinding:", error.message);
        console.error("Details:", error);
    } else {
        console.log("✅ Verbinding geslaagd!");
        console.log("Data gevonden:", data);

        if (data.length === 0) {
            console.log("⚠️  Tabel is leeg, maar bestaat wel.");
        }
    }
}

checkConnection();
