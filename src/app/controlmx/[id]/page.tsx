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
            } catch (e) { console.error("Auth check failed:", e); router.push('/login'); }
        };
        checkAuth();
    }, [router]);

    // WebSocket to local Logi C# Plugin
    const { sendMessage: sendWsMessage, lastJsonMessage } = useWebSocket('ws://127.0.0.1:8081', {
        shouldReconnect: () => true,
        reconnectAttempts: 100,
        reconnectInterval: 3000,
    });

    // Clock Adjustment Handler
    const handleClockAdjustment = (option: 'minutos' | 'segundos' | 'posesion', amount: number) => {
        if (!matchRef.current) return;
        const currentMatch = matchRef.current;
        let newTimer = currentMatch.timer_seconds;
        let newGamestate = { ...currentMatch.gamestate };

        if (option === 'minutos') {
            newTimer = Math.max(0, currentMatch.timer_seconds + amount * 60);
        } else if (option === 'segundos') {
            newTimer = Math.max(0, currentMatch.timer_seconds + amount);
        } else if (option === 'posesion') {
            const currentSc = currentMatch.gamestate?.shot_clock?.seconds ?? 24;
            const newSc = Math.max(0, currentSc + amount);
            newGamestate.shot_clock = {
                ...currentMatch.gamestate?.shot_clock,
                seconds: newSc,
                started_at: null
            };
        }

        setLocalTimer(newTimer);
        setMatch(prev => prev ? { ...prev, timer_seconds: newTimer, gamestate: newGamestate } : null);

        if (updateDebounceRef.current) clearTimeout(updateDebounceRef.current);
        updateDebounceRef.current = setTimeout(async () => {
            try {
                await directus.request(updateItem('matches', currentMatch.id, {
                    timer_seconds: newTimer,
                    gamestate: newGamestate
                }));
            } catch (err) { console.error("Failed to update clock:", err); }
        }, 300);
    };

    // WebSocket Message Handler
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
            
            // Toggles
            if (actionId === 'mx_reloj_game_min') setActiveClockSelection(prev => prev === 'game_min' ? null : 'game_min');
            else if (actionId === 'mx_reloj_game_sec') setActiveClockSelection(prev => prev === 'game_sec' ? null : 'game_sec');
            else if (actionId === 'mx_reloj_1424_sec') setActiveClockSelection(prev => prev === 'shot_sec' ? null : 'shot_sec');

            // Dial
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

    // Stream Images (Fixed Full Screen & Hidden Icons)
    useEffect(() => {
        const streamImages = async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
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
                            quality: 0.9, pixelRatio: 1, backgroundColor: '#000000', width: 250, height: 150,
                            style: { width: '250px', height: '150px', margin: '0', padding: '0', borderRadius: '0', border: 'none', display: 'flex' }
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

    // Data Sync
    useEffect(() => {
        if (!id || !isAuthenticated) return;
        const fetchData = async () => {
            try {
                const matchData = (await directus.request(readItem('matches', id, { fields: ['*', 'home_team.*', 'away_team.*'] as any }))) as any as Match;
                setMatch(matchData);
                const tAds = await directus.request(readItems('text_ads' as any, { filter: { match: { _eq: id } } as any }));
                setTextAds(tAds as any[]);
                const vAds = await directus.request(readItems('video_ads' as any, { filter: { match: { _eq: id } } as any }));
                setVideoAds(vAds as any[]);
                const homeTeamId = matchData.home_team ? (typeof matchData.home_team === 'object' ? matchData.home_team.id : matchData.home_team) : null;
                const awayTeamId = matchData.away_team ? (typeof matchData.away_team === 'object' ? matchData.away_team.id : matchData.away_team) : null;
                if (homeTeamId && awayTeamId && homePlayers.length === 0) {
                    const playersData = (await directus.request(readItems('players', { filter: { _or: [{ team: { _eq: homeTeamId } }, { team: { _eq: awayTeamId } }] }, limit: 100 }))) as Player[];
                    setHomePlayers(playersData.filter((p: any) => (typeof p.team === 'object' ? p.team.id : p.team) === homeTeamId).sort((a,b)=>a.number-b.number));
                    setAwayPlayers(playersData.filter((p: any) => (typeof p.team === 'object' ? p.team.id : p.team) === awayTeamId).sort((a,b)=>a.number-b.number));
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [id, isAuthenticated]);

    // Timer Simulation
    useEffect(() => {
        const up = () => {
            if (!match) return;
            if (match.status === 'live' && match.timer_started_at) {
                const now = new Date().getTime();
                const startedAt = new Date(match.timer_started_at).getTime();
                const elapsed = Math.floor((now - startedAt) / 1000);
                setLocalTimer(Math.max(0, match.timer_seconds - elapsed));
            } else { setLocalTimer(match.timer_seconds); }
        };
        up();
        const interval = setInterval(up, 200);
        return () => clearInterval(interval);
    }, [match]);

    // Handlers
    const toggleTimer = async () => { 
        if (!match) return;
        const isLive = match.status === 'live';
        const newStatus = isLive ? 'paused' : 'live';
        const update: any = { status: newStatus };
        if (newStatus === 'live') {
            update.timer_started_at = new Date().toISOString();
        } else {
            update.timer_seconds = localTimer;
            update.timer_started_at = null;
        }
        await directus.request(updateItem('matches', match.id, update));
    };
    const resetShotClock = async (seconds: 14 | 24) => {
        if (!match) return;
        const newGs = { ...match.gamestate, shot_clock: { seconds, started_at: match.status === 'live' ? new Date().toISOString() : null } };
        await directus.request(updateItem('matches', match.id, { gamestate: newGs }));
    };
    const handleGridAction = (index: number) => {
        if (view === 'main') {
            const currentOnCourt = getOnCourt();
            if (index < 5 && currentOnCourt[index]) { 
                setActivePlayer(currentOnCourt[index]); 
                setView('actions'); 
            }
            else if (index === 5) {} // TO
            else if (index === 6) toggleTimer();
            else if (index === 7) resetShotClock(14);
            else if (index === 8) resetShotClock(24);
        }
    };
    const getOnCourt = () => {
        if (!match) return [];
        const teamPlayers = selectedTeam === 'home' ? homePlayers : awayPlayers;
        const courtIds = (selectedTeam === 'home' ? match.gamestate?.home_on_court : match.gamestate?.away_on_court) as any[] || [];
        const onCourt = teamPlayers.filter(p => courtIds.some(cid => (typeof cid === 'object' ? cid.id : String(cid)) === String(p.id)));
        return (onCourt.length > 0 ? onCourt : teamPlayers.slice(0, 5)).sort((a,b)=>a.number-b.number).slice(0,5);
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono gap-3">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
        <span>CARGANDO SCOREBOARD...</span>
    </div>;
    
    if (!match) return <div className="min-h-screen bg-black flex items-center justify-center text-white">No se encontró el partido o hubo un error de conexión.</div>;

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6 font-sans select-none overflow-hidden radial-gradient relative">
            <div className="flex justify-between items-end mb-8 px-2">
                <div>
                    <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div><span className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-black">LOGI MX</span></div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">{selectedTeam === 'home' ? (match.home_team as any).name : (match.away_team as any).name}</h1>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Shot Clock UI */}
                    <div className={`text-2xl font-mono font-black italic bg-red-950/20 px-3 py-1.5 rounded-xl border transition-all duration-300 ${activeClockSelection === 'shot_sec' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-110' : 'border-red-500/10'}`}>
                        <span className="text-[10px] block opacity-30 text-center uppercase -mb-1">SHOT</span>
                        <span className={activeClockSelection === 'shot_sec' ? 'text-amber-400' : 'text-red-500/40'}>{(match.gamestate?.shot_clock?.seconds ?? 24).toString().padStart(2, '0')}</span>
                    </div>
                    {/* Game Clock UI */}
                    <div className={`text-4xl font-mono font-black italic flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border transition-all duration-300 ${activeClockSelection && activeClockSelection !== 'shot_sec' ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-105' : 'border-white/10'}`}>
                        <span className={activeClockSelection === 'game_min' ? 'text-cyan-400' : ''}>{Math.floor(localTimer / 60).toString().padStart(2, '0')}</span>
                        <span className="opacity-30">:</span>
                        <span className={activeClockSelection === 'game_sec' ? 'text-cyan-400' : ''}>{(localTimer % 60).toString().padStart(2, '0')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 grid-rows-3 gap-4 flex-1 max-w-[600px] mx-auto w-full mb-8">
                {[0,1,2,3,4,5,6,7,8].map(i => (
                    <button key={i} id={`mx_btn_${i}`} onClick={() => handleGridAction(i)} className={`rounded-[2.5rem] border-2 transition-all active:scale-95 flex flex-col items-center justify-center ${i === 6 && match.status === 'live' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                        <span className="text-4xl font-black">{i < 5 ? (getOnCourt()[i]?.number || '...') : i === 6 ? (match.status === 'live' ? '||' : '>') : i === 7 ? '14' : i === 8 ? '24' : 'TO'}</span>
                    </button>
                ))}
            </div>

            <div className="flex gap-4">
                <button id="mx_team_local" onClick={() => setSelectedTeam('home')} className={`flex-1 h-20 rounded-2xl border-2 font-black ${selectedTeam === 'home' ? 'bg-purple-600 border-purple-400' : 'bg-white/5 opacity-50 border-transparent'}`}>LOCAL</button>
                <button id="mx_team_visitor" onClick={() => setSelectedTeam('away')} className={`flex-1 h-20 rounded-2xl border-2 font-black ${selectedTeam === 'away' ? 'bg-green-600 border-green-400' : 'bg-white/5 opacity-50 border-transparent'}`}>VISITANTE</button>
            </div>

            {/* Hidden Icon Stage for capture */}
            <div className="fixed top-[-1000px] left-0 pointer-events-none opacity-0">
                <div id="mx_reloj_game_min" className={`w-[250px] h-[150px] flex items-center justify-center bg-black ${activeClockSelection === 'game_min' ? 'bg-cyan-900/40' : ''}`}>
                    <img src="/icons/game_min.png" className="w-[120px] h-[120px] object-contain" alt="" />
                </div>
                <div id="mx_reloj_game_sec" className={`w-[250px] h-[150px] flex items-center justify-center bg-black ${activeClockSelection === 'game_sec' ? 'bg-cyan-900/40' : ''}`}>
                    <img src="/icons/game_sec.png" className="w-[120px] h-[120px] object-contain" alt="" />
                </div>
                <div id="mx_reloj_1424_sec" className={`w-[250px] h-[150px] flex items-center justify-center bg-black ${activeClockSelection === 'shot_sec' ? 'bg-amber-900/40' : ''}`}>
                    <img src="/icons/shot_clock.png" className="w-[120px] h-[120px] object-contain" alt="" />
                </div>
                <div id="mx_dial_click" className="w-[250px] h-[150px] flex items-center justify-center bg-black">
                    <img src="/icons/dial_reset.png" className="w-[120px] h-[120px] object-contain" alt="" />
                </div>
            </div>

            <style jsx global>{`
                body { background: #0a0a0a; }
                .radial-gradient { background: radial-gradient(circle at 50% -20%, #1a1a1a 0%, #0a0a0a 100%); }
            `}</style>
        </main>
    );
}
