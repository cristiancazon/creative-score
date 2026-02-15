const DIRECTUS_URL = 'http://127.0.0.1:8055';
const TOKEN = 'WNm1tezUYancfqeM0niVJY23BgmjTXlm'; // Admin Token

async function setPublicPermissions() {
    console.log('Setting Public Permissions...');

    const collections = ['matches', 'teams', 'sports', 'players', 'directus_files', 'boards'];

    for (const collection of collections) {
        // Check if permission already exists for public (role = null)
        const checkRes = await fetch(`${DIRECTUS_URL}/permissions?filter[role][_null]=true&filter[collection][_eq]=${collection}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const existingpermissions = (await checkRes.json()).data;

        if (existingpermissions.length > 0) {
            console.log(`Permission for ${collection} already exists. Updating...`);
            // Update existing
            const id = existingpermissions[0].id;
            await fetch(`${DIRECTUS_URL}/permissions/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    permissions: {
                        _access: true // Full access allowed by policy if no specific fields
                    },
                    action: 'read',
                    fields: ['*']
                })
            });
        } else {
            console.log(`Creating public permission for ${collection}...`);
            // Create new
            await fetch(`${DIRECTUS_URL}/permissions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: null, // Public
                    collection: collection,
                    action: 'read',
                    fields: ['*']
                })
            });
        }
    }
    console.log('Public permissions set successfully.');
}

setPublicPermissions().catch(console.error);
