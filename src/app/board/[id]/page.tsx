'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { directus } from '@/lib/directus';
import { useMatchSync } from '@/hooks/useMatchSync';
import { useTimerEngine } from '@/hooks/useTimerEngine';
import { ScoreOverlay } from '@/components/board/ScoreOverlay';

import { readItem, readItems } from '@directus/sdk';
import { Match, Board, Team } from '@/types/directus';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';

const DEFAULT_2PT_CONFIG = {
    overlay: { background: "rgba(0,0,0,0.9)", backdropBlur: "10px" },
    content: {
        initial: { y: 100, scale: 0.5, opacity: 0 },
        animate: { y: 0, scale: 1, opacity: 1 },
        exit: { scale: 1.5, opacity: 0, filter: "blur(20px)" },
        transition: { type: "spring", damping: 15, stiffness: 100 }
    },
    score: {
        initial: { scale: 0, rotate: -20 },
        animate: { scale: 1, rotate: 0 },
        transition: { type: "spring", bounce: 0.7, delay: 0.2 }
    },
    elements: []
};

const DEFAULT_3PT_CONFIG = {
    ...DEFAULT_2PT_CONFIG,
    elements: [
        {
            type: "emoji",
            value: "🔥",
            animate: { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] },
            transition: { repeat: Infinity, duration: 1 }
        }
    ]
};

