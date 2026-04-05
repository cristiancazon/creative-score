'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { directus } from '@/lib/directus';
import { useMatchSubscription } from '@/hooks/useMatchSubscription';
import { useTimerEngine } from '@/hooks/useTimerEngine';
import { PlayerGrid } from '@/components/control/PlayerGrid';
import { readItem, updateItem, readMe, readItems } from '@directus/sdk';
import { Match, Player } from '@/types/directus';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import useWebSocket from 'react-use-websocket';
import { toPng } from 'html-to-image';

type ViewState = 'main' | 'actions' | 'substitution';

export default function ControlMXPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    // Core Data State
    const [match, setMatch] = useState<Match | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Ultra-safe comparison helper
    const getStrId = (idInput: any) => {
        if (!idInput) return "";
        if (typeof idInput === 'object') return String(idInput.id || "");
        return String(idInput);
    };
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [homePlayers, setHomePlayers] = useState<any[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<any[]>([]);

    // UI State
    const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
    const [view, setView] = useState<ViewState>('main');
    const [activePlayer, setActivePlayer] = useState<any | null>(null);
    // Timer state is now managed by useTimerEngine

    // Ads State
    const [textAds, setTextAds] = useState<any[]>([]);
    const [videoAds, setVideoAds] = useState<any[]>([]);
    const textAdIndexRef = useRef(0);
    const videoAdIndexRef = useRef(0);

    // Clock Edit State & Refs for WebSocket
    const [activeClockSelection, setActiveClockSelection] = useState<'game_min' | 'game_sec' | 'shot_sec' | 'shot_dec' | null>(null);
    const activeClockSelectionRef = useRef<'game_min' | 'game_sec' | 'shot_sec' | 'shot_dec' | null>(null);
    const matchRef = useRef<Match | null>(null);
    const rotationAccumulatorRef = useRef<number>(0);

    // Sync Refs
    useEffect(() => {
        activeClockSelectionRef.current = activeClockSelection;
    }, [activeClockSelection]);

    useEffect(() => {
        matchRef.current = match;
    }, [match]);

    // Check Auth
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await directus.getToken();
                if (!token) {
                    router.push('/login');
                    return;
                }
                await directus.request(readMe());
                setIsAuthenticated(true);
            } catch (e) {
                console.error("Auth check failed:", e);
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);

    // WebSocket to local Logi C# Plugin
    const { sendMessage: sendWsMessage, lastJsonMessage } = useWebSocket('ws://127.0.0.1:8081', {
        shouldReconnect: () => true,
        reconnectAttempts: 100,
        reconnectInterval: 3000,
    });

    // Handle physical button presses from the Logi Plugin
    useEffect(() => {
        if (!lastJsonMessage) return;
        const msg = lastJsonMessage as any;
        
        // Handle keyDown events for grid and navigation
        if (msg.event === 'keyDown' && msg.actionId) {
            const actionMap: { [key: string]: number | string } = {
                'mx_grid_0': 0, 'mx_grid_1': 1, 'mx_grid_2': 2,
                'mx_grid_3': 3, 'mx_grid_4': 4, 'mx_grid_5': 5,
                'mx_grid_6': 6, 'mx_grid_7': 7, 'mx_grid_8': 8,
                'mx_team_local': 'home',
                'mx_team_visitor': 'away',
                'mx_ad_text': 'ad_text',
                'mx_ad_video': 'ad_video'
            };

            const mapped = actionMap[msg.actionId];
            if (typeof mapped === 'number') {
                handleGridAction(mapped);
            } else if (mapped === 'home' || mapped === 'away') {
                setSelectedTeam(mapped as 'home' | 'away');
            } else if (mapped === 'ad_text') {
                toggleTextAd();
            } else if (mapped === 'ad_video') {
                toggleVideoAd();
            }
        }

        // Handle dial clicks and rotation events
        if (msg.actionId) {
            const actionId = msg.actionId;
            const isPaused = matchRef.current?.status !== 'live';

            // Toggle active selection via buttons
            if (actionId === 'mx_reloj_game_min') {
                setActiveClockSelection(prev => prev === 'game_min' ? null : 'game_min');
            } else if (actionId === 'mx_reloj_game_sec') {
                setActiveClockSelection(prev => prev === 'game_sec' ? null : 'game_sec');
            } else if (actionId === 'mx_reloj_1424_sec') {
                setActiveClockSelection(prev => prev === 'shot_sec' ? null : 'shot_sec');
            } else if (actionId === 'mx_reloj_1424_dec') {
                setActiveClockSelection(prev => prev === 'shot_dec' ? null : 'shot_dec');
            }

            // Dial click resets selection
            if (actionId === 'dial_click') {
                setActiveClockSelection(null);
                rotationAccumulatorRef.current = 0;
            }

            // Handle Rotation with software damping (2 ticks = 1 increment)
            if (isPaused && activeClockSelectionRef.current) {
                if (actionId === 'dial_left' || actionId === 'dial_right') {
                    const direction = actionId === 'dial_right' ? 1 : -1;
                    rotationAccumulatorRef.current += direction;

                    if (Math.abs(rotationAccumulatorRef.current) >= 2) {
                        const finalDir = rotationAccumulatorRef.current > 0 ? 1 : -1;
                        rotationAccumulatorRef.current = 0; // Reset
                        const mode = activeClockSelectionRef.current;
                        if (mode === 'game_min') handleClockAdjustment('minutos', finalDir);
                        else if (mode === 'game_sec') handleClockAdjustment('segundos', finalDir);
                        else if (mode === 'shot_sec') handleClockAdjustment('posesion', finalDir);
                        else if (mode === 'shot_dec') handleClockAdjustment('posesion_dec', finalDir);
                    }
                }
            }
        }
    }, [lastJsonMessage]);

    // Stream Images
    useEffect(() => {
        const streamImages = async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const images = [];
            for (let i = 0; i < 9; i++) {
                const node = document.getElementById(`mx_icon_capture_${i}`);
                if (node) {
                    try {
                        const dataUrl = await toPng(node, { quality: 0.95, pixelRatio: 2, width: 200, height: 200 });
                        const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
                        images.push({ id: `mx_grid_${i}`, image: base64 });
                    } catch (err) { console.error(err); }
                }
            }
            if (images.length > 0) sendWsMessage(JSON.stringify({ type: 'UPDATE_IMAGES', keys: images }));
        };
        if (match) streamImages();
    }, [match?.gamestate, selectedTeam, view, activePlayer?.id, match?.status]);

    // Initial Data Load (teams, players, ads — loaded ONCE)
    useEffect(() => {
        if (!id || !isAuthenticated) return;
        const fetchInitialData = async () => {
            try {
                const matchData = (await directus.request(readItem('matches', id, { fields: ['*', 'home_team.*', 'away_team.*'] as any }))) as any as Match;
                setMatch(matchData);
                try {
                    const tAds = await directus.request(readItems('text_ads' as any, { filter: { match: { _eq: id } } as any }));
                    setTextAds(tAds as any[]);
                    const vAds = await directus.request(readItems('video_ads' as any, { filter: { match: { _eq: id } } as any }));
                    setVideoAds(vAds as any[]);
                } catch (adErr) { console.warn(adErr); }
                const homeTeamId = matchData.home_team ? String(typeof matchData.home_team === 'object' ? matchData.home_team.id : matchData.home_team) : null;
                const awayTeamId = matchData.away_team ? String(typeof matchData.away_team === 'object' ? matchData.away_team.id : matchData.away_team) : null;
                if (homeTeamId && awayTeamId) {
                        const playersData = (await directus.request(readItems('players', { filter: { _or: [{ team: { _eq: homeTeamId } }, { team: { _eq: awayTeamId } }] }, limit: 100 }))) as Player[];
                        const generateRoster = (teamId: string) => Array.from({ length: 12 }, (_, i) => ({ id: `temp_${teamId}_${i+4}`, name: `Player ${i+4}`, number: i+4, team: teamId, temp: true }));
                        const realHome = playersData.filter((p: any) => String(typeof p.team === 'object' ? p.team.id : p.team) === homeTeamId);
                        const realAway = playersData.filter((p: any) => String(typeof p.team === 'object' ? p.team.id : p.team) === awayTeamId);
                        setHomePlayers(realHome.length > 0 ? realHome.sort((a,b)=>a.number-b.number) : generateRoster(homeTeamId));
                        setAwayPlayers(realAway.length > 0 ? realAway.sort((a,b)=>a.number-b.number) : generateRoster(awayTeamId));
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchInitialData();
    }, [id, isAuthenticated]);

    // Real-time match sync via WebSocket (with 1.5s polling fallback)
    // This replaces the old 2s heavy polling that fetched everything
    const lastLocalWriteRef = useRef<number>(0);
    const handleMatchSync = useCallback((data: any) => {
        // Skip WS updates that arrive within 500ms of our own writes
        // to avoid overwriting optimistic local state
        const timeSinceWrite = Date.now() - lastLocalWriteRef.current;
        if (timeSinceWrite < 500) return;

        setMatch(prev => {
            if (!prev) return prev;
            return { ...prev, ...data };
        });
    }, []);

    useMatchSubscription({
        matchId: id || null,
        fields: ['*', 'home_team.*', 'away_team.*'],
        skip: !isAuthenticated,
        onData: handleMatchSync,
        fallbackInterval: 1500,
    });

    // ─── Timer engine hook (100ms tick, anti-jump, shot clock) ──────────────
    const { localTimer, shotClock: localShotClock, formatShotClock } = useTimerEngine({ match });

    const handleClockAdjustment = (option: 'minutos' | 'segundos' | 'posesion' | 'posesion_dec', amount: number) => {
        if (!matchRef.current) return;
        const currentMatch = matchRef.current;
        let newTimer = currentMatch.timer_seconds;
        let newGamestate = { ...currentMatch.gamestate };
        if (option === 'minutos') newTimer = Math.max(0, currentMatch.timer_seconds + amount * 60);
        else if (option === 'segundos') newTimer = Math.max(0, currentMatch.timer_seconds + amount);
        else if (option === 'posesion') {
            const currentSc = currentMatch.gamestate?.shot_clock?.seconds ?? 24;
            newGamestate.shot_clock = { seconds: Math.max(0, currentSc + amount), started_at: null };
        }
        else if (option === 'posesion_dec') {
            const currentSc = currentMatch.gamestate?.shot_clock?.seconds ?? 24;
            newGamestate.shot_clock = { seconds: Math.max(0, Math.round((currentSc + (amount * 0.1)) * 10) / 10), started_at: null };
        }
        setMatch(prev => prev ? ({ ...prev, timer_seconds: newTimer, gamestate: newGamestate }) : null);
        if (updateDebounceRef.current) clearTimeout(updateDebounceRef.current);
        updateDebounceRef.current = setTimeout(async () => {
            lastLocalWriteRef.current = Date.now();
            await directus.request(updateItem('matches', currentMatch.id, { timer_seconds: newTimer, gamestate: newGamestate }));
        }, 300);
    };
    const updateDebounceRef = useRef<NodeJS.Timeout|null>(null);

    const toggleTimer = async () => {
        if (!match) return;
        const isRunning = match.status === 'live';
        const nowIso = new Date().toISOString();
        let updateObj: any = isRunning 
            ? { status: 'paused', timer_seconds: localTimer, timer_started_at: null }
            : { status: 'live', timer_started_at: nowIso };
        
        if (isRunning && match.gamestate?.shot_clock?.started_at) {
            const scElapsedMs = new Date().getTime() - new Date(match.gamestate.shot_clock.started_at).getTime();
            updateObj.gamestate = { ...match.gamestate, shot_clock: { seconds: Math.max(0, match.gamestate.shot_clock.seconds - (scElapsedMs/1000)), started_at: null } };
        } else if (!isRunning && match.gamestate?.shot_clock?.seconds !== undefined && !match.gamestate.shot_clock.started_at) {
            updateObj.gamestate = { ...match.gamestate, shot_clock: { ...match.gamestate.shot_clock, started_at: nowIso } };
        }
        setMatch(prev => ({ ...prev!, ...updateObj }));
        lastLocalWriteRef.current = Date.now();
        await directus.request(updateItem('matches', match.id, updateObj));
    };

    const resetShotClock = async (seconds: 14 | 24) => {
        if (!match) return;
        const newShotClock = { seconds, started_at: match.status === 'live' ? new Date().toISOString() : null };
        const newGamestate = { ...match.gamestate, shot_clock: newShotClock };
        setMatch(prev => ({ ...prev!, gamestate: newGamestate }));
        lastLocalWriteRef.current = Date.now();
        await directus.request(updateItem('matches', match.id, { gamestate: newGamestate }));
    };

    const handlePlayerAction = async (type: 'pts' | 'foul', value: number) => {
        if (!match || !activePlayer) return;
        const currentStats = match.gamestate?.player_stats || {};
        const playerStats = currentStats[activePlayer.id] || { points: 0, fouls: 0 };
        const isHome = selectedTeam === 'home';
        const scoreField = isHome ? 'home_score' : 'away_score';
        
        // Calculate new values with limits
        let newFouls = playerStats.fouls + (type === 'foul' ? value : 0);
        newFouls = Math.max(0, Math.min(newFouls, 5)); // Cap player fouls at 5
        
        const updatedStats = { ...currentStats, [activePlayer.id]: { points: Math.max(0, playerStats.points + (type === 'pts' ? value : 0)), fouls: newFouls } };
        const newScore = Math.max(0, (Number((match as any)[scoreField]) || 0) + (type === 'pts' ? value : 0));
        
        const foulField = isHome ? 'home_fouls' : 'away_fouls';
        const currentTeamFouls = Number(match.gamestate?.[foulField]) || 0;
        let newTeamFouls = currentTeamFouls + (type === 'foul' ? value : 0);
        newTeamFouls = Math.max(0, Math.min(newTeamFouls, 5)); // Cap team fouls at 5

        // Construct new events log
        let updatedEvents = [...(match.gamestate?.events || [])];
        if (value > 0) {
            updatedEvents.push({
                id: Math.random().toString(36).substring(2, 9),
                type,
                value,
                player_id: activePlayer.id,
                team: isHome ? 'home' : 'away',
                period: match.current_period || 1,
                time_remaining: Math.floor(localTimer),
                timestamp: new Date().toISOString()
            });
        } else {
            // Undo: find last matching event and remove it
            const idx = updatedEvents.map(e => ({...e})).reverse().findIndex(e => e.player_id === activePlayer.id && e.type === type);
            if (idx !== -1) {
                const realIdx = updatedEvents.length - 1 - idx;
                updatedEvents.splice(realIdx, 1);
            }
        }

        const newGamestate = { ...match.gamestate, player_stats: updatedStats, [foulField]: newTeamFouls, events: updatedEvents };
        setMatch(prev => ({ ...prev!, [scoreField]: newScore, gamestate: newGamestate }));
        try {
            lastLocalWriteRef.current = Date.now();
            await directus.request(updateItem('matches', match.id, { [scoreField]: newScore, gamestate: newGamestate }));
            setView('main'); setActivePlayer(null);
        } catch (e) { console.error(e); }
    };

    const handleTimeout = async () => {
        if (!match) return;
        const field = selectedTeam === 'home' ? 'home_timeouts' : 'away_timeouts';
        const newGamestate = { ...match.gamestate, [field]: (match.gamestate?.[field] || 0) + 1 };
        setMatch(prev => ({ ...prev!, gamestate: newGamestate }));
        lastLocalWriteRef.current = Date.now();
        await directus.request(updateItem('matches', match.id, { gamestate: newGamestate }));
    };

    const confirmSubstitution = async (benchIdRaw: any) => {
        if (!match || !activePlayer) return;
        const field = selectedTeam === 'home' ? 'home_on_court' : 'away_on_court';
        const subInId = getStrId(benchIdRaw);
        const subOutId = getStrId(activePlayer.id);
        const newOnCourt = getOnCourt().map(p => getStrId(p.id) === subOutId ? subInId : getStrId(p.id));
        const newGS = { ...match.gamestate, [field]: newOnCourt };
        setMatch(prev => ({ ...prev!, gamestate: newGS }));
        lastLocalWriteRef.current = Date.now();
        await directus.request(updateItem('matches', match.id, { gamestate: newGS }));
        setView('main'); setActivePlayer(null);
    };

    const getOnCourt = () => {
        if (!match) return [];
        const players = selectedTeam === 'home' ? homePlayers : awayPlayers;
        const courtIds = (selectedTeam === 'home' ? match.gamestate?.home_on_court : match.gamestate?.away_on_court) || [];
        const onCourt = players.filter(p => courtIds.some((id: any) => getStrId(id) === getStrId(p.id)));
        return (onCourt.length > 0 ? onCourt : players.slice(0, 5)).sort((a,b) => a.number - b.number);
    };

    const getBench = () => {
        const players = selectedTeam === 'home' ? homePlayers : awayPlayers;
        const onCourtIds = getOnCourt().map(p => getStrId(p.id));
        return players.filter(p => !onCourtIds.includes(getStrId(p.id)));
    };

    const handleGridAction = (index: number) => {
        if (view === 'main') {
            const players = getOnCourt();
            if (index < 5 && players[index]) { setActivePlayer(players[index]); setView('actions'); }
            else if (index === 5) handleTimeout(); else if (index === 6) toggleTimer();
            else if (index === 7) resetShotClock(14); else if (index === 8) resetShotClock(24);
        } else if (view === 'actions') {
            const map: any[] = [['pts',1],['pts',2],['pts',3],['pts',-1],['pts',-2],['pts',-3],['foul',1],['foul',-1]];
            if (index < 8) handlePlayerAction(map[index][0], map[index][1]); else setView('substitution');
        } else if (view === 'substitution') {
            const bench = getBench(); if (bench[index]) confirmSubstitution(bench[index].id);
        }
    };

    const toggleTextAd = async () => {
        if (!match || match.status !== 'paused' || textAds.length === 0) return;
        const current = (match as any).active_ad_text;
        let next = null;
        if (!current) { next = textAds[textAdIndexRef.current].content; textAdIndexRef.current = (textAdIndexRef.current + 1) % textAds.length; }
        setMatch(prev => prev ? ({ ...prev, active_ad_text: next } as any) : null);
        lastLocalWriteRef.current = Date.now();
        await directus.request(updateItem('matches', match.id, { active_ad_text: next } as any));
    };

    const toggleVideoAd = async () => {
        if (!match || match.status !== 'paused' || videoAds.length === 0) return;
        const current = (match as any).active_ad_video;
        let next = null;
        if (!current) { next = videoAds[videoAdIndexRef.current].video; videoAdIndexRef.current = (videoAdIndexRef.current + 1) % videoAds.length; }
        setMatch(prev => prev ? ({ ...prev, active_ad_video: next } as any) : null);
        lastLocalWriteRef.current = Date.now();
        await directus.request(updateItem('matches', match.id, { active_ad_video: next } as any));
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading MX...</div>;
    if (!match) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">Match Not Found</div>;

    const onCourt = getOnCourt();
    const bench = getBench();
    const isRunning = match.status === 'live';
    const shotClockValRaw = localShotClock ?? match.gamestate?.shot_clock?.seconds ?? 24;
    const shotClockDisplay = (shotClockValRaw < 5 && shotClockValRaw > 0) ? shotClockValRaw.toFixed(1) : Math.ceil(shotClockValRaw).toString();

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6 font-sans select-none overflow-hidden radial-gradient relative">
            <div className="flex justify-between items-end mb-8 px-2">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
                        <span className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-black">LOGI MX CREATIVE</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter">
                        <span className={`${selectedTeam === 'home' ? 'text-purple-500' : 'text-green-500'}`}>
                            {selectedTeam === 'home' ? (typeof match.home_team === 'object' ? match.home_team.name : 'LOCAL') : (typeof match.away_team === 'object' ? match.away_team.name : 'VISITANTE')}
                        </span>
                    </h1>
                </div>
                <div className="flex gap-4 items-center">
                    <div className={`flex flex-col items-center bg-white/5 border px-4 py-2 rounded-2xl ${activeClockSelection==='shot_sec' || activeClockSelection==='shot_dec' ? 'border-amber-500' : 'border-white/10'}`}>
                        <span className="text-[10px] text-amber-500 font-bold tracking-widest">SHOT</span>
                        <span className="text-3xl font-mono font-black italic text-amber-500 leading-none">{shotClockDisplay}</span>
                    </div>
                    <div className={`text-4xl font-mono font-black italic flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border ${activeClockSelection ? 'border-cyan-500' : 'border-white/10'}`}>
                        <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {localTimer >= 60 || localTimer === 0 ? (
                            <>
                                <span className={activeClockSelection === 'game_min' ? 'text-cyan-400' : ''}>{Math.floor(localTimer/60).toString().padStart(2,'0')}</span>
                                <span className="opacity-30">:</span>
                                <span className={activeClockSelection === 'game_sec' ? 'text-cyan-400' : ''}>{Math.floor(localTimer%60).toString().padStart(2,'0')}</span>
                            </>
                        ) : (
                            <>
                                <span className={activeClockSelection === 'game_sec' ? 'text-cyan-400' : 'text-red-400'}>{Math.floor(localTimer).toString().padStart(2, '0')}</span>
                                <span className="opacity-30 text-red-500">.</span>
                                <span className="text-red-400">{Math.floor((localTimer % 1) * 10).toString()}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <PlayerGrid
                view={view}
                onCourt={onCourt}
                bench={bench}
                selectedTeam={selectedTeam}
                isRunning={isRunning}
                gamestate={match.gamestate}
                onGridAction={handleGridAction}
                onPlayerAction={handlePlayerAction}
                onSubstitution={confirmSubstitution}
                onSetView={setView}
            />

            <div className="flex justify-between gap-6 mt-auto">
                <button onClick={() => setSelectedTeam('home')} className={`flex-1 flex items-center justify-center gap-4 h-20 rounded-[2rem] border-2 transition-all duration-300 font-black text-2xl ${selectedTeam === 'home' ? 'bg-purple-600 border-purple-400' : 'bg-white/5 border-transparent opacity-30 text-white'}`}><ChevronLeft size={40} strokeWidth={4} /> LOCAL</button>
                {view !== 'main' && <button onClick={() => { setView('main'); setActivePlayer(null); }} className="w-20 h-20 rounded-[2rem] bg-white/10 flex items-center justify-center"><X size={40} strokeWidth={4} /></button>}
                <button onClick={() => setSelectedTeam('away')} className={`flex-1 flex items-center justify-center gap-4 h-20 rounded-[2rem] border-2 transition-all duration-300 font-black text-2xl ${selectedTeam === 'away' ? 'bg-green-600 border-green-400' : 'bg-white/5 border-transparent opacity-30 text-white'}`}>VISITANTE <ChevronRight size={40} strokeWidth={4} /></button>
            </div>

            <style jsx global>{`
                body { background-color: #0a0a0a; overscroll-behavior: none; }
                .radial-gradient { background: radial-gradient(circle at 50% -20%, #1a1a1a 0%, #0a0a0a 100%); }
            `}</style>
        </main>
    );
}
