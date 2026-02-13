const DIRECTUS_URL = 'http://127.0.0.1:8055';
const TOKEN = 'WNm1tezUYancfqeM0niVJY23BgmjTXlm'; // Using the static token from seed for admin checks

async function addSportTypeField() {
    console.log('Adding "type" field to sports collection...');

    const response = await fetch(`${DIRECTUS_URL}/fields/sports`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            field: 'type',
            type: 'string',
            meta: {
                interface: 'select-dropdown',
                options: {
                    choices: [
                        { text: "Basketball", value: "basketball" },
                        { text: "Soccer", value: "soccer" },
                        { text: "Volleyball", value: "volleyball" }
                    ]
                },
                special: null,
                readonly: false,
                hidden: false,
                width: 'half',
                note: 'Engine type for rules'
            },
            schema: {
                is_nullable: false,
                default_value: "basketball"
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.log('Result:', error);
    } else {
        console.log('Field "type" created successfully!');
    }
}

addSportTypeField().catch(console.error);
