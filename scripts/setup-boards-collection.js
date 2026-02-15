const DIRECTUS_URL = 'http://127.0.0.1:8055';
const TOKEN = 'WNm1tezUYancfqeM0niVJY23BgmjTXlm'; // Admin Token

async function setupBoardsCollection() {
    console.log('Setting up Boards Collection...');

    // 1. Create Collection
    try {
        const res = await fetch(`${DIRECTUS_URL}/collections`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                collection: 'boards',
                schema: { name: 'boards' },
                meta: {
                    hidden: false,
                    singleton: false,
                    icon: 'monitor',
                    note: 'Display board configurations'
                }
            })
        });

        if (res.ok) {
            console.log('Collection "boards" created.');
        } else {
            const err = await res.json();
            if (err.errors?.[0]?.code === 'RECORD_NOT_UNIQUE') {
                console.log('Collection "boards" already exists.');
            } else {
                console.error('Error creating collection:', err);
                return;
            }
        }
    } catch (e) {
        console.error('Network error creating collection:', e);
        return;
    }

    // 2. Create Fields
    const fields = [
        { field: 'id', type: 'uuid', meta: { hidden: true, readonly: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: false } },
        { field: 'name', type: 'string', meta: { interface: 'input', display: 'raw', required: true, width: 'full' }, schema: {} },
        {
            field: 'active_match',
            type: 'uuid',
            meta: { interface: 'select-dropdown-m2o', display: 'related', width: 'full' },
            schema: { foreign_key_table: 'matches', foreign_key_column: 'id' }
        },
        { field: 'background_color', type: 'string', meta: { interface: 'color', width: 'half' }, schema: { default_value: '#000000' } },
        { field: 'text_color', type: 'string', meta: { interface: 'color', width: 'half' }, schema: { default_value: '#FFFFFF' } },
        { field: 'show_timer', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } },
        { field: 'show_period', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } },
        { field: 'show_fouls', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } },
        { field: 'show_timeouts', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } },
        { field: 'show_players', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } },
        { field: 'show_player_stats', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } },
        { field: 'primary_color_home', type: 'string', meta: { interface: 'color', width: 'half', note: 'Override home team color' }, schema: {} },
        { field: 'primary_color_away', type: 'string', meta: { interface: 'color', width: 'half', note: 'Override away team color' }, schema: {} },
        { field: 'label_period', type: 'string', meta: { interface: 'input', width: 'half' }, schema: {} },
        { field: 'label_fouls', type: 'string', meta: { interface: 'input', width: 'half' }, schema: {} }
    ];

    for (const field of fields) {
        try {
            const res = await fetch(`${DIRECTUS_URL}/fields/boards`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(field)
            });

            if (res.ok) {
                console.log(`Field "${field.field}" created.`);
            } else {
                const err = await res.json();
                if (err.errors?.[0]?.code !== 'RECORD_NOT_UNIQUE') {
                    console.error(`Error creating field "${field.field}":`, err);
                } else {
                    console.log(`Field "${field.field}" already exists.`);
                }
            }
        } catch (e) {
            console.error(`Error creating field "${field.field}":`, e);
        }
    }

    console.log('Boards Collection setup complete.');
}

setupBoardsCollection().catch(console.error);
