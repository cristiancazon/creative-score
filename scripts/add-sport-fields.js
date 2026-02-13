const DIRECTUS_URL = 'http://127.0.0.1:8055';
const TOKEN = 'WNm1tezUYancfqeM0niVJY23BgmjTXlm'; // Using the static token from seed for admin checks

async function addSportFields() {
    console.log('Adding "periods" and "period_duration" fields to sports collection...');

    const fields = [
        {
            field: 'periods',
            type: 'integer',
            meta: {
                interface: 'input',
                special: null,
                readonly: false,
                hidden: false,
                width: 'half',
                note: 'Number of periods (quarters, halves)'
            },
            schema: {
                is_nullable: false,
                default_value: 4
            }
        },
        {
            field: 'period_duration',
            type: 'integer',
            meta: {
                interface: 'input',
                special: null,
                readonly: false,
                hidden: false,
                width: 'half',
                note: 'Duration in minutes'
            },
            schema: {
                is_nullable: false,
                default_value: 10
            }
        }
    ];

    for (const fieldData of fields) {
        const response = await fetch(`${DIRECTUS_URL}/fields/sports`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fieldData)
        });

        if (!response.ok) {
            const error = await response.text();
            console.log(`Error adding ${fieldData.field}:`, error);
        } else {
            console.log(`Field "${fieldData.field}" created successfully!`);
        }
    }
}

addSportFields().catch(console.error);
