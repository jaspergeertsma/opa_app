
const url = 'https://pandqesnxpdvbsyclbts.supabase.co/rest/v1/';
const key = 'sb_publishable_4SQrixMEXnvVcaNXjxIOfw_dMbZrwZ3';

console.log("Testing connection to:", url);

async function testConnection() {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });

        console.log("Status:", response.status);
        if (response.ok) {
            console.log("✅ Connectie geslaagd! Key is geldig.");
        } else {
            console.log("❌ Connectie geweigerd. De server zegt:", response.statusText);
            const text = await response.text();
            console.log("Response:", text);
        }
    } catch (error) {
        console.error("❌ Netwerk fout:", error.message);
    }
}

testConnection();
