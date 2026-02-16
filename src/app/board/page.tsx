'use client';

import { useEffect, useState, useRef } from 'react';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Match } from '@/types/directus';
import { AnimatePresence, motion } from 'framer-motion';

export default function BoardPage() {
    const [match, setMatch] = useState<Match | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Independent visual timer state
    const [displayTime, setDisplayTime] = useState(0);

    // Fetch initial data
    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const matches = await directus.request(readItems('matches', {
                    filter: { status: { _in: ['live', 'scheduled', 'paused'] } },
                    limit: 1,
                    fields: ['*', 'home_team.*', 'away_team.*', 'sport.*'] as any
                }));

                if (matches && (matches as any).length > 0) {
                    const m = matches[0] as Match;
                    setMatch(m);
                } else {
                    setError('No active match found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load match data');
            }
        };

        fetchMatch();
    }, []);

    // Realtime subscription
    useEffect(() => {
        if (!match) return;

        const connectRealtime = async () => {
            const { subscription } = await directus.subscribe('matches', {
                query: { filter: { id: { _eq: match.id } }, fields: ['*', 'home_team.*', 'away_team.*', 'sport.*'] as any },
            });

            for await (const update of subscription) {
                if (update.event === 'update' && update.data.length > 0) {
                    setMatch((prev) => ({ ...prev!, ...update.data[0] }));
                }
            }
        }

        connectRealtime();
    }, [match?.id]);

    // Precise Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const updateTimer = () => {
            if (!match) return;

            if (match.status === 'live' && match.timer_started_at) {
                const now = new Date().getTime();
                const startedAt = new Date(match.timer_started_at).getTime();
                const elapsedSeconds = Math.floor((now - startedAt) / 1000);

                // Calculate remaining time based on initial saved time minus elapsed real time
                const remaining = Math.max(0, match.timer_seconds - elapsedSeconds);
                setDisplayTime(remaining);
            } else {
                // If paused/scheduled, just show the static saved time
                setDisplayTime(match.timer_seconds);
            }
        };

        // Run immediately
        updateTimer();

        // Run every 100ms for smooth updates (though we display seconds)
        interval = setInterval(updateTimer, 100);

        return () => clearInterval(interval);
    }, [match]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <h1 className="text-4xl font-bold text-red-500">{error}</h1>
            </div>
        );
    }

    if (!match) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <h1 className="text-4xl font-bold animate-pulse">Loading Scoreboard...</h1>
            </div>
        );
    }

    const homeTeam = typeof match.home_team === 'object' ? match.home_team : { name: 'Home', primary_color: '#333' };
    const awayTeam = typeof match.away_team === 'object' ? match.away_team : { name: 'Away', primary_color: '#333' };

    return (
        <main className="min-h-screen bg-black text-white overflow-hidden relative font-sans">
            <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-[var(--home-color)] to-[var(--away-color)]"
                style={{ '--home-color': homeTeam.primary_color, '--away-color': awayTeam.primary_color } as any}
            />

            <div className="relative z-10 flex flex-col h-screen p-8">
                <header className="flex justify-between items-center mb-8">
                    <div className="text-2xl font-bold uppercase tracking-widest opacity-80">
                        {typeof match.sport === 'object' ? match.sport.name : 'Sport'}
                    </div>

                    <div className="bg-gray-900 px-8 py-2 rounded-xl border border-gray-700">
                        <span className="text-6xl font-mono font-bold text-yellow-400">
                            {Math.floor(displayTime / 60).toString().padStart(2, '0')}:
                            {(displayTime % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    <div className="text-2xl font-bold uppercase tracking-widest opacity-80">
                        Period {match.current_period}
                    </div>
                </header>

                <div className="flex-1 grid grid-cols-3 gap-8 items-center">
                    <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-gray-900/50 backdrop-blur-md border border-gray-800 h-full">
                        <div className="text-4xl font-black uppercase mb-4 text-center">{homeTeam.name}</div>
                        <motion.div
                            key={match.home_score}
                            initial={{ scale: 1.5, color: '#ffff00' }}
                            animate={{ scale: 1, color: '#ffffff' }}
                            className="text-[12rem] leading-none font-bold"
                        >
                            {match.home_score}
                        </motion.div>
                        <div className="mt-8 flex gap-4 text-2xl text-gray-400">
                            <div>Fouls: <span className="text-white font-bold">{match.gamestate?.fouls_home || 0}</span></div>
                            <div>Timeouts: <span className="text-white font-bold">{match.gamestate?.timeouts_home || 0}</span></div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center opacity-50">
                        <span className="text-9xl font-black italic">VS</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-gray-900/50 backdrop-blur-md border border-gray-800 h-full">
                        <div className="text-4xl font-black uppercase mb-4 text-center">{awayTeam.name}</div>
                        <motion.div
                            key={match.away_score}
                            initial={{ scale: 1.5, color: '#ffff00' }}
                            animate={{ scale: 1, color: '#ffffff' }}
                            className="text-[12rem] leading-none font-bold"
                        >
                            {match.away_score}
                        </motion.div>
                        <div className="mt-8 flex gap-4 text-2xl text-gray-400">
                            <div>Fouls: <span className="text-white font-bold">{match.gamestate?.fouls_away || 0}</span></div>
                            <div>Timeouts: <span className="text-white font-bold">{match.gamestate?.timeouts_away || 0}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
