'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItem, updateItem, readMe } from '@directus/sdk';
import { Match } from '@/types/directus';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function ControlPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [localTimer, setLocalTimer] = useState(0);

    // Check Auth
    useEffect(() => {
        const checkAuth = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 100));

                const token = await directus.getToken();
                if (!token) {
                    router.push('/login');
                    return;
                }

                // Verify token validity
                await directus.request(readMe());
                setIsAuthenticated(true);
            } catch (e) {
                console.error("Auth check failed:", e);
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);

    // Fetch initial match
    useEffect(() => {
        if (!id || !isAuthenticated) return;
        const fetchMatch = async () => {
            try {
                const data = await directus.request(readItem('matches', id, {
                    fields: ['*', 'home_team.*', 'away_team.*']
                }));

                setMatch(data as Match);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMatch();
    }, [id, isAuthenticated]);

    // Timer simulation for Control UI (visual only, independent of Board logic)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const updateLocalTimer = () => {
            if (!match) return;

            if (match.status === 'live' && match.timer_started_at) {
                const now = new Date().getTime();
                const startedAt = new Date(match.timer_started_at).getTime();
                const elapsed = Math.floor((now - startedAt) / 1000);
                setLocalTimer(Math.max(0, match.timer_seconds - elapsed));
            } else {
                setLocalTimer(match.timer_seconds);
            }
        }

        updateLocalTimer();
        interval = setInterval(updateLocalTimer, 200);
        return () => clearInterval(interval);
    }, [match]);

    const toggleTimer = async () => {
        if (!match) return;

        const isLive = match.status === 'live';

        if (isLive) {
            // PAUSE: Calculate elapsed time and save new timer_seconds
            const now = new Date().getTime();
            const startedAt = new Date(match.timer_started_at!).getTime();
            const elapsed = Math.floor((now - startedAt) / 1000);
            const newRemaining = Math.max(0, match.timer_seconds - elapsed);

            await directus.request(updateItem('matches', match.id, {
                status: 'paused',
                timer_seconds: newRemaining,
                timer_started_at: null
            }));

            setMatch(prev => ({ ...prev!, status: 'paused', timer_seconds: newRemaining, timer_started_at: null }));

        } else {
            // START: Current time becomes timer_started_at
            const now = new Date().toISOString();

            await directus.request(updateItem('matches', match.id, {
                status: 'live',
                timer_started_at: now
            }));

            setMatch(prev => ({ ...prev!, status: 'live', timer_started_at: now }));
        }
    };

    const resetTimer = async () => {
        if (!match) return;
        await directus.request(updateItem('matches', match.id, {
            timer_seconds: 600,
            status: 'paused',
            timer_started_at: null
        }));
        setMatch(prev => ({ ...prev!, timer_seconds: 600, status: 'paused', timer_started_at: null }));
    };

    const updateScore = async (team: 'home' | 'away', delta: number) => {
        if (!match) return;
        const field = team === 'home' ? 'home_score' : 'away_score';
        const newScore = Math.max(0, (match as any)[field] + delta);
        setMatch(prev => ({ ...prev!, [field]: newScore }));
        await directus.request(updateItem('matches', match.id, { [field]: newScore }));
    };

    if (loading) return <div className="p-8 text-white">Loading Controller...</div>;
    if (!match) return <div className="p-8 text-white">Match not found.</div>;

    const homeName = typeof match.home_team === 'object' ? match.home_team.name : 'Home';
    const awayName = typeof match.away_team === 'object' ? match.away_team.name : 'Away';
    const isRunning = match.status === 'live';

    return (
        <main className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col gap-6">
            <header className="flex justify-between items-center bg-slate-800 p-4 rounded-xl">
                <h1 className="text-xl font-bold">Creative Score Controller</h1>
                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${isRunning ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {isRunning ? 'LIVE' : 'PAUSED'}
                    </span>
                </div>
            </header>

            {/* Timer Control */}
            <section className="bg-slate-800 p-6 rounded-2xl flex flex-col items-center">
                <div className="text-7xl font-mono font-bold mb-6 text-white tabular-nums">
                    {Math.floor(localTimer / 60).toString().padStart(2, '0')}:
                    {(localTimer % 60).toString().padStart(2, '0')}
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={toggleTimer}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRunning ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'}`}
                    >
                        {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                    </button>
                    <button
                        onClick={resetTimer}
                        className="w-24 h-24 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all"
                    >
                        <RotateCcw size={32} />
                    </button>
                </div>
            </section>

            {/* Teams Control */}
            <div className="grid grid-cols-2 gap-6 flex-1">
                {/* Home */}
                <div className="bg-slate-800 p-6 rounded-2xl flex flex-col items-center gap-4 border-t-4 border-purple-500">
                    <h2 className="text-2xl font-bold uppercase">{homeName}</h2>
                    <div className="text-8xl font-bold">{match.home_score}</div>
                    <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                        <button onClick={() => updateScore('home', 1)} className="aspect-square bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-xl">+1</button>
                        <button onClick={() => updateScore('home', 2)} className="aspect-square bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-xl">+2</button>
                        <button onClick={() => updateScore('home', 3)} className="aspect-square bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-xl">+3</button>
                        <button onClick={() => updateScore('home', -1)} className="aspect-square bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-xl font-bold text-xl col-span-3">-1</button>
                    </div>
                </div>

                {/* Away */}
                <div className="bg-slate-800 p-6 rounded-2xl flex flex-col items-center gap-4 border-t-4 border-green-500">
                    <h2 className="text-2xl font-bold uppercase">{awayName}</h2>
                    <div className="text-8xl font-bold">{match.away_score}</div>
                    <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                        <button onClick={() => updateScore('away', 1)} className="aspect-square bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-xl">+1</button>
                        <button onClick={() => updateScore('away', 2)} className="aspect-square bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-xl">+2</button>
                        <button onClick={() => updateScore('away', 3)} className="aspect-square bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-xl">+3</button>
                        <button onClick={() => updateScore('away', -1)} className="aspect-square bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-xl font-bold text-xl col-span-3">-1</button>
                    </div>
                </div>
            </div>
        </main>
    );
}
