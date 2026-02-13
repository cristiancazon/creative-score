const DIRECTUS_URL = 'http://127.0.0.1:8055';
const TOKEN = 'WNm1tezUYancfqeM0niVJY23BgmjTXlm';

async function addTeamFields() {
    console.log('Adding "short_name" and "logo" fields to teams collection...');

    const fields = [
        {
            field: 'short_name',
            type: 'string',
            meta: {
                interface: 'input',
                special: null,
                readonly: false,
                hidden: false,
                width: 'half',
                note: '3 Letter Abbreviation (e.g. LAL, BAR)'
            },
            schema: {
                is_nullable: true
            }
        },
        {
            field: 'logo',
            type: 'uuid',
            meta: {
                interface: 'image',
                special: ['file'],
                readonly: false,
                hidden: false,
                width: 'half',
                note: 'Team Logo'
            },
            schema: {
                is_nullable: true,
                foreign_key_table: 'directus_files',
                foreign_key_column: 'id'
            }
        }
    ];

    for (const fieldData of fields) {
        const response = await fetch(`${DIRECTUS_URL}/fields/teams`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fieldData)
        });

        if (!response.ok) {
            // Ignore if field already exists error to be safe, but log it
            const error = await response.text();
            console.log(`Note for ${fieldData.field}:`, error);
        } else {
            console.log(`Field "${fieldData.field}" created successfully!`);
        }
    }
}

addTeamFields().catch(console.error);
