'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItem, updateItem, readMe, readItems } from '@directus/sdk';
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
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [editMinutes, setEditMinutes] = useState(0);
    const [editSeconds, setEditSeconds] = useState(0);
    const [periodDuration, setPeriodDuration] = useState(10); // Local state for the input, updated by match load

    // Player State
    const [homePlayers, setHomePlayers] = useState<any[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<any[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<{ id: string, name: string, number: number, team: 'home' | 'away' } | null>(null);
    const [subTarget, setSubTarget] = useState<{ id: string, name: string, number: number, team: 'home' | 'away' } | null>(null); // Player being subbed out

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

    // Fetch initial match AND players
    useEffect(() => {
        if (!id || !isAuthenticated) return;
        const fetchData = async () => {
            try {
                // 1. Fetch Match
                const matchData = await directus.request(readItem('matches', id, {
                    fields: ['*', 'home_team.*', 'away_team.*'] as any
                })) as unknown as Match;
                setMatch(matchData);

                // Initialize local period duration based on whether we are in OT or regular, and user config
                const maxPeriods = matchData.max_periods || 4;
                const pLen = matchData.period_length || 10;
                const otLen = matchData.overtime_length || 5;
                const currentP = matchData.current_period || 1;
                
                if (currentP > maxPeriods) {
                    setPeriodDuration(otLen);
                } else {
                    setPeriodDuration(pLen);
                }

                // 2. Fetch Players
                const homeTeamId = typeof matchData.home_team === 'object' ? matchData.home_team.id : matchData.home_team;
                const awayTeamId = typeof matchData.away_team === 'object' ? matchData.away_team.id : matchData.away_team;

                if (homeTeamId && awayTeamId) {
                    // @ts-ignore
                    const playersData = await directus.request(readItems('players', {
                        filter: {
                            _or: [
                                { team: { _eq: homeTeamId } },
                                { team: { _eq: awayTeamId } }
                            ]
                        },
                        limit: 100
                    }));

                    // Filter and Assign
                    const realHome = playersData.filter((p: any) => (typeof p.team === 'object' ? p.team.id : p.team) === homeTeamId);
                    const realAway = playersData.filter((p: any) => (typeof p.team === 'object' ? p.team.id : p.team) === awayTeamId);

                    // Fallback Generation
                    const generateRoster = (teamId: string) => Array.from({ length: 12 }, (_, i) => ({
                        id: `temp_${teamId}_${i + 4}`,
                        name: `Player ${i + 4}`,
                        number: i + 4,
                        team: teamId,
                        temp: true
                    }));

                    const finalHome = realHome.length > 0 ? realHome.sort((a: any, b: any) => a.number - b.number) : generateRoster(homeTeamId);
                    const finalAway = realAway.length > 0 ? realAway.sort((a: any, b: any) => a.number - b.number) : generateRoster(awayTeamId);

                    setHomePlayers(finalHome);
                    setAwayPlayers(finalAway);

                    // Initialize On Court if needed (First 5)
                    // @ts-ignore
                    if (!matchData.gamestate?.home_on_court && finalHome.length > 0) {
                        const onCourt = finalHome.slice(0, 5).map((p: any) => p.id);
                        // @ts-ignore
                        matchData.gamestate = { ...matchData.gamestate, home_on_court: onCourt };
                        // trigger update? We can just do it locally and let the user save or do it silently? 
                        // Better to save it so it persists.
                        // We'll trust the user to 'Sub' to fix it, or we can just save it now.
                        // Let's optimistic set it in state for now, maybe save later or reliance on manual sub.
                        // Actually, to ensure consistency, let's silence update it if missing.
                        directus.request(updateItem('matches', id, { gamestate: { ...matchData.gamestate, home_on_court: onCourt } }));
                    }
                    // @ts-ignore
                    if (!matchData.gamestate?.away_on_court && finalAway.length > 0) {
                        const onCourt = finalAway.slice(0, 5).map((p: any) => p.id);
                        // @ts-ignore
                        matchData.gamestate = { ...matchData.gamestate, away_on_court: onCourt };
                        directus.request(updateItem('matches', id, { gamestate: { ...matchData.gamestate, away_on_court: onCourt } }));
                    }

                    setMatch({ ...matchData }); // Update with initialized gamestate

                } // Close if (homeTeamId && awayTeamId)
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isAuthenticated]);

    // Timer simulation for Control UI (visual only, independent of Board logic)    // Timer simulation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const updateLocalTimer = () => {
            if (!match) return;
            if (isEditingTime) return; // Don't override while editing

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
    }, [match, isEditingTime]);

    // Auto-pause at 0
    useEffect(() => {
        if (localTimer === 0 && match?.status === 'live' && !isEditingTime) {
            const autoPause = async () => {
                await directus.request(updateItem('matches', match.id, {
                    status: 'paused',
                    timer_seconds: 0,
                    timer_started_at: null
                }));
                // @ts-ignore
                setMatch(prev => prev ? { ...prev, status: 'paused', timer_seconds: 0, timer_started_at: null } : null);
            };
            autoPause();
        }
    }, [localTimer, match?.status, isEditingTime]);

    const toggleTimer = async () => {
        if (!match) return;
        if (match.status === 'finished') return; // Do nothing if the game is already finished

        const gamestate = match.gamestate || {};
        const isET = gamestate.is_et;

        if (localTimer === 0 && !isET) {
            const isGameOver = (match.current_period || 1) >= (match.max_periods || 4) && match.home_score !== match.away_score;

            if (isGameOver) {
                const newGamestate = { ...gamestate, is_et: false };
                await directus.request(updateItem('matches', match.id, {
                    status: 'finished',
                    timer_seconds: 0,
                    timer_started_at: null,
                    gamestate: newGamestate
                }));
                // @ts-ignore
                setMatch(prev => prev ? { ...prev, status: 'finished', timer_seconds: 0, timer_started_at: null, gamestate: newGamestate } : null);
                return;
            }

            // Enter Half-Time (ET - 120s)
            const now = new Date().toISOString();
            const newGamestate = { ...gamestate, is_et: true };
            await directus.request(updateItem('matches', match.id, {
                status: 'live',
                timer_seconds: 120,
                timer_started_at: now,
                gamestate: newGamestate
            }));
            // @ts-ignore
            setMatch(prev => prev ? { ...prev, status: 'live', timer_seconds: 120, timer_started_at: now, gamestate: newGamestate } : null);
            return;
        }

        if (isET) {
            // End Half-Time and go to Next Period
            const nextPeriod = (match.current_period || 1) + 1;
            const maxPeriods = match.max_periods || 4;
            const pLen = match.period_length || 10;
            const otLen = match.overtime_length || 5;
            const newSeconds = (nextPeriod > maxPeriods ? otLen : pLen) * 60;
            const newGamestate = { ...gamestate, is_et: false, home_timeouts: 0, away_timeouts: 0, home_fouls: 0, away_fouls: 0 };

            await directus.request(updateItem('matches', match.id, {
                status: 'paused',
                timer_seconds: newSeconds,
                timer_started_at: null,
                current_period: nextPeriod,
                gamestate: newGamestate
            }));
            // @ts-ignore
            setMatch(prev => prev ? { ...prev, status: 'paused', timer_seconds: newSeconds, timer_started_at: null, current_period: nextPeriod, gamestate: newGamestate } : null);
            setPeriodDuration(nextPeriod > maxPeriods ? otLen : pLen);
            return;
        }

        const isLive = match.status === 'live';

        if (isLive) {
            // PAUSE: Calculate elapsed time and save new timer_seconds
            const now = new Date().getTime();
            const startedAt = new Date(match.timer_started_at!).getTime();
            const elapsed = Math.floor((now - startedAt) / 1000);
            const newRemaining = Math.max(0, match.timer_seconds - elapsed);

            let newObj: any = {
                status: 'paused',
                timer_seconds: newRemaining,
                timer_started_at: null
            };

            let newGamestate = { ...gamestate };
            if (newGamestate?.shot_clock?.started_at) {
                 const scStartedAt = new Date(newGamestate.shot_clock.started_at).getTime();
                 const scElapsed = Math.floor((now - scStartedAt) / 1000);
                 const scRemaining = Math.max(0, newGamestate.shot_clock.seconds - scElapsed);
                 newGamestate.shot_clock = {
                     seconds: scRemaining,
                     started_at: null
                 };
                 newObj.gamestate = newGamestate;
            }

            await directus.request(updateItem('matches', match.id, newObj));

            // @ts-ignore
            setMatch(prev => ({ ...prev!, ...newObj }));

        } else {
            // START: Current time becomes timer_started_at
            const nowIso = new Date().toISOString();

            let newObj: any = {
                status: 'live',
                timer_started_at: nowIso
            };

            let newGamestate = { ...gamestate };
            if (newGamestate?.shot_clock?.seconds !== undefined && !newGamestate?.shot_clock?.started_at) {
                newGamestate.shot_clock = {
                    ...newGamestate.shot_clock,
                    started_at: nowIso
                };
                newObj.gamestate = newGamestate;
            }

            await directus.request(updateItem('matches', match.id, newObj));

            // @ts-ignore
            setMatch(prev => ({ ...prev!, ...newObj }));
        }
    };

    const resetTimer = async () => {
        if (!match) return;
        const seconds = periodDuration * 60;
        await directus.request(updateItem('matches', match.id, {
            timer_seconds: seconds,
            status: 'paused',
            timer_started_at: null
        }));
        setMatch(prev => ({ ...prev!, timer_seconds: seconds, status: 'paused', timer_started_at: null }));
    };

    const resetShotClock = async (seconds: 14 | 24) => {
        if (!match) return;
        const isLive = match.status === 'live';
        const newShotClock = {
            seconds: seconds,
            started_at: isLive ? new Date().toISOString() : null
        };
        const newGamestate = {
            ...match.gamestate,
            shot_clock: newShotClock
        };
        await directus.request(updateItem('matches', match.id, {
            gamestate: newGamestate
        }));
        // @ts-ignore
        setMatch(prev => ({ ...prev!, gamestate: newGamestate }));
    };


    const resetMatchFull = async () => {
        if (!match) return;
        const confirmed = window.confirm("🚨 ARE YOU SURE YOU WANT TO RESET THIS MATCH? 🚨\n\nThis will permanently erase all scores, fouls, periods, play-by-play events, and reset the clock. This action CANNOT be undone.");
        if (!confirmed) return;

        const basePeriodLen = match.period_length || 10;
        const seconds = basePeriodLen * 60;

        const clearedGamestate = {
            ...match.gamestate,
            player_stats: {},
            events: [],
            home_on_court: [],
            away_on_court: [],
            home_fouls: 0,
            away_fouls: 0,
            home_timeouts: 0,
            away_timeouts: 0
        };

        const resetData = {
            home_score: 0,
            away_score: 0,
            current_period: 1,
            timer_seconds: seconds,
            status: 'paused',
            timer_started_at: null,
            gamestate: clearedGamestate
        };

        try {
            await directus.request(updateItem('matches', match.id, resetData));
            setPeriodDuration(basePeriodLen);
            // @ts-ignore
            setMatch(prev => ({ ...prev!, ...resetData }));
        } catch (e: any) {
            alert(`Failed to reset match: ${e.message}`);
        }
    };

    // Keep periodDuration in sync with period changes
    const changePeriod = async (delta: number) => {
        if (!match) return;
        const newPeriod = Math.max(1, (match.current_period || 1) + delta);
        
        const maxPeriods = match.max_periods || 4;
        const pLen = match.period_length || 10;
        const otLen = match.overtime_length || 5;
        
        const newPeriodDuration = newPeriod > maxPeriods ? otLen : pLen;
        const newGamestate = { ...match.gamestate, home_timeouts: 0, away_timeouts: 0, home_fouls: 0, away_fouls: 0 };

        setPeriodDuration(newPeriodDuration);
        setMatch(prev => ({ ...prev!, current_period: newPeriod, gamestate: newGamestate }));
        directus.request(updateItem('matches', match.id, { current_period: newPeriod, gamestate: newGamestate }));
    };

    const saveTime = async () => {
        if (!match) return;
        const totalSeconds = (editMinutes * 60) + editSeconds;

        // Always pause when manually editing time
        await directus.request(updateItem('matches', match.id, {
            timer_seconds: totalSeconds,
            status: 'paused',
            timer_started_at: null
        }));

        setMatch(prev => ({
            ...prev!,
            timer_seconds: totalSeconds,
            status: 'paused',
            timer_started_at: null
        }));
        setLocalTimer(totalSeconds);
        setIsEditingTime(false);
    };

    const handleTimeout = async (team: 'home' | 'away') => {
        if (!match) return;
        const field = team === 'home' ? 'home_timeouts' : 'away_timeouts';
        const currentCount = match.gamestate?.[field] || 0;

        if (currentCount >= 3) return; // limit 3 per quarter

        const newGamestate = { ...match.gamestate, [field]: currentCount + 1 };
        
        // Pause timer if live
        let newRemaining = localTimer;
        let newStatus = match.status;

        if (match.status === 'live') {
            const startedAt = new Date(match.timer_started_at!).getTime();
            const elapsed = Math.floor((new Date().getTime() - startedAt) / 1000);
            newRemaining = Math.max(0, match.timer_seconds - elapsed);
            newStatus = 'paused';
        }

        setMatch(prev => ({ ...prev!, status: newStatus as any, timer_seconds: newRemaining, timer_started_at: null, gamestate: newGamestate }));

        try {
            await directus.request(updateItem('matches', match.id, { 
                gamestate: newGamestate,
                status: newStatus,
                timer_seconds: newRemaining,
                timer_started_at: null
            }));
        } catch (e: any) {
            console.error("TIMEOUT FAILED:", e);
        }
    };

    const handlePlayerAction = async (type: 'pts' | 'foul', value: number) => {
        if (!match || !selectedPlayer) return;

        // 1. Calculate new values
        const currentStats = match.gamestate?.player_stats || {};
        const playerStats = currentStats[selectedPlayer.id] || { points: 0, fouls: 0 };

        let newPoints = playerStats.points;
        let newFouls = playerStats.fouls;

        if (type === 'pts') {
            newPoints = Math.max(0, playerStats.points + value); // Prevent negative
        } else if (type === 'foul') {
            newFouls = Math.max(0, playerStats.fouls + value);
            newFouls = Math.min(newFouls, 5); // Cap player fouls at 5
        }

        // 2. Update Global Match Stats (Score / Team Fouls)
        // We only update global score/fouls if the player stat actually changed (e.g. didn't hit 0 floor)
        // Actually, for simplicity and trust in operator, we just apply the delta to the team score too.
        // If I subtract 1 point from player, I subtract 1 from team.
        const isHome = selectedPlayer.team === 'home';
        const scoreField = isHome ? 'home_score' : 'away_score';
        const foulField = isHome ? 'home_fouls' : 'away_fouls';

        const currentScore = Number((match as any)[scoreField]) || 0;
        const newTeamScore = Math.max(0, currentScore + (type === 'pts' ? value : 0));
        // @ts-ignore
        const currentTeamFouls = Number(match.gamestate?.[foulField]) || 0;
        let newTeamFouls = Math.max(0, currentTeamFouls + (type === 'foul' ? value : 0));
        newTeamFouls = Math.min(newTeamFouls, 5); // Cap team fouls at 5

        // 3. Play-By-Play Logging (Events)
        // If it's a positive number, we add it. If negative, we try to pop the last event of that type.
        let updatedEvents = [...(match.gamestate?.events || [])];
        
        if (value > 0) {
            updatedEvents.push({
                id: Math.random().toString(36).substring(2, 9),
                type,
                value,
                player_id: selectedPlayer.id,
                team: isHome ? 'home' : 'away',
                period: match.current_period || 1,
                time_remaining: match.timer_seconds, // The clock at the moment the button was pressed
                timestamp: new Date().toISOString()
            });
        } else {
            // Undo: Find the last event matching this player and type, and remove it
            const idx = updatedEvents.map(e => ({...e})).reverse().findIndex(e => e.player_id === selectedPlayer.id && e.type === type);
            if (idx !== -1) {
                // Reverse index mapped to original array
                const realIdx = updatedEvents.length - 1 - idx;
                updatedEvents.splice(realIdx, 1);
            }
        }

        // 4. Construct new GameState
        const newGamestate = {
            ...match.gamestate,
            [foulField]: newTeamFouls,
            events: updatedEvents,
            player_stats: {
                ...currentStats,
                [selectedPlayer.id]: {
                    ...playerStats,
                    points: newPoints,
                    fouls: newFouls
                }
            }
        };

        // 4. Optimistic Update & Save
        setMatch(prev => ({
            ...prev!,
            [scoreField]: newTeamScore,
            gamestate: newGamestate
        }));

        try {
            await directus.request(updateItem('matches', match.id, {
                [scoreField]: newTeamScore,
                gamestate: newGamestate
            }));
        } catch (e: any) {
            console.error("UPDATE FAILED:", e);
            if (e.errors) console.error("DIRECTUS ERRORS:", JSON.stringify(e.errors, null, 2));
            alert(`Failed to save! Error: ${e.message || 'Unknown'}`);
        }
    };

    const handleSubstitution = async () => {
        if (!match || !selectedPlayer) return;

        const isHome = selectedPlayer.team === 'home';
        const field = isHome ? 'home_on_court' : 'away_on_court';
        // @ts-ignore
        const currentOnCourt = (match.gamestate?.[field] || []) as string[];

        // Case 1: Player is ON COURT -> Initiate Swap (Select replacement)
        if (currentOnCourt.includes(selectedPlayer.id)) {
            setSubTarget(selectedPlayer);
            // We don't close the modal yet, but we change its view to "Select Replacement"
            return;
        }

        // Case 2: Player is ON BENCH -> Direct Swap not allowed via clicking Bench player first (as per user request).
        // User said: "al presionar sobre un jugador que está en court... me tienen que aparecer los otros jugadores que están en bench"
        // So jumping strictly to requirements, we only allow sub start from Court player.
        // But for flexibility, if they click bench, maybe we just say "Select player on court to replace"?
        // For now, let's just do nothing or show message.
        alert("Select an ON COURT player to substitute.");
    };

    const confirmSubstitution = async (benchPlayerId: string) => {
        if (!match || !subTarget) return;

        const isHome = subTarget.team === 'home';
        const field = isHome ? 'home_on_court' : 'away_on_court';
        // @ts-ignore
        const currentOnCourt = (match.gamestate?.[field] || []) as string[];

        // Swap: Remove subTarget, Add benchPlayerId
        const newOnCourt = currentOnCourt.map(id => id === subTarget.id ? benchPlayerId : id);

        const newGamestate = { ...match.gamestate, [field]: newOnCourt };

        // Optimistic
        setMatch(prev => ({ ...prev!, gamestate: newGamestate }));

        // Background Save
        await directus.request(updateItem('matches', match.id, { gamestate: newGamestate }));

        // Reset/Close
        setSubTarget(null);
        setSelectedPlayer(null);
    };

    if (loading) return <div className="p-8 text-white">Loading Controller...</div>;
    if (!match) return <div className="p-8 text-white">Match not found.</div>;

    const homeName = typeof match.home_team === 'object' ? match.home_team.name : 'Home';
    const awayName = typeof match.away_team === 'object' ? match.away_team.name : 'Away';
    const isRunning = match.status === 'live';
    const isET = match.gamestate?.is_et;

    // Roster Helpers
    // @ts-ignore
    const homeOnCourt = homePlayers.filter(p => match.gamestate?.home_on_court?.includes(p.id));
    // @ts-ignore
    const homeBench = homePlayers.filter(p => !match.gamestate?.home_on_court?.includes(p.id));
    // @ts-ignore
    const awayOnCourt = awayPlayers.filter(p => match.gamestate?.away_on_court?.includes(p.id));
    // @ts-ignore
    const awayBench = awayPlayers.filter(p => !match.gamestate?.away_on_court?.includes(p.id));

    return (
        <main className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col gap-6">
            <header className="flex justify-between items-center bg-slate-800 p-4 rounded-xl">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold mr-2">Creative Score Controller</h1>
                    <button 
                        onClick={resetMatchFull}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-900/40 text-red-500 hover:bg-red-600 hover:text-white border border-red-900 transition-colors uppercase tracking-wider"
                        title="Erase all scores and reset match"
                    >
                        ⚠️ Reset Match
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.open(`/report/${match.id}/visual`, '_blank')}
                        className="px-4 py-1.5 rounded-lg text-sm font-bold bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center gap-2 shadow-lg shadow-cyan-900/20"
                        title="Open Visual Live Report Tracking"
                    >
                        🌐 Live Visual Report
                    </button>
                    <button 
                        onClick={() => window.open(`/report/${match.id}`, '_blank')}
                        className="px-4 py-1.5 rounded-lg text-sm font-bold bg-slate-700 hover:bg-slate-600 transition-colors flex items-center gap-2"
                        title="Generate Official Match Report (A4 PDF)"
                    >
                        📋 PDF Report
                    </button>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${isRunning ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {isRunning ? 'LIVE' : 'PAUSED'}
                    </span>
                </div>
            </header>

            {/* Timer Control */}
            <section className="bg-slate-800 p-6 rounded-2xl flex flex-col items-center gap-6">

                {/* Period Control */}
                <div className="flex items-center gap-4 text-slate-400">
                    <button
                        onClick={() => changePeriod(-1)}
                        className="p-2 hover:bg-slate-700 rounded-lg"
                    >
                        &lt;
                    </button>
                    <span className="font-bold tracking-widest uppercase">
                        {match.current_period > (match.max_periods || 4) 
                            ? `OT ${match.current_period - (match.max_periods || 4)}` 
                            : `PERIOD ${match.current_period}`}
                    </span>
                    <button
                        onClick={() => changePeriod(1)}
                        className="p-2 hover:bg-slate-700 rounded-lg"
                    >
                        &gt;
                    </button>
                </div>

                {/* Clock Display / Editor */}
                {/* Clock Display / Editor */}
                {isEditingTime ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-5xl font-mono font-bold text-white">
                            <input
                                type="number"
                                value={editMinutes}
                                onChange={e => setEditMinutes(parseInt(e.target.value) || 0)}
                                className="bg-slate-700 text-center w-24 p-2 rounded-lg"
                            />
                            <span>:</span>
                            <input
                                type="number"
                                value={editSeconds}
                                onChange={e => setEditSeconds(parseInt(e.target.value) || 0)}
                                className="bg-slate-700 text-center w-24 p-2 rounded-lg"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={saveTime}
                                className="bg-green-600 hover:bg-green-500 px-4 py-1 rounded text-sm font-bold"
                            >
                                SAVE
                            </button>
                            <button
                                onClick={() => setIsEditingTime(false)}
                                className="bg-slate-600 hover:bg-slate-500 px-4 py-1 rounded text-sm"
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => {
                            setEditMinutes(Math.floor(localTimer / 60));
                            setEditSeconds(localTimer % 60);
                            setIsEditingTime(true);
                        }}
                        className="text-7xl font-mono font-bold text-white tabular-nums cursor-pointer hover:text-yellow-400 transition-colors"
                        title="Click to Edit Time"
                    >
                        {Math.floor(localTimer / 60).toString().padStart(2, '0')}:
                        {(localTimer % 60).toString().padStart(2, '0')}
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center gap-2 mr-4">
                        <button
                            onClick={() => resetShotClock(24)}
                            className="w-16 h-10 rounded-lg bg-red-900/40 hover:bg-red-600 text-red-500 hover:text-white border border-red-900 flex items-center justify-center transition-all font-black text-xl"
                            title="Reset shot clock to 24s"
                        >
                            24
                        </button>
                        <button
                            onClick={() => resetShotClock(14)}
                            className="w-16 h-10 rounded-lg bg-red-900/40 hover:bg-red-600 text-red-500 hover:text-white border border-red-900 flex items-center justify-center transition-all font-black text-xl"
                            title="Reset shot clock to 14s"
                        >
                            14
                        </button>
                    </div>
                
                    <button
                        onClick={toggleTimer}
                        className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all shadow-lg text-white font-bold text-center leading-tight
                            ${match.status === 'finished'
                                ? 'bg-red-700 cursor-not-allowed'
                                : (isET 
                                    ? 'bg-orange-600 hover:bg-orange-500' // skip ET
                                    : (localTimer === 0 
                                        ? (((match.current_period || 1) >= (match.max_periods || 4) && match.home_score !== match.away_score) ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500') // Start ET or Finish
                                        : (isRunning ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500')))
                            }`}
                    >
                        {match.status === 'finished' ? 'FINISHED' : (isET ? 'NEXT Q' : (localTimer === 0 ? (((match.current_period || 1) >= (match.max_periods || 4) && match.home_score !== match.away_score) ? 'FINISH MATCH' : 'ET (2m)') : (isRunning ? <Pause size={32} /> : <Play size={32} className="ml-2" />)))}
                    </button>

                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={resetTimer}
                            className="w-16 h-16 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all"
                        >
                            <RotateCcw size={24} />
                        </button>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <span>Reset to:</span>
                            <input
                                type="number"
                                value={periodDuration}
                                onChange={e => setPeriodDuration(parseInt(e.target.value) || 0)}
                                className="w-8 bg-transparent text-center border-b border-slate-600 focus:border-white outline-none"
                            />
                            <span>m</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Teams Control */}
            <div className="grid grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
                {/* Home */}
                <div className="bg-slate-800 p-4 rounded-2xl flex flex-col gap-4 border-t-4 border-purple-500 overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold uppercase truncate">{homeName}</h2>
                        <div className="flex flex-col items-end">
                            <div className="text-4xl font-bold text-purple-400">{match.home_score}</div>
                        </div>
                    </div>
                    {/* Timeouts and Fouls Strip */}
                    <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg mb-2 border border-purple-500/30">
                        <button 
                            onClick={() => handleTimeout('home')}
                            className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
                            title="Call Timeout (-1 to available)"
                        >
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-white">Timeouts</span>
                            <div className="flex gap-1.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`w-3 h-3 rounded-full border border-red-500/50 ${i <= (match.gamestate?.home_timeouts || 0) ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-transparent'}`}></div>
                                ))}
                            </div>
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fouls</span>
                            <div className="text-lg font-black text-orange-500">{match.gamestate?.home_fouls || 0}</div>
                        </div>
                    </div>

                    {/* Player Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        {homePlayers.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPlayer({ id: p.id, name: p.name, number: p.number, team: 'home' })}
                                className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all relative overflow-hidden ${selectedPlayer?.id === p.id
                                    ? 'bg-purple-600 ring-2 ring-white z-10'
                                    : (match.gamestate?.home_on_court || []).includes(p.id)
                                        ? 'bg-purple-900/80 border-2 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                        : 'bg-slate-700 hover:bg-slate-600 opacity-60'
                                    }`}
                            >
                                {(match.gamestate?.home_on_court || []).includes(p.id) && (
                                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>
                                )}
                                <span className="text-xl font-bold">{p.number}</span>
                                <span className="text-[10px] truncate w-full text-center opacity-70">{p.name.split(' ')[0]}</span>
                                {/* Show current points if avail */}
                                {(match.gamestate?.player_stats?.[p.id]?.points > 0 || match.gamestate?.player_stats?.[p.id]?.fouls > 0) && (
                                    <div className="mt-1 flex gap-1 text-[9px]">
                                        {match.gamestate?.player_stats?.[p.id]?.points > 0 && <span className="text-yellow-400">{match.gamestate.player_stats[p.id].points}</span>}
                                        {match.gamestate?.player_stats?.[p.id]?.fouls > 0 && <span className="text-red-400">●{match.gamestate.player_stats[p.id].fouls}</span>}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Away */}
                <div className="bg-slate-800 p-4 rounded-2xl flex flex-col gap-4 border-t-4 border-green-500 overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold uppercase truncate">{awayName}</h2>
                        <div className="flex flex-col items-end">
                            <div className="text-4xl font-bold text-green-400">{match.away_score}</div>
                        </div>
                    </div>
                    {/* Timeouts and Fouls Strip */}
                    <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg mb-2 border border-green-500/30">
                        <button 
                            onClick={() => handleTimeout('away')}
                            className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
                            title="Call Timeout (-1 to available)"
                        >
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-white">Timeouts</span>
                            <div className="flex gap-1.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`w-3 h-3 rounded-full border border-red-500/50 ${i <= (match.gamestate?.away_timeouts || 0) ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-transparent'}`}></div>
                                ))}
                            </div>
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fouls</span>
                            <div className="text-lg font-black text-orange-500">{match.gamestate?.away_fouls || 0}</div>
                        </div>
                    </div>

                    {/* Player Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        {awayPlayers.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPlayer({ id: p.id, name: p.name, number: p.number, team: 'away' })}
                                className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all relative overflow-hidden ${selectedPlayer?.id === p.id
                                    ? 'bg-green-600 ring-2 ring-white z-10'
                                    : (match.gamestate?.away_on_court || []).includes(p.id)
                                        ? 'bg-green-900/80 border-2 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                                        : 'bg-slate-700 hover:bg-slate-600 opacity-60'
                                    }`}
                            >
                                {(match.gamestate?.away_on_court || []).includes(p.id) && (
                                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>
                                )}
                                <span className="text-xl font-bold">{p.number}</span>
                                <span className="text-[10px] truncate w-full text-center opacity-70">{p.name.split(' ')[0]}</span>
                                {/* Show current points if avail */}
                                {(match.gamestate?.player_stats?.[p.id]?.points > 0 || match.gamestate?.player_stats?.[p.id]?.fouls > 0) && (
                                    <div className="mt-1 flex gap-1 text-[9px]">
                                        {match.gamestate?.player_stats?.[p.id]?.points > 0 && <span className="text-yellow-400">{match.gamestate.player_stats[p.id].points}</span>}
                                        {match.gamestate?.player_stats?.[p.id]?.fouls > 0 && <span className="text-red-400">●{match.gamestate.player_stats[p.id].fouls}</span>}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Panel (Modal) */}
            {selectedPlayer && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedPlayer(null); setSubTarget(null); }}>
                    <div className="bg-slate-900 p-6 rounded-3xl w-full max-w-2xl flex flex-col items-center gap-6 border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>

                        {!subTarget ? (
                            // STANDARD ACTION VIEW
                            <>
                                <div className="flex flex-col items-center">
                                    <div className={`text-6xl font-bold mb-2 ${selectedPlayer.team === 'home' ? 'text-purple-400' : 'text-green-400'}`}>#{selectedPlayer.number}</div>
                                    <div className="text-2xl font-bold uppercase tracking-widest">{selectedPlayer.name}</div>
                                    <div className="flex gap-4 mt-2 text-sm text-slate-400">
                                        <span>PTS: {match.gamestate?.player_stats?.[selectedPlayer.id]?.points || 0}</span>
                                        <span>FOULS: {match.gamestate?.player_stats?.[selectedPlayer.id]?.fouls || 0}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-3 w-full">
                                    {/* Positive Points */}
                                    <button onClick={() => handlePlayerAction('pts', 1)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl font-bold text-xl">+1</button>
                                    <button onClick={() => handlePlayerAction('pts', 2)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl font-bold text-xl">+2</button>
                                    <button onClick={() => handlePlayerAction('pts', 3)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl font-bold text-xl">+3</button>

                                    {/* Foul + */}
                                    <button
                                        onClick={() => handlePlayerAction('foul', 1)}
                                        className={`p-4 rounded-xl font-bold border-2 ${(match.gamestate?.player_stats?.[selectedPlayer.id]?.fouls || 0) >= 5
                                            ? 'bg-red-950 text-red-500 border-red-500'
                                            : 'bg-red-900/40 hover:bg-red-900/60 text-red-400 border-transparent'
                                            }`}
                                    >
                                        +Foul
                                    </button>

                                    {/* Negative Points */}
                                    <button onClick={() => handlePlayerAction('pts', -1)} className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-4 rounded-xl font-bold text-lg">-1</button>
                                    <button onClick={() => handlePlayerAction('pts', -2)} className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-4 rounded-xl font-bold text-lg">-2</button>
                                    <button onClick={() => handlePlayerAction('pts', -3)} className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-4 rounded-xl font-bold text-lg">-3</button>

                                    {/* Foul - */}
                                    <button onClick={() => handlePlayerAction('foul', -1)} className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-4 rounded-xl font-bold border border-slate-700">-Foul</button>
                                </div>

                                <div className="w-full mt-2">
                                    <button
                                        onClick={handleSubstitution}
                                        className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider transition-colors ${(selectedPlayer.team === 'home' ? match.gamestate?.home_on_court || [] : match.gamestate?.away_on_court || []).includes(selectedPlayer.id)
                                            ? 'bg-blue-800/60 text-blue-400 hover:bg-blue-800/80 border border-blue-800' // SUBSTITUTE (Show Blue for action?) Or Amber? 
                                            : 'bg-gray-800/60 text-gray-400 cursor-not-allowed' // Disabled for bench players in this view
                                            }`}
                                        disabled={!(selectedPlayer.team === 'home' ? match.gamestate?.home_on_court || [] : match.gamestate?.away_on_court || []).includes(selectedPlayer.id)}
                                    >
                                        {(selectedPlayer.team === 'home' ? match.gamestate?.home_on_court || [] : match.gamestate?.away_on_court || []).includes(selectedPlayer.id) ? '🔄 SUBSTITUTE' : 'Select On-Court Player to Sub'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            // SUBSTITUTION SELECTION VIEW
                            <div className="w-full flex flex-col gap-4">
                                <div className="text-center">
                                    <h3 className="text-slate-400 uppercase tracking-widest text-sm">Subbing Out</h3>
                                    <div className="text-3xl font-bold text-white mt-1">{subTarget.name} <span className="text-slate-500">#{subTarget.number}</span></div>
                                </div>

                                <div className="bg-slate-800/50 p-4 rounded-2xl max-h-96 overflow-y-auto">
                                    <h4 className="text-slate-400 text-xs uppercase font-bold mb-3">Select Bench Replacement</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(subTarget.team === 'home' ? homePlayers : awayPlayers)
                                            .filter(p => !(subTarget.team === 'home' ? match.gamestate?.home_on_court || [] : match.gamestate?.away_on_court || []).includes(p.id))
                                            .map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => confirmSubstitution(p.id)}
                                                    className="bg-slate-700 hover:bg-green-600 hover:text-white hover:border-green-400 border border-transparent p-3 rounded-xl flex flex-col items-center gap-1 transition-all"
                                                >
                                                    <span className="text-xl font-bold">{p.number}</span>
                                                    <span className="text-xs opacity-70 truncate w-full text-center">{p.name.split(' ')[0]}</span>
                                                </button>
                                            ))
                                        }
                                        {(subTarget.team === 'home' ? homePlayers : awayPlayers).filter(p => !(subTarget.team === 'home' ? match.gamestate?.home_on_court || [] : match.gamestate?.away_on_court || []).includes(p.id)).length === 0 && (
                                            <div className="col-span-3 text-center text-slate-500 py-4">No bench players available</div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSubTarget(null)}
                                    className="w-full py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    Cancel Substitution
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </main>
    );
}
