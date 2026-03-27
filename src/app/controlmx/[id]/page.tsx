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

    // Clock Edit State & Refs
    const [activeClockSelection, setActiveClockSelection] = useState<'game_min' | 'game_sec' | 'shot_sec' | null>(null);
    const activeClockSelectionRef = useRef<'game_min' | 'game_sec' | 'shot_sec' | null>(null);
    const matchRef = useRef<Match | null>(null);
    const updateDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const rotationAccumulatorRef = useRef(0);

    // Keep refs in sync
    useEffect(() => { activeClockSelectionRef.current = activeClockSelection; rotationAccumulatorRef.current = 0; }, [activeClockSelection]);
    useEffect(() => { matchRef.current = match; }, [match]);

    // Check Auth
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await directus.getToken();
                if (!token) { router.push('/login'); return; }
                await directus.request(readMe());
                setIsAuthenticated(true);
            } catch (e) { router.push('/login'); }
        };
        checkAuth();
    }, [router]);

    const { sendMessage: sendWsMessage, lastJsonMessage } = useWebSocket('ws://127.0.0.1:8081', {
        shouldReconnect: () => true,
        reconnectAttempts: 100,
        reconnectInterval: 3000,
    });

    const handleClockAdjustment = (option: 'minutos' | 'segundos' | 'posesion', amount: number) => {
        if (!matchRef.current) return;
        const currentMatch = matchRef.current;
        let newTimer = currentMatch.timer_seconds;
        let newGamestate = { ...currentMatch.gamestate };

        if (option === 'minutos') newTimer = Math.max(0, currentMatch.timer_seconds + amount * 60);
        else if (option === 'segundos') newTimer = Math.max(0, currentMatch.timer_seconds + amount);
        else if (option === 'posesion') {
            const currentSc = currentMatch.gamestate?.shot_clock?.seconds ?? 24;
            const newSc = Math.max(0, currentSc + amount);
            newGamestate.shot_clock = { ...currentMatch.gamestate?.shot_clock, seconds: newSc, started_at: null };
        }

        setLocalTimer(newTimer);
        setMatch(prev => prev ? { ...prev, timer_seconds: newTimer, gamestate: newGamestate } : null);

        if (updateDebounceRef.current) clearTimeout(updateDebounceRef.current);
        updateDebounceRef.current = setTimeout(async () => {
            try {
                await directus.request(updateItem('matches', currentMatch.id, { timer_seconds: newTimer, gamestate: newGamestate }));
            } catch (err) {}
        }, 300);
    };

    useEffect(() => {
        if (!lastJsonMessage) return;
        const msg = lastJsonMessage as any;
        if (msg.event === 'keyDown' && msg.actionId) {
            const actionId = msg.actionId;
            const isPaused = matchRef.current?.status !== 'live';

            const actionMap: { [key: string]: number | string } = {
                'mx_grid_0': 0, 'mx_grid_1': 1, 'mx_grid_2': 2,
                'mx_grid_3': 3, 'mx_grid_4': 4, 'mx_grid_5': 5,
                'mx_grid_6': 6, 'mx_grid_7': 7, 'mx_grid_8': 8,
                'mx_team_local': 'home', 'mx_team_visitor': 'away',
                'mx_ad_text': 'ad_text', 'mx_ad_video': 'ad_video'
            };

            const mapped = actionMap[actionId];
            if (typeof mapped === 'number') handleGridAction(mapped);
            else if (mapped === 'home' || mapped === 'away') setSelectedTeam(mapped as any);
            else if (mapped === 'ad_text') toggleTextAd();
            else if (mapped === 'ad_video') toggleVideoAd();
            
            if (actionId === 'mx_reloj_game_min') setActiveClockSelection(prev => prev === 'game_min' ? null : 'game_min');
            else if (actionId === 'mx_reloj_game_sec') setActiveClockSelection(prev => prev === 'game_sec' ? null : 'game_sec');
            else if (actionId === 'mx_reloj_1424_sec') setActiveClockSelection(prev => prev === 'shot_sec' ? null : 'shot_sec');

            if (isPaused) {
                if (actionId === 'dial_click') setActiveClockSelection(null);
                else if (activeClockSelectionRef.current && (actionId === 'dial_left' || actionId === 'dial_right')) {
                    const direction = actionId === 'dial_right' ? 1 : -1;
                    const mode = activeClockSelectionRef.current;
                    rotationAccumulatorRef.current += direction;
                    if (Math.abs(rotationAccumulatorRef.current) >= 2) {
                        const finalAmount = rotationAccumulatorRef.current > 0 ? 1 : -1;
                        rotationAccumulatorRef.current = 0;
                        if (mode === 'game_min') handleClockAdjustment('minutos', finalAmount);
                        else if (mode === 'game_sec') handleClockAdjustment('segundos', finalAmount);
                        else if (mode === 'shot_sec') handleClockAdjustment('posesion', finalAmount);
                    }
                }
            }
        }
    }, [lastJsonMessage]);

    useEffect(() => {
        const streamImages = async () => {
            await new Promise(resolve => setTimeout(resolve, 400));
            const images = [];
            const idsToCapture = [
                ...[0,1,2,3,4,5,6,7,8].map(i => `mx_btn_${i}`),
                'mx_reloj_game_min', 'mx_reloj_game_sec', 'mx_reloj_1424_sec', 'mx_dial_click'
            ];
            for (const id of idsToCapture) {
                const node = document.getElementById(id);
                if (node) {
                    try {
                        const dataUrl = await toPng(node, { 
                            quality: 0.9, pixelRatio: 1, backgroundColor: '#000000', width: 250, height: 156,
                            style: { width: '250px', height: '156px', margin: '0', padding: '0', borderRadius: '0', border: 'none', display: 'flex' }
                        });
                        const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
                        let actionId = id;
                        if (id.startsWith('mx_btn_')) actionId = `mx_grid_${id.split('_')[2]}`;
                        if (id === 'mx_dial_click') actionId = 'Control_Clock_Dial';
                        images.push({ id: actionId, image: base64 });
                    } catch (err) {}
                }
            }
            if (images.length > 0) sendWsMessage(JSON.stringify({ type: 'UPDATE_IMAGES', keys: images }));
        };
        if (match) streamImages();
    }, [match?.gamestate, selectedTeam, view, activePlayer?.id, match?.status, activeClockSelection]);

    useEffect(() => {
        if (!id || !isAuthenticated) return;
        const fetchData = async () => {
            try {
                const matchData = (await directus.request(readItem('matches', id, { fields: ['*', 'home_team.*', 'away_team.*'] as any }))) as any as Match;
                setMatch(matchData);
                const tAds = (await directus.request(readItems('text_ads' as any, { filter: { match: { _eq: id } } as any }))) as any[];
                setTextAds(tAds);
                const vAds = (await directus.request(readItems('video_ads' as any, { filter: { match: { _eq: id } } as any }))) as any[];
                setVideoAds(vAds);
                const hId = matchData.home_team ? (typeof matchData.home_team === 'object' ? matchData.home_team.id : matchData.home_team) : null;
                const aId = matchData.away_team ? (typeof matchData.away_team === 'object' ? matchData.away_team.id : matchData.away_team) : null;
                if (hId && aId && homePlayers.length === 0) {
                    const ps = (await directus.request(readItems('players', { filter: { _or: [{ team: { _eq: hId } }, { team: { _eq: aId } }] }, limit: 100 }))) as Player[];
                    setHomePlayers(ps.filter((p: any) => (typeof p.team === 'object' ? p.team.id : p.team) === hId).sort((a,b)=>a.number-b.number));
                    setAwayPlayers(ps.filter((p: any) => (typeof p.team === 'object' ? p.team.id : p.team) === aId).sort((a,b)=>a.number-b.number));
                }
            } catch (err) {} finally { setLoading(false); }
        };
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [id, isAuthenticated]);

    useEffect(() => {
        const up = () => {
            if (!match) return;
            if (match.status === 'live' && match.timer_started_at) {
                const now = new Date().getTime();
                const sAt = new Date(match.timer_started_at).getTime();
                setLocalTimer(Math.max(0, match.timer_seconds - Math.floor((now - sAt) / 1000)));
            } else setLocalTimer(match.timer_seconds);
        };
        up();
        const interval = setInterval(up, 200);
        return () => clearInterval(interval);
    }, [match]);

    const toggleTimer = async () => {
        if (!match) return;
        const s = match.status === 'live' ? 'paused' : 'live';
        await directus.request(updateItem('matches', match.id, {
            status: s,
            timer_seconds: localTimer,
            timer_started_at: s === 'live' ? new Date().toISOString() : null
        }));
    };

    const resetShotClock = async (seconds: 14 | 24) => {
        if (!match) return;
        const gs = { ...match.gamestate, shot_clock: { seconds, started_at: match.status === 'live' ? new Date().toISOString() : null } };
        await directus.request(updateItem('matches', match.id, { gamestate: gs }));
    };

    const toggleTextAd = async () => {
        if (textAds.length === 0 || !match) return;
        const next = (textAdIndexRef.current + 1) % textAds.length;
        textAdIndexRef.current = next;
        await directus.request(updateItem('matches', match.id, { ad_text: textAds[next].text }));
    };

    const toggleVideoAd = async () => {
        if (videoAds.length === 0 || !match) return;
        const next = (videoAdIndexRef.current + 1) % videoAds.length;
        videoAdIndexRef.current = next;
        await directus.request(updateItem('matches', match.id, { ad_video: videoAds[next].id }));
    };

    const handleTimeout = async () => {
        if (!match) return;
        const teamKey = selectedTeam === 'home' ? 'home_timeouts' : 'away_timeouts';
        const current = match.gamestate?.[teamKey] || 0;
        await directus.request(updateItem('matches', match.id, { gamestate: { ...match.gamestate, [teamKey]: Math.max(0, current + 1) } }));
    };

    const handlePlayerAction = async (type: 'pts' | 'foul', value: number) => {
        if (!match || !activePlayer) return;
        const pid = String(activePlayer.id);
        const stats = { ...(match.gamestate?.player_stats || {}) };
        if (!stats[pid]) stats[pid] = { pts: 0, fouls: 0 };
        if (type === 'pts') stats[pid].pts = Math.max(0, (stats[pid].pts || 0) + value);
        if (type === 'foul') stats[pid].fouls = Math.max(0, (stats[pid].fouls || 0) + value);

        const update: any = { gamestate: { ...match.gamestate, player_stats: stats } };
        if (type === 'pts') {
            const teamPts = selectedTeam === 'home' ? 'home_score' : 'away_score';
            update[teamPts] = Math.max(0, (match[teamPts] || 0) + value);
        }
        await directus.request(updateItem('matches', match.id, update));
    };

    const confirmSubstitution = async (benchId: string) => {
        if (!match || !activePlayer) return;
        const courtKey = selectedTeam === 'home' ? 'home_on_court' : 'away_on_court';
        const court = [...(match.gamestate?.[courtKey] || [])];
        const idx = court.findIndex(cid => String(typeof cid === 'object' ? cid.id : cid) === String(activePlayer.id));
        if (idx !== -1) {
            court[idx] = benchId;
            await directus.request(updateItem('matches', match.id, { gamestate: { ...match.gamestate, [courtKey]: court } }));
            setView('main'); setActivePlayer(null);
        }
    };

    const getStrId = (id: any) => (typeof id === 'object' ? id.id : String(id));
    const getOnCourt = () => {
        if (!match) return [];
        const teamPlayers = selectedTeam === 'home' ? homePlayers : awayPlayers;
        const courtIds = (selectedTeam === 'home' ? match.gamestate?.home_on_court : match.gamestate?.away_on_court) as any[] || [];
        const onCourt = teamPlayers.filter(p => courtIds.some(cid => getStrId(cid) === getStrId(p.id)));
        return (onCourt.length > 0 ? onCourt : teamPlayers.slice(0, 5)).sort((a,b)=>a.number-b.number).slice(0,5);
    };
    const getBench = () => {
        const teamPlayers = selectedTeam === 'home' ? homePlayers : awayPlayers;
        const onCourtIds = getOnCourt().map(p => getStrId(p.id));
        return teamPlayers.filter(p => !onCourtIds.includes(getStrId(p.id)));
    };

    const handleGridAction = (index: number) => {
        if (view === 'main') {
            const players = getOnCourt();
            if (index < 5) { if (players[index]) { setActivePlayer(players[index]); setView('actions'); } }
            else if (index === 5) handleTimeout();
            else if (index === 6) toggleTimer();
            else if (index === 7) resetShotClock(14);
            else if (index === 8) resetShotClock(24);
        } else if (view === 'actions') {
            if (index < 3) handlePlayerAction('pts', index + 1);
            else if (index === 3) handlePlayerAction('pts', -1);
            else if (index === 4) setView('substitution');
            else if (index === 5) { setView('main'); setActivePlayer(null); }
            else if (index === 6) handlePlayerAction('foul', 1);
            else if (index === 7) handlePlayerAction('foul', -1);
        } else if (view === 'substitution') {
            const bench = getBench();
            if (index < bench.length) confirmSubstitution(bench[index].id);
            else if (index === 8) setView('actions');
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono gap-3">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
        <span>CARGANDO SCOREBOARD...</span>
    </div>;
    if (!match) return <div>No match.</div>;

    const teamColor = selectedTeam === 'home' ? 'purple' : 'green';
    const players = getOnCourt();
    const bench = getBench();

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6 font-sans select-none overflow-hidden radial-gradient relative">
            <div className="flex justify-between items-end mb-8 px-2">
                <div>
                    <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div><span className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-black">LOGI MX</span></div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">{selectedTeam === 'home' ? (match.home_team as any).name : (match.away_team as any).name}</h1>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className={`text-2xl font-mono font-black italic bg-red-950/20 px-3 py-1.5 rounded-xl border transition-all duration-300 ${activeClockSelection === 'shot_sec' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-110' : 'border-red-500/10'}`}>
                        <span className="text-[10px] block opacity-30 text-center uppercase -mb-1">SHOT</span>
                        <span className={activeClockSelection === 'shot_sec' ? 'text-amber-400' : 'text-red-500/40'}>{(match.gamestate?.shot_clock?.seconds ?? 24).toString().padStart(2, '0')}</span>
                    </div>
                    <div className={`text-4xl font-mono font-black italic flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border transition-all duration-300 ${activeClockSelection && activeClockSelection !== 'shot_sec' ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-105' : 'border-white/10'}`}>
                        <span className={activeClockSelection === 'game_min' ? 'text-cyan-400' : ''}>{Math.floor(localTimer / 60).toString().padStart(2, '0')}</span>
                        <span className="opacity-30">:</span>
                        <span className={activeClockSelection === 'game_sec' ? 'text-cyan-400' : ''}>{(localTimer % 60).toString().padStart(2, '0')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 grid-rows-3 gap-4 flex-1 max-w-[600px] mx-auto w-full mb-8">
                {view === 'main' && [0,1,2,3,4,5,6,7,8].map(i => {
                    const isPlayer = i < 5;
                    const p = players[i];
                    return (
                        <button key={i} id={`mx_btn_${i}`} onClick={() => handleGridAction(i)} className={`rounded-[2.5rem] border-2 transition-all active:scale-95 flex flex-col items-center justify-center ${isPlayer ? (selectedTeam === 'home' ? 'bg-purple-950/20 border-purple-500/30' : 'bg-green-950/20 border-green-500/30') : i === 6 ? (match.status === 'live' ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-white/5 border-white/10') : 'bg-white/5 border-white/10'}`}>
                            <span className="text-4xl font-black">{isPlayer ? (p?.number || '...') : i === 5 ? 'TO' : i === 6 ? (match.status === 'live' ? '||' : '>') : i === 7 ? '14' : '24'}</span>
                            {isPlayer && p && <span className="text-[10px] uppercase font-bold opacity-40 mt-1">{p.last_name || p.name}</span>}
                        </button>
                    );
                })}
                {view === 'actions' && [0,1,2,3,4,5,6,7,8].map(i => (
                    <button key={i} id={`mx_btn_${i}`} onClick={() => handleGridAction(i)} className="rounded-[2.5rem] border-2 border-white/10 bg-white/5 flex flex-col items-center justify-center transition-all">
                        <span className="text-2xl font-black">{i < 3 ? `+${i+1}` : i === 3 ? '-1' : i === 4 ? 'SUB' : i === 5 ? 'BACK' : i === 6 ? 'F+' : i === 7 ? 'F-' : ''}</span>
                    </button>
                ))}
                {view === 'substitution' && [0,1,2,3,4,5,6,7,8].map(i => {
                    const p = bench[i];
                    return (
                        <button key={i} id={`mx_btn_${i}`} onClick={() => handleGridAction(i)} className="rounded-[2.5rem] border-2 border-white/10 bg-white/5 flex flex-col items-center justify-center transition-all px-2">
                            <span className="text-2xl font-black">{p?.number || (i === 8 ? 'X' : '.')}</span>
                            {p && <span className="text-[8px] uppercase font-bold opacity-40 truncate w-full text-center">{p.last_name || p.name}</span>}
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-4">
                <button id="mx_team_local" onClick={() => setSelectedTeam('home')} className={`flex-1 h-20 rounded-2xl border-2 font-black transition-all ${selectedTeam === 'home' ? 'bg-purple-600 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'bg-white/5 opacity-50 border-transparent'}`}>LOCAL</button>
                <button id="mx_team_visitor" onClick={() => setSelectedTeam('away')} className={`flex-1 h-20 rounded-2xl border-2 font-black transition-all ${selectedTeam === 'away' ? 'bg-green-600 border-green-400 shadow-[0_0_20px_rgba(22,163,74,0.4)]' : 'bg-white/5 opacity-50 border-transparent'}`}>VISITANTE</button>
            </div>

            <div className="fixed top-[-1000px] left-0 pointer-events-none opacity-0">
                <div id="mx_reloj_game_min" className={`w-[250px] h-[156px] flex items-center justify-center bg-black ${activeClockSelection === 'game_min' ? 'bg-cyan-900/40' : ''}`}><img src="/icons/game_min.png" className="w-[120px] h-[120px] object-contain" /></div>
                <div id="mx_reloj_game_sec" className={`w-[250px] h-[156px] flex items-center justify-center bg-black ${activeClockSelection === 'game_sec' ? 'bg-cyan-900/40' : ''}`}><img src="/icons/game_sec.png" className="w-[120px] h-[120px] object-contain" /></div>
                <div id="mx_reloj_1424_sec" className={`w-[250px] h-[156px] flex items-center justify-center bg-black ${activeClockSelection === 'shot_sec' ? 'bg-amber-900/40' : ''}`}><img src="/icons/shot_clock.png" className="w-[120px] h-[120px] object-contain" /></div>
                <div id="mx_dial_click" className="w-[250px] h-[156px] flex items-center justify-center bg-black"><img src="/icons/dial_reset.png" className="w-[120px] h-[120px] object-contain" /></div>
            </div>

            <style jsx global>{`
                body { background: #0a0a0a; }
                .radial-gradient { background: radial-gradient(circle at 50% -20%, #1a1a1a 0%, #0a0a0a 100%); }
            `}</style>
        </main>
    );
}
