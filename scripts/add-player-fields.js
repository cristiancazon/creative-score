const DIRECTUS_URL = 'http://127.0.0.1:8055';
const TOKEN = 'WNm1tezUYancfqeM0niVJY23BgmjTXlm';

async function addPlayerFields() {
    console.log('Adding "avatar", "position", and "active" fields to players collection...');

    const fields = [
        {
            field: 'avatar',
            type: 'uuid',
            meta: {
                interface: 'image',
                special: ['file'],
                readonly: false,
                hidden: false,
                width: 'half',
                note: 'Player Photo'
            },
            schema: {
                is_nullable: true,
                foreign_key_table: 'directus_files',
                foreign_key_column: 'id'
            }
        },
        {
            field: 'position',
            type: 'string',
            meta: {
                interface: 'input',
                special: null,
                readonly: false,
                hidden: false,
                width: 'half',
                note: 'Player Position (Guard, Forward, etc.)'
            },
            schema: {
                is_nullable: true
            }
        },
        {
            field: 'active',
            type: 'boolean',
            meta: {
                interface: 'boolean',
                special: ['cast-boolean'],
                readonly: false,
                hidden: false,
                width: 'half',
                note: 'Is Active'
            },
            schema: {
                is_nullable: false,
                default_value: true
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
            const error = await response.text();
            console.log(`Note for ${fieldData.field}:`, error);
        } else {
            console.log(`Field "${fieldData.field}" created successfully!`);
        }
    }
}

addPlayerFields().catch(console.error);