export default function BoardPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = params?.id as string;
    const isPreview = searchParams.get('preview') === 'true';

    const [boardConfig, setBoardConfig] = useState<Board | null>(null);
    const [scale, setScale] = useState(1);

    // Score Animation State
    const [recentScore, setRecentScore] = useState<{player: any, team: any, points: number, config: any} | null>(null);
    const prevStatsRef = useRef<any>(null);

    // Helper to fix JSON-specific string values (like "Infinity")
    const fixConfig = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) {
            if (obj === 'Infinity' || obj === 'infinity') return Infinity;
            return obj;
        }
        if (Array.isArray(obj)) return obj.map(fixConfig);
        const fixed: any = {};
        for (const key in obj) { fixed[key] = fixConfig(obj[key]); }
        return fixed;
    };

    // Ultra-safe comparison helper
    const getStrId = (idInput: any) => {
        if (!idInput) return '';
        if (typeof idInput === 'object') return String(idInput.id || '');
        return String(idInput);
    };

    // ─── Shared match sync hook (auth + initial fetch + WebSocket) ───────────
    const { match, setMatch, loading, error, isAuthenticated, homePlayers, awayPlayers, homeTeam, awayTeam } = useMatchSync({
        matchId: isPreview ? null : (id || null),
        extraFields: ['animations.scoring_animations_id.*'],
        skip: isPreview,
        onAuthFail: () => router.push(`/login?redirect=/board/${id}${isPreview ? '?preview=true' : ''}`),
    });

    // ─── Timer engine hook (100ms tick, anti-jump, shot clock) ──────────────
    const { localTimer, shotClock, formatTime } = useTimerEngine({ match });


    useEffect(() => {
        if (!isPreview || !id) return;
        const loadPreview = async () => {
            try {
                const boardData = await directus.request(readItem('boards', id));
                setBoardConfig(boardData);
                setMatch({
                    id: 'preview', status: 'live',
                    start_time: new Date().toISOString(),
                    current_period: 2, timer_seconds: 725, timer_started_at: null,
                    home_score: 88, away_score: 86,
                    gamestate: { home_fouls: 3, away_fouls: 2, home_timeouts: 2, away_timeouts: 1 },
                    sport: { name: 'Basketball' } as any,
                    home_team: { name: 'Lakers', primary_color: '#552583' } as any,
                    away_team: { name: 'Celtics', primary_color: '#007A33' } as any
                } as Match);
            } catch (e) {
                console.error('Preview load failed:', e);
            }
        };
        loadPreview();
    }, [isPreview, id, setMatch]);

    useEffect(() => {
        if (!boardConfig?.layout) return;
        const handleResize = () => {
            const width = boardConfig.layout.canvas?.width || 640;
            const height = boardConfig.layout.canvas?.height || 360;
            setScale(Math.min(window.innerWidth / width, window.innerHeight / height));
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [boardConfig]);

    useEffect(() => {
        if (!match || isPreview) return;
        const m = match as any;
        if (m.board) {
            setBoardConfig(m.board);
        } else {
            setBoardConfig({
                id: 'default', name: 'Default',
                show_timer: true, show_period: true, show_fouls: true,
                show_timeouts: true, show_players: true, show_player_stats: true,
                background_color: '#000000', text_color: '#ffffff',
                primary_color_home: m.home_team?.primary_color || '#ef4444',
                primary_color_away: m.away_team?.primary_color || '#3b82f6',
                label_period: 'PERIOD', label_fouls: 'FOULS'
            } as any);
        }
    }, [match?.id, isPreview]);

    // Score Delta Detector
    useEffect(() => {
        if (!match?.gamestate?.player_stats) return;

        const currentStats = match.gamestate.player_stats;
        const prevStats = prevStatsRef.current;

        if (prevStats) {
            for (const playerId in currentStats) {
                const currentPoints = currentStats[playerId]?.points || 0;
                const prevPoints = prevStats[playerId]?.points || 0;
                const diff = currentPoints - prevPoints;

                if (diff === 2 || diff === 3) {
                    let team = null;
                    let player = homePlayers.find(p => getStrId(p.id) === playerId);
                    if (player) {
                        team = homeTeam;
                    } else {
                        player = awayPlayers.find(p => getStrId(p.id) === playerId);
                        if (player) team = awayTeam;
                    }

                    if (player && team) {
                        // Find suitable animations from the match config
                        const availableAnimations = (match.animations || [])
                            .map((a: any) => a.scoring_animations_id)
                            .filter((a: any) => a && a.active && (!a.trigger_points || a.trigger_points == diff));

                        const selectedAnim = availableAnimations.length > 0 
                            ? availableAnimations[Math.floor(Math.random() * availableAnimations.length)]
                            : null;

                        const config = fixConfig(selectedAnim?.config || (diff === 3 ? DEFAULT_3PT_CONFIG : DEFAULT_2PT_CONFIG));
                        


                        setRecentScore({ player, team, points: diff, config });
                        setTimeout(() => {
                            setRecentScore(null);
                        }, 4000); // 4s duration to match complex anims
                    }
                }
            }
        }

        prevStatsRef.current = currentStats;
    }, [match?.gamestate?.player_stats, homePlayers, awayPlayers, homeTeam, awayTeam]);


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

    // formatTime is provided by useTimerEngine

    // --- SCORE OVERLAY ---
    const scoreOverlayEl = <ScoreOverlay recentScore={recentScore} />;

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
                            case 'shot_clock':
                                if (shotClock !== null) {
                                    content = (shotClock < 5 && shotClock > 0) ? shotClock.toFixed(1) : Math.ceil(shotClock).toString();
                                } else {
                                    content = '';
                                }
                                if (match.status === 'paused') extraStyle = { opacity: 0.5 };
                                break;
                            case 'period':
                                const maxPeriods = match.max_periods || 4;
                                if (match.current_period > maxPeriods) {
                                    content = `OT ${match.current_period - maxPeriods}`;
                                } else {
                                    content = match.current_period;
                                }
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
                                const homeOnCourtIds = (match.gamestate?.home_on_court || []) as any[];
                                const playersOnCourtH = homePlayers.filter(p => homeOnCourtIds.some(id => getStrId(id) === getStrId(p.id)));

                                const homePlayersToShow = homePlayers.length > 0
                                    ? (playersOnCourtH.length > 0 ? playersOnCourtH : homePlayers.slice(0, 5))
                                    : [];

                                if (id !== 'preview' && homeOnCourtIds.length > 0 && playersOnCourtH.length === 0 && homePlayers.length > 0) {
                                    console.warn("RENDER MISMATCH [home]: Showing fallback top 5.", {
                                        gamestateIds: homeOnCourtIds.map(getStrId),
                                        availableIds: homePlayers.map(p => getStrId(p.id))
                                    });
                                }

                                content = (
                                    <div className="w-full h-full overflow-hidden flex flex-col gap-1">
                                        {homePlayersToShow.length === 0 ? (
                                            <div className="text-[10px] opacity-20 italic">No players home</div>
                                        ) : homePlayersToShow.map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-[0.8em] border-b border-current/20 pb-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold w-6 text-center bg-white/10 rounded">{p.number ?? '??'}</span>
                                                    <span className="truncate max-w-[120px]">{p.name || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {(match.gamestate?.player_stats?.[p.id]?.fouls || 0) > 0 && (
                                                        <span className="text-[0.8em] opacity-70 text-red-100 bg-red-600 px-1 rounded-sm">{match.gamestate.player_stats[p.id].fouls}</span>
                                                    )}
                                                    <span className="font-mono font-bold text-yellow-500">{match.gamestate?.player_stats?.[p.id]?.points || 0}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                                break;
                            case 'players_away':
                                const awayOnCourtIds = (match.gamestate?.away_on_court || []) as any[];
                                const playersOnCourtA = awayPlayers.filter(p => awayOnCourtIds.some(id => getStrId(id) === getStrId(p.id)));

                                const awayPlayersList = awayPlayers.length > 0
                                    ? (playersOnCourtA.length > 0 ? playersOnCourtA : awayPlayers.slice(0, 5))
                                    : [];

                                if (id !== 'preview' && awayOnCourtIds.length > 0 && playersOnCourtA.length === 0 && awayPlayers.length > 0) {
                                    console.warn("RENDER MISMATCH [away]: Showing fallback top 5.", {
                                        gamestateIds: awayOnCourtIds.map(getStrId),
                                        availableIds: awayPlayers.map(p => getStrId(p.id))
                                    });
                                }

                                content = (
                                    <div className="w-full h-full overflow-hidden flex flex-col gap-1">
                                        {awayPlayersList.length === 0 ? (
                                            <div className="text-[10px] opacity-20 italic">No players away</div>
                                        ) : awayPlayersList.map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-[0.8em] border-b border-current/20 pb-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold w-6 text-center bg-white/10 rounded">{p.number ?? '??'}</span>
                                                    <span className="truncate max-w-[120px]">{p.name || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {(match.gamestate?.player_stats?.[p.id]?.fouls || 0) > 0 && (
                                                        <span className="text-[0.8em] opacity-70 text-red-100 bg-red-600 px-1 rounded-sm">{match.gamestate.player_stats[p.id].fouls}</span>
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

                    {scoreOverlayEl}
                </div>

                {/* Text Ad Overlay */}
                <AnimatePresence>
                    {(match as any)?.active_ad_text && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="absolute top-1/4 left-0 w-full z-[9900] flex justify-center pointer-events-none"
                        >
                            <div className="bg-black/80 backdrop-blur-md px-16 py-8 rounded-full border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-widest text-white text-center">
                                    {(match as any).active_ad_text}
                                </h1>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Video Ad Overlay */}
                <AnimatePresence>
                    {(match as any)?.active_ad_video && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[9950] bg-black flex justify-center items-center overflow-hidden"
                        >
                            <video 
                                src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${(match as any).active_ad_video}`} 
                                autoPlay 
                                loop 
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
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
                        <span className="text-4xl font-bold font-mono">
                            {match.current_period > (match.max_periods || 4) 
                                ? `OT ${match.current_period - (match.max_periods || 4)}` 
                                : match.current_period}
                        </span>
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
                                {(() => {
                                    const hOnCourt = (match.gamestate?.home_on_court || []) as any[];
                                    const filtered = homePlayers.filter(p => hOnCourt.some(id => getStrId(id) === getStrId(p.id)));
                                    return filtered.length > 0 ? filtered : homePlayers.slice(0, 5);
                                })().map(p => (
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
                                {(() => {
                                    const aOnCourt = (match.gamestate?.away_on_court || []) as any[];
                                    const filtered = awayPlayers.filter(p => aOnCourt.some(id => getStrId(id) === getStrId(p.id)));
                                    return filtered.length > 0 ? filtered : awayPlayers.slice(0, 5);
                                })().map(p => (
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

            {/* Text Ad Overlay */}
            <AnimatePresence>
                {(match as any)?.active_ad_text && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="fixed top-1/4 left-0 w-full z-[9900] flex justify-center pointer-events-none"
                    >
                        <div className="bg-black/80 backdrop-blur-md px-16 py-8 rounded-full border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-widest text-white text-center">
                                {(match as any).active_ad_text}
                            </h1>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Ad Overlay */}
            <AnimatePresence>
                {(match as any)?.active_ad_video && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9950] bg-black flex justify-center items-center overflow-hidden"
                    >
                        <video 
                            src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${(match as any).active_ad_video}`} 
                            autoPlay 
                            loop 
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {scoreOverlayEl}
        </div>
    );
}
