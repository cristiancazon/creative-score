import { directus } from '../src/lib/directus';
import { authentication } from '@directus/sdk';

// This script is meant to be run manually to seed data
// Usage: tsX scripts/seed.ts (requires tsx or similar runner)
// For now, we'll just incorporate this logic into a simple specialized component or run it somehow.
// Actually, since we are in a Next.js environment, I can make a temporary page to run this.

const seed = async () => {
    // Login first
    await directus.login('admin@example.com', 'admin');

    console.log('Seeding Sports...');
    const basketball = await directus.request(
        directus.items('sports' as any).createOne({
            name: 'Basketball',
            slug: 'basketball',
            rules_config: {
                periods: 4,
                period_duration: 600,
                shot_clock: 24,
            }
        })
    ).catch(() => console.log('Basketball already exists?'));

    console.log('Seeding Teams...');
    const homeTeam = await directus.request(
        directus.items('teams' as any).createOne({
            name: 'Los Angeles Lakers',
            short_name: 'LAL',
            primary_color: '#552583',
            secondary_color: '#FDB927',
        })
    );

    const awayTeam = await directus.request(
        directus.items('teams' as any).createOne({
            name: 'Boston Celtics',
            short_name: 'BOS',
            primary_color: '#007A33',
            secondary_color: '#BA9653',
        })
    );

    console.log('Seeding Match...');
    const match = await directus.request(
        directus.items('matches' as any).createOne({
            start_time: new Date().toISOString(),
            sport: (basketball as any).id,
            home_team: (homeTeam as any).id,
            away_team: (awayTeam as any).id,
            status: 'scheduled',
            home_score: 0,
            away_score: 0,
            current_period: 1,
            timer_seconds: 600,
            gamestate: {
                possession: 'home',
                fouls_home: 0,
                fouls_away: 0,
                timeouts_home: 3,
                timeouts_away: 3
            }
        })
    );

    return match;
};
