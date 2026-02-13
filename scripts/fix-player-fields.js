const DIRECTUS_URL = 'http://127.0.0.1:8055';
const TOKEN = 'WNm1tezUYancfqeM0niVJY23BgmjTXlm';

async function addPlayerCoreFields() {
    console.log('Adding "name" and "number" fields to players collection...');

    const fields = [
        {
            field: 'name',
            type: 'string',
            meta: {
                interface: 'input',
                special: null,
                readonly: false,
                hidden: false,
                width: 'half',
                note: 'Player Name'
            },
            schema: {
                is_nullable: false
            }
        },
        {
            field: 'number',
            type: 'integer',
            meta: {
                interface: 'input',
                special: null,
                readonly: false,
                hidden: false,
                width: 'half',
                note: 'Jersey Number'
            },
            schema: {
                is_nullable: false
            }
        }
    ];

    for (const fieldData of fields) {
        const response = await fetch(`${DIRECTUS_URL}/fields/players`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fieldData)
        });

        if (!response.ok) {
            // Ignore if field already exists (409ish), but log
            const error = await response.text();
            console.log(`Note for ${fieldData.field}:`, error);
        } else {
            console.log(`Field "${fieldData.field}" created successfully!`);
        }
    }
}

addPlayerCoreFields().catch(console.error);
