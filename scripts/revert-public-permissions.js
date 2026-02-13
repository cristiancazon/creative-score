const DIRECTUS_URL = 'http://127.0.0.1:8055';
const TOKEN = 'WNm1tezUYancfqeM0niVJY23BgmjTXlm'; // Admin Token

async function removePublicPermissions() {
    console.log('Removing Public Permissions...');

    const collections = ['matches', 'teams', 'sports', 'players', 'directus_files'];

    for (const collection of collections) {
        // Find public permission (role = null)
        const checkRes = await fetch(`${DIRECTUS_URL}/permissions?filter[role][_null]=true&filter[collection][_eq]=${collection}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const existingpermissions = (await checkRes.json()).data;

        if (existingpermissions.length > 0) {
            const id = existingpermissions[0].id;
            await fetch(`${DIRECTUS_URL}/permissions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                }
            });
            console.log(`Removed public permission for ${collection}.`);
        } else {
            console.log(`No public permission found for ${collection}.`);
        }
    }
    console.log('Public permissions revert complete.');
}

removePublicPermissions().catch(console.error);
