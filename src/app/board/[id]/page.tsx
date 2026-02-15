'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { directus } from '@/lib/directus';

import { readItem, readMe, readItems } from '@directus/sdk';
import { Match, Board, Team } from '@/types/directus';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BoardPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = params?.id as string;
    const isPreview = searchParams.get('preview') === 'true';

    const [match, setMatch] = useState<Match | null>(null);
    const [boardConfig, setBoardConfig] = useState<Board | null>(null);

    // Derived state for cleaner UI
    const [homeTeam, setHomeTeam] = useState<Team | null>(null);
    const [awayTeam, setAwayTeam] = useState<Team | null>(null);
    const [homePlayers, setHomePlayers] = useState<any[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);



    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [scale, setScale] = useState(1);
    const [localTimer, setLocalTimer] = useState(0);

    // Sync local timer with match state
    useEffect(() => {
        if (!match) return;

        const updateTimer = () => {
            // @ts-ignore
            if (match.status === 'live' && match.timer_started_at) {
                const now = new Date().getTime();
                // @ts-ignore
                const startedAt = new Date(match.timer_started_at).getTime();
                const elapsed = Math.floor((now - startedAt) / 1000);
                // @ts-ignore
                setLocalTimer(Math.max(0, match.timer_seconds - elapsed));
            } else {
                // @ts-ignore
                setLocalTimer(match.timer_seconds || 0);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 200);
        return () => clearInterval(interval);
    }, [match]);

    // Auto-scale to fit screen
    useEffect(() => {
        if (!boardConfig?.layout) return;

        const handleResize = () => {
            // @ts-ignore
            const width = boardConfig.layout.canvas?.width || 640;
            // @ts-ignore
            const height = boardConfig.layout.canvas?.height || 360;

            const scaleX = window.innerWidth / width;
            const scaleY = window.innerHeight / height;

            // Choose the smaller scale to ensure it fits entirely
            setScale(Math.min(scaleX, scaleY));
        };

        handleResize(); // Initial calc
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [boardConfig]);


    // Check Auth
    useEffect(() => {
        const checkAuth = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait for SDK storage sync
                const token = await directus.getToken();

                if (!token) {
                    // If preview, we might allow public access if the board is public? 
                    // But user requested "role of logged in user". 
                    // If preview, we still need to fetch the BOARD config. 
                    // Let's assume preview matches don't need auth, but Board config MIGHT.
                    // However, to keep it simple and consistent with user request:
                    // If no token -> login.
                    // EXCEPT if we decide to allow public preview. 
                    // For now, consistent behavior:
                    router.push(`/login?redirect=/board/${id}${isPreview ? '?preview=true' : ''}`);
                    return;
                }

                // Verify token is valid by fetching ME
                await directus.request(readMe());
                setIsAuthenticated(true);
            } catch (e) {
                console.error("Auth check failed:", e);
                router.push(`/login?redirect=/board/${id}${isPreview ? '?preview=true' : ''}`);
            }
        };
        checkAuth();
    }, [router, id, isPreview]);

    // Initial Load
    useEffect(() => {
        // Validation: Preview needs ID, Live needs ID & Auth
        if (!id) return;
        if (!isPreview && !isAuthenticated) return; // Assuming isAuthenticated is managed elsewhere

        const fetchData = async () => {
            // PREVIEW MODE: ID is Board ID
            if (isPreview) {
                try {
                    const boardData = await directus.request(readItem('boards', id));
                    // @ts-ignore
                    setBoardConfig(boardData);

                    // Dummy Match Data for Design
                    setMatch({
                        id: 'preview',
                        status: 'live',
                        start_time: new Date().toISOString(),
                        current_period: 2,
                        timer_seconds: 725, // 12:05
                        timer_started_at: null,
                        home_score: 88,
                        away_score: 86,
                        gamestate: {
                            home_fouls: 3,
                            away_fouls: 2,
                            home_timeouts: 2,
                            away_timeouts: 1
                        },
                        sport: { name: 'Basketball' } as any,
                        home_team: { name: 'Lakers', primary_color: '#552583' } as any,
                        away_team: { name: 'Celtics', primary_color: '#007A33' } as any
                    } as Match);
                    setHomeTeam({ name: 'Lakers', primary_color: '#552583' } as any);
                    setAwayTeam({ name: 'Celtics', primary_color: '#007A33' } as any);
                    setLoading(false);
                } catch (e) {
                    console.error("Preview load failed:", e);
                    setError("Failed to load Board Preview");
                    setLoading(false);
                }
                return;
            }

            // LIVE MODE: ID is Match ID
            try {
                // Fetch Match with related Board and Teams
                // We use type assertion because our SDK types might be simple, but query expands them
                const matchData = await directus.request(readItem('matches', id as string, {
                    fields: [
                        '*',
                        // @ts-ignore
                        'home_team.*',
                        // @ts-ignore
                        'away_team.*',
                        // @ts-ignore
                        'board.*'
                    ]
                }));

                // @ts-ignore
                setMatch(matchData);
                // @ts-ignore
                setHomeTeam(matchData.home_team);
                // @ts-ignore
                setAwayTeam(matchData.away_team);

                // If match has a specific board assigned, use it. Otherwise use defaults.
                // @ts-ignore
                if (matchData.board) {
                    // @ts-ignore
                    setBoardConfig(matchData.board);
                } else {
                    // Fallback default config if no board selected
                    setBoardConfig({
                        id: 'default',
                        name: 'Default',
                        show_timer: true,
                        show_period: true,
                        show_fouls: true,
                        show_timeouts: true,
                        show_players: true,
                        show_player_stats: true,
                        background_color: '#000000',
                        text_color: '#ffffff',
                        // @ts-ignore
                        primary_color_home: matchData.home_team?.primary_color || '#ef4444',
                        // @ts-ignore
                        primary_color_away: matchData.away_team?.primary_color || '#3b82f6',
                        label_period: 'PERIOD',
                        label_fouls: 'FOULS'
                    } as Board);
                }

                // Fetch Players
                // @ts-ignore
                if (matchData.home_team && matchData.away_team) {
                    // @ts-ignore
                    const homeId = typeof matchData.home_team === 'object' ? matchData.home_team.id : matchData.home_team;
                    // @ts-ignore
                    const awayId = typeof matchData.away_team === 'object' ? matchData.away_team.id : matchData.away_team;

                    // @ts-ignore
                    const playersData = await directus.request(readItems('players', {
                        filter: {
                            _or: [
                                { team: { _eq: homeId } },
                                { team: { _eq: awayId } }
                            ]
                        },
                        limit: 100
                    }));

                    // @ts-ignore
                    const hPlayers = playersData.filter((p: any) => (typeof p.team === 'object' ? p.team.id : p.team) === homeId).sort((a: any, b: any) => a.number - b.number);
                    // @ts-ignore
                    const aPlayers = playersData.filter((p: any) => (typeof p.team === 'object' ? p.team.id : p.team) === awayId).sort((a: any, b: any) => a.number - b.number);

                    setHomePlayers(hPlayers);
                    setAwayPlayers(aPlayers);
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching board data:", err);
                setError("Failed to load match data. It may not exist.");
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isAuthenticated, isPreview]);

    // Polling for updates (More robust than WS in some envs)
    useEffect(() => {
        if (!id || isPreview) return;

        const pollData = async () => {
            try {
                // Fetch all fields to ensure we don't miss anything or error on specific fields
                const updatedMatch = await directus.request(readItem('matches', id, {
                    fields: ['*']
                }));

                setMatch(prev => {
                    if (!prev) return prev;
                    return { ...prev, ...updatedMatch };
                });
            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        const interval = setInterval(pollData, 1000); // Faster polling (1s)
        return () => clearInterval(interval);
    }, [id, isPreview]);


    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="text-xl font-light tracking-widest">LOADING SCOREBOARD...</p>
        </div>
    );

    if (error || !match || !boardConfig) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
            <p className="text-2xl">{error || "Board configuration not found."}</p>
        </div>
    );

    // Apply Colors
    const bgStyle = { backgroundColor: boardConfig.background_color || '#000000', color: boardConfig.text_color || '#ffffff' };
    const homeColor = boardConfig.primary_color_home || homeTeam?.primary_color || '#ef4444';
    const awayColor = boardConfig.primary_color_away || awayTeam?.primary_color || '#3b82f6';

    // Timer Display Logic
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };


    // --- DYNAMIC RENDERER ---
    if (boardConfig.layout && boardConfig.layout.elements) {
        // @ts-ignore
        const elements = boardConfig.layout.elements;
        // @ts-ignore
        const canvasSize = boardConfig.layout.canvas || { width: 640, height: 360 };

        return (
            <div className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
                <div
                    className="relative shadow-2xl overflow-hidden"
                    style={{
                        width: canvasSize.width,
                        height: canvasSize.height,
                        ...(() => {
                            const bg = (boardConfig.layout as any).canvas?.background;
                            if (bg) {
                                if (bg.type === 'solid') return { backgroundColor: bg.colors[0] };
                                if (bg.type === 'gradient_2') return { backgroundImage: `linear-gradient(${bg.direction}, ${bg.colors[0]}, ${bg.colors[1]})` };
                                if (bg.type === 'gradient_3') return { backgroundImage: `linear-gradient(${bg.direction}, ${bg.colors[0]}, ${bg.colors[1]}, ${bg.colors[2]})` };
                            }
                            return { backgroundColor: (boardConfig.layout as any).canvas?.background || bgStyle.backgroundColor };
                        })(),
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center',
                        backgroundSize: 'cover'
                    }}
                >
                    {elements.map((el: any) => {
                        let content = null;
                        let extraStyle = {};

                        switch (el.type) {
                            case 'timer':
                                content = formatTime(localTimer);
                                if (match.status === 'paused') extraStyle = { opacity: 0.5 };
                                break;
                            case 'period':
                                content = match.current_period;
                                break;
                            case 'score_home':
                                content = match.home_score;
                                break;
                            case 'score_away':
                                content = match.away_score;
                                break;
                            case 'name_home':
                                content = homeTeam?.name || 'HOME';
                                break;
                            case 'name_away':
                                content = awayTeam?.name || 'AWAY';
                                break;
                            case 'fouls_home':
                                content = match.gamestate?.home_fouls || 0;
                                break;
                            case 'fouls_away':
                                content = match.gamestate?.away_fouls || 0;
                                break;
                            case 'timeouts_home':
                                const tosHome = (match.gamestate?.home_timeouts as number) || 0;
                                content = (
                                    <div className="flex gap-1">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className={`w-3 h-3 rounded-full ${i < tosHome ? 'bg-current' : 'opacity-20 bg-current'}`} />
                                        ))}
                                    </div>
                                );
                                extraStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center' };
                                break;
                            case 'timeouts_away':
                                const tosAway = (match.gamestate?.away_timeouts as number) || 0;
                                content = (
                                    <div className="flex gap-1">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className={`w-3 h-3 rounded-full ${i < tosAway ? 'bg-current' : 'opacity-20 bg-current'}`} />
                                        ))}
                                    </div>
                                );
                                extraStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center' };
                                break;
                            case 'players_home':
                                content = (
                                    <div className="w-full h-full overflow-hidden flex flex-col gap-1">
                                        {/* Show only players ON COURT if defined, otherwise top 5 */}
                                        {(match.gamestate?.home_on_court && match.gamestate.home_on_court.length > 0
                                            ? homePlayers.filter(p => (match.gamestate?.home_on_court as string[]).includes(p.id))
                                            : homePlayers.slice(0, 5)
                                        ).map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-[0.8em] border-b border-current/20 pb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold w-6 text-center bg-white/10 rounded">{p.number}</span>
                                                    <span className="truncate max-w-[120px]">{p.name.split(' ')[0]}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {(match.gamestate?.player_stats?.[p.id]?.fouls || 0) > 0 && (
                                                        <span className="text-[0.8em] opacity-70 text-red-400">●{match.gamestate.player_stats[p.id].fouls}</span>
                                                    )}
                                                    <span className="font-mono font-bold text-yellow-500">{match.gamestate?.player_stats?.[p.id]?.points || 0}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                                break;
                            case 'players_away':
                                content = (
                                    <div className="w-full h-full overflow-hidden flex flex-col gap-1">
                                        {(match.gamestate?.away_on_court && match.gamestate.away_on_court.length > 0
                                            ? awayPlayers.filter(p => (match.gamestate?.away_on_court as string[]).includes(p.id))
                                            : awayPlayers.slice(0, 5)
                                        ).map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-[0.8em] border-b border-current/20 pb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold w-6 text-center bg-white/10 rounded">{p.number}</span>
                                                    <span className="truncate max-w-[120px]">{p.name.split(' ')[0]}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {(match.gamestate?.player_stats?.[p.id]?.fouls || 0) > 0 && (
                                                        <span className="text-[0.8em] opacity-70 text-red-400">●{match.gamestate.player_stats[p.id].fouls}</span>
                                                    )}
                                                    <span className="font-mono font-bold text-yellow-500">{match.gamestate?.player_stats?.[p.id]?.points || 0}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                                break;
                            case 'text':
                                content = el.content;
                                break;
                            case 'box':
                                // just a colored box
                                break;
                        }

                        return (
                            <div
                                key={el.id}
                                style={{
                                    position: 'absolute',
                                    left: el.x,
                                    top: el.y,
                                    width: el.width,
                                    height: el.height,
                                    zIndex: el.zIndex,
                                    ...el.style,
                                    ...extraStyle
                                }}
                            >
                                {content}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- FALLBACK TO GRID LAYOUT ---
    return (
        <div className="min-h-screen transition-colors duration-500 overflow-hidden relative" style={bgStyle}>

            {/* Header / Top Bar */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-start z-10">
                {/* Period */}
                {boardConfig.show_period && (
                    <div className="flex flex-col items-center bg-gray-900/50 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 mx-auto">
                        <span className="text-sm uppercase tracking-widest opacity-70 mb-1">{boardConfig.label_period || 'PERIOD'}</span>
                        <span className="text-4xl font-bold font-mono">{match.current_period}</span>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="h-screen flex flex-col items-center justify-center max-w-[1600px] mx-auto w-full px-8">

                <div className="grid grid-cols-12 w-full gap-8 items-center">

                    {/* HOME TEAM */}
                    <div className="col-span-4 flex flex-col items-center">
                        <div
                            className="w-full aspect-video rounded-3xl mb-6 flex items-center justify-center relative overflow-hidden shadow-2xl"
                            style={{ backgroundColor: homeColor }}
                        >
                            {/* Home Score */}
                            <span className="text-[12rem] font-bold leading-none z-10 drop-shadow-lg">
                                {match.home_score}
                            </span>
                            {/* Background pattern/logo could go here */}
                        </div>

                        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-center">{homeTeam?.name || 'HOME'}</h2>

                        {/* Fouls / Timeouts */}
                        <div className="flex gap-6">
                            {boardConfig.show_fouls && (
                                <div className="text-center">
                                    <span className="block text-xs uppercase opacity-60 mb-1">{boardConfig.label_fouls || 'FOULS'}</span>
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={`w-3 h-8 rounded-full ${i < ((match.gamestate?.home_fouls as number) || 0) ? 'bg-white' : 'bg-white/10'}`} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {boardConfig.show_timeouts && (
                                <div className="text-center">
                                    <span className="block text-xs uppercase opacity-60 mb-1">T.O.</span>
                                    <div className="flex gap-1">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className={`w-3 h-8 rounded-full ${i < ((match.gamestate?.home_timeouts as number) || 0) ? 'bg-yellow-400' : 'bg-white/10'}`} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CENTER (Timer & VS) */}
                    <div className="col-span-4 flex flex-col items-center justify-center min-h-[400px]">
                        {boardConfig.show_timer && (
                            <div className={`text-[8rem] font-mono leading-none tracking-tighter mb-8 font-bold ${match.status === 'paused' ? 'opacity-50 animate-pulse' : ''}`}>
                                {formatTime(localTimer)}
                            </div>
                        )}

                        <div className="text-2xl font-bold uppercase tracking-widest opacity-50 bg-white/5 py-2 px-6 rounded-full">
                            {match.status}
                        </div>
                    </div>

                    {/* AWAY TEAM */}
                    <div className="col-span-4 flex flex-col items-center">
                        <div
                            className="w-full aspect-video rounded-3xl mb-6 flex items-center justify-center relative overflow-hidden shadow-2xl"
                            style={{ backgroundColor: awayColor }}
                        >
                            {/* Away Score */}
                            <span className="text-[12rem] font-bold leading-none z-10 drop-shadow-lg">
                                {match.away_score}
                            </span>
                        </div>

                        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-center">{awayTeam?.name || 'AWAY'}</h2>

                        {/* Fouls / Timeouts */}
                        <div className="flex gap-6">
                            {boardConfig.show_fouls && (
                                <div className="text-center">
                                    <span className="block text-xs uppercase opacity-60 mb-1">{boardConfig.label_fouls || 'FOULS'}</span>
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={`w-3 h-8 rounded-full ${i < ((match.gamestate?.away_fouls as number) || 0) ? 'bg-white' : 'bg-white/10'}`} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {boardConfig.show_timeouts && (
                                <div className="text-center">
                                    <span className="block text-xs uppercase opacity-60 mb-1">T.O.</span>
                                    <div className="flex gap-1">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className={`w-3 h-8 rounded-full ${i < ((match.gamestate?.away_timeouts as number) || 0) ? 'bg-yellow-400' : 'bg-white/10'}`} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Players List Placeholder */}
                {boardConfig.show_players && (
                    <div className="mt-12 w-full grid grid-cols-2 gap-24 opacity-80">
                        {/* Home Players */}
                        <div>
                            <h3 className="text-lg font-bold border-b border-white/20 pb-2 mb-4">ROSTER</h3>
                            <div className="space-y-2">
                                {(match.gamestate?.home_on_court && match.gamestate.home_on_court.length > 0
                                    ? homePlayers.filter(p => (match.gamestate?.home_on_court as string[]).includes(p.id))
                                    : homePlayers.slice(0, 5)
                                ).map(p => (
                                    <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
                                        <span className="font-mono font-bold w-8 text-center bg-white/10 rounded">{p.number}</span>
                                        <span className="flex-1 px-3">{p.name}</span>
                                        <div className="flex items-center gap-3">
                                            {(match.gamestate?.player_stats?.[p.id]?.fouls || 0) > 0 && <span className="text-red-400 text-xs">● {match.gamestate.player_stats[p.id].fouls}</span>}
                                            <span className="font-mono text-yellow-400 font-bold">{match.gamestate?.player_stats?.[p.id]?.points || 0} PTS</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Away Players */}
                        <div>
                            <h3 className="text-lg font-bold border-b border-white/20 pb-2 mb-4">ROSTER</h3>
                            <div className="space-y-2">
                                {(match.gamestate?.away_on_court && match.gamestate.away_on_court.length > 0
                                    ? awayPlayers.filter(p => (match.gamestate?.away_on_court as string[]).includes(p.id))
                                    : awayPlayers.slice(0, 5)
                                ).map(p => (
                                    <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
                                        <span className="font-mono font-bold w-8 text-center bg-white/10 rounded">{p.number}</span>
                                        <span className="flex-1 px-3">{p.name}</span>
                                        <div className="flex items-center gap-3">
                                            {(match.gamestate?.player_stats?.[p.id]?.fouls || 0) > 0 && <span className="text-red-400 text-xs">● {match.gamestate.player_stats[p.id].fouls}</span>}
                                            <span className="font-mono text-yellow-400 font-bold">{match.gamestate?.player_stats?.[p.id]?.points || 0} PTS</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
