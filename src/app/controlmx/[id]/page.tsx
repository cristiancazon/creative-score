'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { directus } from '@/lib/directus';
import { readItem, updateItem, readMe, readItems } from '@directus/sdk';
import { Match, Player } from '@/types/directus';
import { Play, Pause, ChevronLeft, ChevronRight, X, ArrowLeft, ArrowRight } from 'lucide-react';
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
    const [localTimer, setLocalTimer] = useState(0);

    // Ads State
    const [textAds, setTextAds] = useState<any[]>([]);
    const [videoAds, setVideoAds] = useState<any[]>([]);
    const textAdIndexRef = useRef(0);
    const videoAdIndexRef = useRef(0);

    // Clock Edit State & Refs for WebSocket
    const [activeClockSelection, setActiveClockSelection] = useState<'game_min' | 'game_sec' | 'shot_sec' | null>(null);
    const activeClockSelectionRef = useRef<'game_min' | 'game_sec' | 'shot_sec' | null>(null);
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

    // Fetch Logic
    useEffect(() => {
        if (!id || !isAuthenticated) return;
        const fetchData = async () => {
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
                if (homeTeamId && awayTeamId && homePlayers.length === 0) {
                        const playersData = (await directus.request(readItems('players', { filter: { _or: [{ team: { _eq: homeTeamId } }, { team: { _eq: awayTeamId } }] }, limit: 100 }))) as Player[];
                        const generateRoster = (teamId: string) => Array.from({ length: 12 }, (_, i) => ({ id: `temp_${teamId}_${i+4}`, name: `Player ${i+4}`, number: i+4, team: teamId, temp: true }));
                        const realHome = playersData.filter((p: any) => String(typeof p.team === 'object' ? p.team.id : p.team) === homeTeamId);
                        const realAway = playersData.filter((p: any) => String(typeof p.team === 'object' ? p.team.id : p.team) === awayTeamId);
                        setHomePlayers(realHome.length > 0 ? realHome.sort((a,b)=>a.number-b.number) : generateRoster(homeTeamId));
                        setAwayPlayers(realAway.length > 0 ? realAway.sort((a,b)=>a.number-b.number) : generateRoster(awayTeamId));
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [id, isAuthenticated]);

    // Timer Logic
    useEffect(() => {
        const update = () => {
            if (!match) return;
            if (match.status === 'live' && match.timer_started_at) {
                const elapsed = Math.floor((new Date().getTime() - new Date(match.timer_started_at).getTime()) / 1000);
                setLocalTimer(Math.max(0, match.timer_seconds - elapsed));
            } else setLocalTimer(match.timer_seconds);
        };
        update();
        const interval = setInterval(update, 200);
        return () => clearInterval(interval);
    }, [match]);

    const handleClockAdjustment = (option: 'minutos' | 'segundos' | 'posesion', amount: number) => {
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
        setLocalTimer(newTimer);
        setMatch(prev => prev ? ({ ...prev, timer_seconds: newTimer, gamestate: newGamestate }) : null);
        if (updateDebounceRef.current) clearTimeout(updateDebounceRef.current);
        updateDebounceRef.current = setTimeout(async () => {
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
            const scElapsed = Math.floor((new Date().getTime() - new Date(match.gamestate.shot_clock.started_at).getTime())/1000);
            updateObj.gamestate = { ...match.gamestate, shot_clock: { seconds: Math.max(0, match.gamestate.shot_clock.seconds - scElapsed), started_at: null } };
        } else if (!isRunning && match.gamestate?.shot_clock?.seconds !== undefined && !match.gamestate.shot_clock.started_at) {
            updateObj.gamestate = { ...match.gamestate, shot_clock: { ...match.gamestate.shot_clock, started_at: nowIso } };
        }
        setMatch(prev => ({ ...prev!, ...updateObj }));
        await directus.request(updateItem('matches', match.id, updateObj));
    };

    const resetShotClock = async (seconds: 14 | 24) => {
        if (!match) return;
        const newShotClock = { seconds, started_at: match.status === 'live' ? new Date().toISOString() : null };
        const newGamestate = { ...match.gamestate, shot_clock: newShotClock };
        setMatch(prev => ({ ...prev!, gamestate: newGamestate }));
        await directus.request(updateItem('matches', match.id, { gamestate: newGamestate }));
    };

    const handlePlayerAction = async (type: 'pts' | 'foul', value: number) => {
        if (!match || !activePlayer) return;
        const currentStats = match.gamestate?.player_stats || {};
        const playerStats = currentStats[activePlayer.id] || { points: 0, fouls: 0 };
        const isHome = selectedTeam === 'home';
        const scoreField = isHome ? 'home_score' : 'away_score';
        const updatedStats = { ...currentStats, [activePlayer.id]: { points: Math.max(0, playerStats.points + (type === 'pts' ? value : 0)), fouls: Math.max(0, playerStats.fouls + (type === 'foul' ? value : 0)) } };
        const newScore = Math.max(0, (Number((match as any)[scoreField]) || 0) + (type === 'pts' ? value : 0));
        const newGamestate = { ...match.gamestate, player_stats: updatedStats };
        setMatch(prev => ({ ...prev!, [scoreField]: newScore, gamestate: newGamestate }));
        try {
            await directus.request(updateItem('matches', match.id, { [scoreField]: newScore, gamestate: newGamestate }));
            setView('main'); setActivePlayer(null);
        } catch (e) { console.error(e); }
    };

    const handleTimeout = async () => {
        if (!match) return;
        const field = selectedTeam === 'home' ? 'home_timeouts' : 'away_timeouts';
        const newGamestate = { ...match.gamestate, [field]: (match.gamestate?.[field] || 0) + 1 };
        setMatch(prev => ({ ...prev!, gamestate: newGamestate }));
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
        await directus.request(updateItem('matches', match.id, { active_ad_text: next } as any));
    };

    const toggleVideoAd = async () => {
        if (!match || match.status !== 'paused' || videoAds.length === 0) return;
        const current = (match as any).active_ad_video;
        let next = null;
        if (!current) { next = videoAds[videoAdIndexRef.current].video; videoAdIndexRef.current = (videoAdIndexRef.current + 1) % videoAds.length; }
        setMatch(prev => prev ? ({ ...prev, active_ad_video: next } as any) : null);
        await directus.request(updateItem('matches', match.id, { active_ad_video: next } as any));
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading MX...</div>;
    if (!match) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">Match Not Found</div>;

    const onCourt = getOnCourt();
    const bench = getBench();
    const isRunning = match.status === 'live';
    const shotClockValue = match.gamestate?.shot_clock?.seconds ?? 24;

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
                    <div className={`flex flex-col items-center bg-white/5 border px-4 py-2 rounded-2xl ${activeClockSelection==='shot_sec' ? 'border-amber-500' : 'border-white/10'}`}>
                        <span className="text-[10px] text-amber-500 font-bold tracking-widest">SHOT</span>
                        <span className="text-3xl font-mono font-black italic text-amber-500 leading-none">{shotClockValue}</span>
                    </div>
                    <div className={`text-4xl font-mono font-black italic flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border ${activeClockSelection ? 'border-cyan-500' : 'border-white/10'}`}>
                        <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={activeClockSelection === 'game_min' ? 'text-cyan-400' : ''}>{Math.floor(localTimer/60).toString().padStart(2,'0')}</span>
                        <span className="opacity-30">:</span>
                        <span className={activeClockSelection === 'game_sec' ? 'text-cyan-400' : ''}>{(localTimer%60).toString().padStart(2,'0')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 grid-rows-3 gap-4 flex-1 max-w-[600px] mx-auto w-full mb-8">
                {view === 'main' && (
                    <>
                        {onCourt.map((p, idx) => (
                            <button key={p.id} id={`mx_btn_${idx}`} onClick={() => handleGridAction(idx)} className={`rounded-[2.5rem] flex flex-col items-center justify-center relative border-2 ${selectedTeam === 'home' ? 'bg-purple-900/20 border-purple-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
                                <span className={`text-5xl font-black mb-1 ${selectedTeam === 'home' ? 'text-purple-400' : 'text-green-400'}`}>{p.number}</span>
                                <span className="text-[10px] uppercase font-black opacity-50 truncate w-full px-4 text-center">{p.name}</span>
                                {match.gamestate?.player_stats?.[p.id]?.fouls > 0 && <div className="absolute top-4 right-4 text-red-500 font-black text-xs">F:{match.gamestate.player_stats[p.id].fouls}</div>}
                            </button>
                        ))}
                        {Array.from({ length: 5 - onCourt.length }).map((_, i) => <div key={i} className="bg-white/5 border-2 border-white/5 rounded-[2.5rem] flex items-center justify-center"><span className="opacity-10 font-black">EMPTY</span></div>)}
                        <button id="mx_btn_5" onClick={() => handleGridAction(5)} className="rounded-[2.5rem] border-2 bg-white/5 border-white/10 flex flex-col items-center justify-center"><div className="flex gap-1 mb-2">{[1, 2, 3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i <= (match.gamestate?.[selectedTeam==='home'?'home_timeouts':'away_timeouts']||0)?'bg-red-500':'bg-white/10'}`}></div>)}</div><span className="text-[10px] font-black opacity-50">TIMEOUT</span></button>
                        <button id="mx_btn_6" onClick={() => handleGridAction(6)} className={`rounded-[2.5rem] border-2 flex flex-col items-center justify-center ${isRunning ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-500'}`}>{isRunning ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}<span className="text-[10px] font-black uppercase mt-1">{isRunning ? 'PAUSE' : 'PLAY'}</span></button>
                        <button id="mx_btn_7" onClick={() => handleGridAction(7)} className="rounded-[2.5rem] border-2 bg-red-900/10 border-red-500/30 text-red-500 flex items-center justify-center"><span className="text-6xl font-black">14</span></button>
                        <button id="mx_btn_8" onClick={() => handleGridAction(8)} className="rounded-[2.5rem] border-2 bg-red-900/10 border-red-500/30 text-red-500 flex items-center justify-center"><span className="text-6xl font-black">24</span></button>
                    </>
                )}
                {view === 'actions' && (
                    <>
                        {[1, 2, 3, -1, -2, -3].map((v, i) => (
                            <button key={i} id={`mx_btn_${i}`} onClick={() => handlePlayerAction('pts', v)} className={`rounded-[2.5rem] border-2 flex items-center justify-center ${v>0?'bg-blue-500/10 border-blue-500/30 text-blue-400':'bg-red-500/10 border-red-500/30 text-red-500'}`}><span className="text-6xl font-black">{v > 0 ? `+${v}` : v}</span></button>
                        ))}
                        <button id="mx_btn_6" onClick={() => handlePlayerAction('foul', 1)} className="rounded-[2.5rem] border-2 bg-orange-500/10 border-orange-500/30 text-orange-400 flex items-center justify-center font-black text-5xl">+F</button>
                        <button id="mx_btn_7" onClick={() => handlePlayerAction('foul', -1)} className="rounded-[2.5rem] border-2 bg-orange-900/10 border-orange-900/30 text-orange-900 flex items-center justify-center font-black text-5xl">-F</button>
                        <button id="mx_btn_8" onClick={() => setView('substitution')} className="rounded-[2.5rem] border-2 bg-white/10 border-white/20 text-white flex items-center justify-center font-black text-6xl">C</button>
                    </>
                )}
                {view === 'substitution' && bench.slice(0,9).map((p, idx) => (
                    <button key={p.id} id={`mx_btn_${idx}`} onClick={() => confirmSubstitution(p.id)} className="rounded-[2.5rem] border-2 bg-blue-500/10 border-blue-500/30 flex flex-col items-center justify-center"><span className="text-5xl font-black text-blue-400">{p.number}</span><span className="text-[10px] font-black opacity-50 uppercase truncate w-full px-2 text-center">{p.name}</span></button>
                ))}
            </div>

            <div className="flex justify-between gap-6 mt-auto">
                <button onClick={() => setSelectedTeam('home')} className={`flex-1 flex items-center justify-center gap-4 h-20 rounded-[2rem] border-2 transition-all duration-300 font-black text-2xl ${selectedTeam === 'home' ? 'bg-purple-600 border-purple-400' : 'bg-white/5 border-transparent opacity-30 text-white'}`}><ChevronLeft size={40} strokeWidth={4} /> LOCAL</button>
                {view !== 'main' && <button onClick={() => { setView('main'); setActivePlayer(null); }} className="w-20 h-20 rounded-[2rem] bg-white/10 flex items-center justify-center"><X size={40} strokeWidth={4} /></button>}
                <button onClick={() => setSelectedTeam('away')} className={`flex-1 flex items-center justify-center gap-4 h-20 rounded-[2rem] border-2 transition-all duration-300 font-black text-2xl ${selectedTeam === 'away' ? 'bg-green-600 border-green-400' : 'bg-white/5 border-transparent opacity-30 text-white'}`}>VISITANTE <ChevronRight size={40} strokeWidth={4} /></button>
            </div>

            <div className="fixed bottom-[-2000px] left-[-2000px] grid grid-cols-3 gap-0 opacity-100 pointer-events-none p-0 m-0">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} id={`mx_icon_capture_${i}`} className="w-[200px] h-[200px] bg-black flex items-center justify-center overflow-hidden">
                         <div className="w-full h-full flex flex-col items-center justify-center text-center">
                             {view === 'main' && (
                                <>
                                    {i < 5 && onCourt[i] ? (
                                        <div className="flex flex-col items-center"><span className={`text-9xl font-black leading-none ${selectedTeam === 'home' ? 'text-purple-500' : 'text-green-500'}`}>{onCourt[i].number}</span><span className="text-[20px] font-black text-white/50 uppercase">{onCourt[i].name?.substring(0,8)}</span></div>
                                    ) : i === 5 ? (
                                        <div className="flex flex-col items-center"><div className="w-16 h-16 rounded-full border-8 border-red-500 flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-red-500"></div></div><span className="text-[24px] font-black text-red-500 uppercase mt-2">TIME</span></div>
                                    ) : i === 6 ? (
                                        <div className="flex flex-col items-center">{isRunning ? <Pause size={100} className="text-amber-500" fill="currentColor"/> : <Play size={100} className="text-blue-500 ml-4" fill="currentColor"/>}<span className={`text-[24px] font-black uppercase mt-2 ${isRunning ? 'text-amber-500':'text-blue-500'}`}>{isRunning?'PAUSE':'PLAY'}</span></div>
                                    ) : i === 7 ? (
                                        <div className="flex flex-col items-center"><span className="text-[120px] font-black text-red-500 leading-none">14</span><span className="text-[20px] font-black text-red-500/50 uppercase">SHOT</span></div>
                                    ) : i === 8 ? (
                                        <div className="flex flex-col items-center"><span className="text-[120px] font-black text-red-500 leading-none">24</span><span className="text-[20px] font-black text-red-500/50 uppercase">SHOT</span></div>
                                    ) : null}
                                </>
                             )}
                             {view === 'actions' && (
                                <div className="flex flex-col items-center">
                                     {i < 3 ? <span className="text-[120px] font-black text-blue-500">+{i+1}</span> 
                                     : i < 6 ? <span className="text-[120px] font-black text-red-500">-{i-2}</span>
                                     : i === 6 ? <span className="text-[120px] font-black text-orange-500">+F</span>
                                     : i === 7 ? <span className="text-[120px] font-black text-orange-900">-F</span>
                                     : <span className="text-9xl font-black text-white">SUB</span>}
                                </div>
                             )}
                             {view === 'substitution' && bench[i] && (
                                <div className="flex flex-col items-center"><span className="text-9xl font-black text-blue-500 leading-none">{bench[i].number}</span><span className="text-[20px] font-black text-white/50 uppercase">{bench[i].name?.substring(0,8)}</span></div>
                             )}
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                body { background-color: #0a0a0a; overscroll-behavior: none; }
                .radial-gradient { background: radial-gradient(circle at 50% -20%, #1a1a1a 0%, #0a0a0a 100%); }
            `}</style>
        </main>
    );
}
