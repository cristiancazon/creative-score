const DIRECTUS_URL = 'http://127.0.0.1:8055';
const TOKEN = 'WNm1tezUYancfqeM0niVJY23BgmjTXlm';

async function addSportIconField() {
    console.log('Adding "icon" field to sports collection...');

    const response = await fetch(`${DIRECTUS_URL}/fields/sports`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            field: 'icon',
            type: 'uuid',
            meta: {
                interface: 'image',
                special: ['file'],
                readonly: false,
                hidden: false,
                width: 'half',
                note: 'Sport Logo'
            },
            schema: {
                is_nullable: true,
                foreign_key_table: 'directus_files',
                foreign_key_column: 'id'
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.log('Result:', error);
    } else {
        console.log('Field "icon" created successfully!');
    }
}

addSportIconField().catch(console.error);
