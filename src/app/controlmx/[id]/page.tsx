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

    // Clock Edit State
    const [activeClockSelection, setActiveClockSelection] = useState<'game_min' | 'game_sec' | 'shot_sec' | null>(null);
    const activeClockSelectionRef = useRef<'game_min' | 'game_sec' | 'shot_sec' | null>(null);

    // Update the ref whenever the state changes so the websocket has the latest
    useEffect(() => {
        activeClockSelectionRef.current = activeClockSelection;
    }, [activeClockSelection]);

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
        shouldReconnect: () => true, // Automatically reconnect if plugin restarts
        reconnectAttempts: 100,
        reconnectInterval: 3000,
    });

    // Handle physical button presses from the Logi Plugin
    useEffect(() => {
        if (!lastJsonMessage) return;
        const msg = lastJsonMessage as any;
        if (msg.event === 'keyDown' && msg.actionId) {
            // Mapping from Logi action names to our grid map
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
                setSelectedTeam(mapped);
            } else if (mapped === 'ad_text') {
                toggleTextAd();
            } else if (mapped === 'ad_video') {
                toggleVideoAd();
            }
        }

        // Clock Modification logic via Wheels and Dials
        if (msg.actionId) {
            const isPaused = matchRef.current?.status !== 'live';
            const actionId = msg.actionId;
            
            // Handle Toggle Buttons
            if (actionId === 'mx_reloj_game_min') {
                setActiveClockSelection(prev => prev === 'game_min' ? null : 'game_min');
            } else if (actionId === 'mx_reloj_game_sec') {
                setActiveClockSelection(prev => prev === 'game_sec' ? null : 'game_sec');
            } else if (actionId === 'mx_reloj_1424_sec') {
                setActiveClockSelection(prev => prev === 'shot_sec' ? null : 'shot_sec');
            }

            // Handle Rotation
            if (isPaused && activeClockSelectionRef.current) {
                if (actionId === 'dial_left' || actionId === 'dial_right') {
                    const direction = actionId === 'dial_right' ? 1 : -1;
                    const mode = activeClockSelectionRef.current;
                    
                    if (mode === 'game_min') handleClockAdjustment('minutos', direction);
                    else if (mode === 'game_sec') handleClockAdjustment('segundos', direction);
                    else if (mode === 'shot_sec') handleClockAdjustment('posesion', direction);
                }
            }
        }
    }, [lastJsonMessage]);

    // Stream Images to Logi Plugin
    useEffect(() => {
        const streamImages = async () => {
            // We need to wait a tiny bit for React to render the new state before capturing
            await new Promise(resolve => setTimeout(resolve, 200));

            const images = [];
            for (let i = 0; i < 9; i++) {
                const node = document.getElementById(`mx_btn_${i}`);
                if (node) {
                    try {
                        const dataUrl = await toPng(node, { 
                            quality: 0.8, 
                            pixelRatio: 1,
                            backgroundColor: '#0a0a0a',
                            width: 250,
                            height: 150, // 5:3 aspect ratio strictly fills the trapped Logi 'Icon Above Text' layout mask
                            style: { width: '250px', height: '150px', margin: '0', borderRadius: '1.5rem', display: 'flex' }
                        });
                        // Remove the prefix to just send raw base64
                        const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
                        images.push({ id: `mx_grid_${i}`, image: base64 });
                    } catch (err) {
                        console.error(`Failed to capture button ${i}`, err);
                    }
                }
            }
            if (images.length > 0) {
                console.log(`[Logi] Streaming ${images.length} images to WS plugin`);
                sendWsMessage(JSON.stringify({ type: 'UPDATE_IMAGES', keys: images }));
            }
        };

        if (match) {
            streamImages();
        }
    }, [match?.gamestate, selectedTeam, view, activePlayer?.id, match?.status]); // Re-run when crucial state changes

    // Fetch match AND players
    useEffect(() => {
        if (!id || !isAuthenticated) return;

        const fetchData = async () => {
            try {
                const matchData = (await directus.request(readItem('matches', id, {
                    fields: ['*', 'home_team.*', 'away_team.*'] as any
                }))) as any as Match;
                setMatch(matchData);

                // Fetch Ads
                try {
                    const tAds = await directus.request(readItems('text_ads' as any, { filter: { match: { _eq: id } } as any }));
                    setTextAds(tAds as any[]);
                    const vAds = await directus.request(readItems('video_ads' as any, { filter: { match: { _eq: id } } as any }));
                    setVideoAds(vAds as any[]);
                } catch (adErr) {
                    console.warn("Could not fetch ads:", adErr);
                }

                const homeTeamId = matchData.home_team ? String(typeof matchData.home_team === 'object' ? matchData.home_team.id : matchData.home_team) : null;
                const awayTeamId = matchData.away_team ? String(typeof matchData.away_team === 'object' ? matchData.away_team.id : matchData.away_team) : null;

                if (homeTeamId && awayTeamId) {
                    // 2a. Fetch Players if not loaded
                    if (homePlayers.length === 0) {
                        const playersData = (await directus.request(readItems('players', {
                            filter: {
                                _or: [
                                    { team: { _eq: homeTeamId } },
                                    { team: { _eq: awayTeamId } }
                                ]
                            },
                            limit: 100
                        }))) as Player[];

                        const generateRoster = (teamId: string) => Array.from({ length: 12 }, (_, i) => ({
                            id: `temp_${teamId}_${i + 4}`,
                            name: `Player ${i + 4}`,
                            number: i + 4,
                            team: teamId,
                            temp: true
                        }));

                        const realHome = playersData.filter((p: any) => String(typeof p.team === 'object' ? p.team.id : p.team) === homeTeamId);
                        const realAway = playersData.filter((p: any) => String(typeof p.team === 'object' ? p.team.id : p.team) === awayTeamId);

                        const finalHome = realHome.length > 0 ? realHome.sort((a, b) => a.number - b.number) : generateRoster(homeTeamId);
                        const finalAway = realAway.length > 0 ? realAway.sort((a, b) => a.number - b.number) : generateRoster(awayTeamId);

                        setHomePlayers(finalHome);
                        setAwayPlayers(finalAway);

                        // Use newly generated local data for immediate gamestate check
                        checkAndInitGamestate(matchData, finalHome, finalAway);
                    } else {
                        // Players already loaded, just check gamestate
                        checkAndInitGamestate(matchData, homePlayers, awayPlayers);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const checkAndInitGamestate = async (m: Match, h: any[], a: any[]) => {
            let updatedGamestate = { ...m.gamestate };
            let needsUpdate = false;

            if (!m.gamestate?.home_on_court && h.length > 0) {
                updatedGamestate.home_on_court = h.slice(0, 5).map(p => p.id);
                needsUpdate = true;
            }
            if (!m.gamestate?.away_on_court && a.length > 0) {
                updatedGamestate.away_on_court = a.slice(0, 5).map(p => p.id);
                needsUpdate = true;
            }

            if (needsUpdate) {
                try {
                    await directus.request(updateItem('matches', id, { gamestate: updatedGamestate }));
                    setMatch(prev => prev ? ({ ...prev, gamestate: updatedGamestate }) : null);
                } catch (e) {
                    console.error("Failed to init gamestate:", e);
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000); // Poll every 2 seconds for sync
        return () => clearInterval(interval);
    }, [id, isAuthenticated]);

    // Keep a ref of match for the websocket un-binded handlers
    const matchRef = useRef<Match | null>(null);
    useEffect(() => {
        matchRef.current = match;
    }, [match]);

    // Fast-update local timer adjustments logic (debounced push to directus)
    const updateDebounceRef = useRef<NodeJS.Timeout | null>(null);

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

        // Optimistically update UI
        setLocalTimer(newTimer);
        setMatch(prev => prev ? { ...prev, timer_seconds: newTimer, gamestate: newGamestate } : null);

        // Debounce DB save
        if (updateDebounceRef.current) clearTimeout(updateDebounceRef.current);
        updateDebounceRef.current = setTimeout(async () => {
            try {
                await directus.request(updateItem('matches', currentMatch.id, {
                    timer_seconds: newTimer,
                    gamestate: newGamestate
                }));
            } catch (err) {
                console.error("Failed to update clock via dial:", err);
            }
        }, 300);
    };

    // Timer simulation
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

    // Auto-pause at 0
    useEffect(() => {
        if (localTimer === 0 && match?.status === 'live') {
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
    }, [localTimer, match?.status]);

    // Actions
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
            const newGamestate = { ...gamestate, is_et: false, home_timeouts: 0, away_timeouts: 0 };

            await directus.request(updateItem('matches', match.id, {
                status: 'paused',
                timer_seconds: newSeconds,
                timer_started_at: null,
                current_period: nextPeriod,
                gamestate: newGamestate
            }));
            // @ts-ignore
            setMatch(prev => prev ? { ...prev, status: 'paused', timer_seconds: newSeconds, timer_started_at: null, current_period: nextPeriod, gamestate: newGamestate } : null);
            return;
        }

        const isLive = match.status === 'live';
        if (isLive) {
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
            setMatch(prev => ({ ...prev!, ...newObj }));

        } else {
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
            setMatch(prev => ({ ...prev!, ...newObj }));
        }
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
        setMatch(prev => ({ ...prev!, gamestate: newGamestate }));
    };

    const toggleTextAd = async () => {
        if (!match || match.status !== 'paused' || textAds.length === 0) return;
        if ((match as any).active_ad_text) {
            await directus.request(updateItem('matches', match.id, { active_ad_text: null } as any));
            setMatch(prev => ({ ...prev!, active_ad_text: null } as any));
        } else {
            const idx = textAdIndexRef.current;
            const adContent = textAds[idx].content;
            await directus.request(updateItem('matches', match.id, { active_ad_text: adContent } as any));
            setMatch(prev => ({ ...prev!, active_ad_text: adContent } as any));
            textAdIndexRef.current = (idx + 1) % textAds.length;
        }
    };

    const toggleVideoAd = async () => {
        if (!match || match.status !== 'paused' || videoAds.length === 0) return;
        if ((match as any).active_ad_video) {
            await directus.request(updateItem('matches', match.id, { active_ad_video: null } as any));
            setMatch(prev => ({ ...prev!, active_ad_video: null } as any));
        } else {
            const idx = videoAdIndexRef.current;
            const adVideo = videoAds[idx].video;
            await directus.request(updateItem('matches', match.id, { active_ad_video: adVideo } as any));
            setMatch(prev => ({ ...prev!, active_ad_video: adVideo } as any));
            videoAdIndexRef.current = (idx + 1) % videoAds.length;
        }
    };

    const handleTimeout = async () => {
        if (!match) return;
        const field = selectedTeam === 'home' ? 'home_timeouts' : 'away_timeouts';
        const currentFieldCount = match.gamestate?.[field] || 0;

        if (currentFieldCount >= 3) return; // limit 3 per quarter

        const newGamestate = {
            ...match.gamestate,
            [field]: currentFieldCount + 1
        };

        // Pause timer if live
        let now = null;
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
        if (!match || !activePlayer) return;

        const currentStats = match.gamestate?.player_stats || {};
        const playerStats = currentStats[activePlayer.id] || { points: 0, fouls: 0 };

        let newPoints = playerStats.points;
        let newFouls = playerStats.fouls;

        if (type === 'pts') {
            newPoints = Math.max(0, playerStats.points + value);
        } else if (type === 'foul') {
            newFouls = Math.max(0, playerStats.fouls + value);
        }

        const isHome = selectedTeam === 'home';
        const scoreField = isHome ? 'home_score' : 'away_score';
        const foulField = isHome ? 'home_fouls' : 'away_fouls';

        const currentScore = Number((match as any)[scoreField]) || 0;
        const newTeamScore = Math.max(0, currentScore + (type === 'pts' ? value : 0));
        const currentTeamFouls = Number(match.gamestate?.[foulField]) || 0;
        const newTeamFouls = Math.max(0, currentTeamFouls + (type === 'foul' ? value : 0));

        let updatedEvents = [...(match.gamestate?.events || [])];
        
        if (value > 0) {
            updatedEvents.push({
                id: Math.random().toString(36).substring(2, 9),
                type,
                value,
                player_id: activePlayer.id,
                team: selectedTeam,
                period: match.current_period || 1,
                time_remaining: localTimer,
                timestamp: new Date().toISOString()
            });
        } else {
            const idx = updatedEvents.map(e => ({...e})).reverse().findIndex(e => e.player_id === activePlayer.id && e.type === type);
            if (idx !== -1) {
                const realIdx = updatedEvents.length - 1 - idx;
                updatedEvents.splice(realIdx, 1);
            }
        }

        const newGamestate = {
            ...match.gamestate,
            [foulField]: newTeamFouls,
            events: updatedEvents,
            player_stats: {
                ...currentStats,
                [activePlayer.id]: {
                    ...playerStats,
                    points: newPoints,
                    fouls: newFouls
                }
            }
        };

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
            setView('main');
            setActivePlayer(null);
        } catch (e: any) {
            console.error("UPDATE FAILED:", e);
        }
    };

    const confirmSubstitution = async (benchPlayerIdRaw: any) => {
        if (!match || !activePlayer) return;

        const benchPlayerId = getStrId(benchPlayerIdRaw);
        const activePlayerId = getStrId(activePlayer.id);

        const isHome = selectedTeam === 'home';
        const field = isHome ? 'home_on_court' : 'away_on_court';

        // Use the ACTIVE list of players being shown to perform the swap
        // This ensures that even if we are in fallback mode, the state is updated correctly
        const currentShown = getOnCourt();
        const newOnCourt = currentShown.map(p => {
            const pid = getStrId(p.id);
            return pid === activePlayerId ? benchPlayerId : pid;
        });

        const newGamestate = { ...match.gamestate, [field]: newOnCourt };

        setMatch(prev => ({ ...prev!, gamestate: newGamestate }));

        try {
            await directus.request(updateItem('matches', match.id, { gamestate: newGamestate }));
            setView('main');
            setActivePlayer(null);
        } catch (e) {
            console.error("SUB FAILED:", e);
        }
    };

    // Helper to get on-court players for selected team
    const getOnCourt = () => {
        if (!match) return [];
        const teamPlayers = selectedTeam === 'home' ? homePlayers : awayPlayers;
        const courtIds = (selectedTeam === 'home' ? match.gamestate?.home_on_court : match.gamestate?.away_on_court) as (string | number)[] | undefined;

        let onCourt: any[] = [];
        if (courtIds && courtIds.length > 0) {
            onCourt = teamPlayers.filter(p => courtIds.some(id => getStrId(id) === getStrId(p.id)));
        }

        if (onCourt.length === 0) {
            onCourt = teamPlayers.slice(0, 5);
        }

        // Always sort by number and return max 5
        return [...onCourt].sort((a, b) => (a.number || 0) - (b.number || 0)).slice(0, 5);
    };

    // Helper to get bench players
    const getBench = () => {
        const teamPlayers = selectedTeam === 'home' ? homePlayers : awayPlayers;
        const onCourtIds = (selectedTeam === 'home' ? match?.gamestate?.home_on_court : match?.gamestate?.away_on_court) as (string | number)[] | undefined;

        if (onCourtIds && onCourtIds.length > 0) {
            // First try filtering out actual matched players
            const filtered = teamPlayers.filter(p => !onCourtIds.some(id => getStrId(id) === getStrId(p.id)));
            // If the on-court list was broken/empty after filter, we use the fallback from index 5
            const onCourt = getOnCourt();
            const onCourtIdsActual = onCourt.map(p => getStrId(p.id));
            return teamPlayers.filter(p => !onCourtIdsActual.includes(getStrId(p.id)));
        }

        return teamPlayers.slice(5);
    };

    // Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key;

            // Team Switch (New Mapping: N = Local, M = Visitor)
            if (key === 'n' || key === 'N' || key === 'ArrowLeft') setSelectedTeam('home');
            if (key === 'm' || key === 'M' || key === 'ArrowRight') setSelectedTeam('away');

            // Grid Layout Mapping (q,w,e,a,s,d,z,x,c)
            const gridMap: { [key: string]: number } = {
                'q': 0, 'w': 1, 'e': 2,
                'a': 3, 's': 4, 'd': 5,
                'z': 6, 'x': 7, 'c': 8
            };

            if (key.toLowerCase() in gridMap) {
                handleGridAction(gridMap[key.toLowerCase()]);
            }

            // ESC to back
            if (key === 'Escape' || key === 'Backspace' || key === 'q') {
                setView('main');
                setActivePlayer(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [view, activePlayer, selectedTeam, match, homePlayers, awayPlayers]);

    const handleGridAction = (index: number) => {
        if (view === 'main') {
            const players = getOnCourt();
            // Fila Superior: 0, 1, 2
            // Fila Media: 3, 4
            // Fila Inferior: 6 (Clock)
            if (index < 3) {
                if (players[index]) {
                    setActivePlayer(players[index]);
                    setView('actions');
                }
            } else if (index === 3 || index === 4) {
                if (players[index]) {
                    setActivePlayer(players[index]);
                    setView('actions');
                }
            } else if (index === 5) {
                handleTimeout();
            } else if (index === 6) {
                toggleTimer();
            } else if (index === 7) {
                resetShotClock(14);
            } else if (index === 8) {
                resetShotClock(24);
            }
        } else if (view === 'actions') {
            // Mapping:
            // 1, 2, 3 -> +1, +2, +3
            // 4, 5, 6 -> -1, -2, -3
            // 7 -> +F, 8 -> -F, 9 -> C
            if (index === 0) handlePlayerAction('pts', 1);
            if (index === 1) handlePlayerAction('pts', 2);
            if (index === 2) handlePlayerAction('pts', 3);
            if (index === 3) handlePlayerAction('pts', -1);
            if (index === 4) handlePlayerAction('pts', -2);
            if (index === 5) handlePlayerAction('pts', -3);
            if (index === 6) handlePlayerAction('foul', 1);
            if (index === 7) handlePlayerAction('foul', -1);
            if (index === 8) setView('substitution');
        } else if (view === 'substitution') {
            const bench = getBench();
            if (bench[index]) {
                confirmSubstitution(bench[index].id);
            }
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading MX Console...</div>;
    if (!match) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Match not found.</div>;

    const onCourt = getOnCourt();
    const bench = getBench();
    const isRunning = match.status === 'live';
    const isET = match.gamestate?.is_et;
    const isGameOver = (match.current_period || 1) >= (match.max_periods || 4) && match.home_score !== match.away_score;

    let timerActionLabel = isRunning ? 'Pause' : 'Play';
    if (match.status === 'finished') timerActionLabel = 'Finish';
    else if (localTimer === 0 && !isET) timerActionLabel = isGameOver ? 'Finish' : 'ET (2m)';
    else if (isET) timerActionLabel = 'Next Q';

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6 font-sans select-none overflow-hidden radial-gradient relative">
            
            {/* Header Info */}
            <div className="flex justify-between items-end mb-8 px-2">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
                        <span className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-black">LOGI MX CREATIVE</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                        <span className={`transition-colors duration-500 ${selectedTeam === 'home' ? 'text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]'}`}>
                            {selectedTeam === 'home' ? (typeof match.home_team === 'object' ? match.home_team.name : 'LOCAL') : (typeof match.away_team === 'object' ? match.away_team.name : 'VISITANTE')}
                        </span>
                    </h1>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className={`text-4xl font-mono font-black italic tracking-tighter flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border transition-all duration-300 ${activeClockSelection ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-105' : 'border-white/10'}`}>
                        <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></span>
                        <span className={`transition-colors ${activeClockSelection === 'game_min' ? 'text-cyan-400' : ''}`}>
                            {Math.floor(localTimer / 60).toString().padStart(2, '0')}
                        </span>
                        <span className="opacity-30">:</span>
                        <span className={`transition-colors ${activeClockSelection === 'game_sec' ? 'text-cyan-400' : ''}`}>
                            {(localTimer % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3x3 Grid */}
            <div className="grid grid-cols-3 grid-rows-3 gap-4 flex-1 max-w-[600px] mx-auto w-full mb-8">
                {view === 'main' && (
                    <>
                        {/* Fila Superior: 1, 2, 3 */}
                        {[0, 1, 2].map(idx => (
                            <button
                                key={idx}
                                id={`mx_btn_${idx}`}
                                onClick={() => handleGridAction(idx)}
                                className={`rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden transition-all active:scale-95 group border-2 ${onCourt[idx]
                                    ? (selectedTeam === 'home' ? 'bg-purple-900/20 border-purple-500/30 hover:border-purple-500/60' : 'bg-green-900/20 border-green-500/30 hover:border-green-500/60')
                                    : 'bg-white/5 border-white/5'
                                    }`}
                            >
                                {onCourt[idx] ? (
                                    <>
                                        <span className={`text-5xl font-black mb-1 transition-transform group-hover:scale-110 ${selectedTeam === 'home' ? 'text-purple-400' : 'text-green-400'}`}>{onCourt[idx].number}</span>
                                        <span className="text-[10px] uppercase font-black opacity-50 tracking-widest truncate w-full px-4 text-center">{onCourt[idx].name}</span>
                                        {match.gamestate?.player_stats?.[onCourt[idx].id]?.fouls > 0 && (
                                            <div className="absolute top-4 right-4 text-red-500 font-black text-xs">F:{match.gamestate.player_stats[onCourt[idx].id].fouls}</div>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-white/10 text-[10px] font-black italic">VACÍO</span>
                                )}
                                <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">{['Q', 'W', 'E'][idx]}</span>
                            </button>
                        ))}

                        {/* Fila Media: 4, 5, 6 */}
                        {[3, 4].map(idx => (
                            <button
                                key={idx}
                                id={`mx_btn_${idx}`}
                                onClick={() => handleGridAction(idx)}
                                className={`rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden transition-all active:scale-95 group border-2 ${onCourt[idx]
                                    ? (selectedTeam === 'home' ? 'bg-purple-900/20 border-purple-500/30 hover:border-purple-500/60' : 'bg-green-900/20 border-green-500/30 hover:border-green-500/60')
                                    : 'bg-white/5 border-white/5'
                                    }`}
                            >
                                {onCourt[idx] ? (
                                    <>
                                        <span className={`text-5xl font-black mb-1 transition-transform group-hover:scale-110 ${selectedTeam === 'home' ? 'text-purple-400' : 'text-green-400'}`}>{onCourt[idx].number}</span>
                                        <span className="text-[10px] uppercase font-black opacity-50 tracking-widest truncate w-full px-4 text-center">{onCourt[idx].name}</span>
                                        {match.gamestate?.player_stats?.[onCourt[idx].id]?.fouls > 0 && (
                                            <div className="absolute top-4 right-4 text-red-500 font-black text-xs">F:{match.gamestate.player_stats[onCourt[idx].id].fouls}</div>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-white/10 text-[10px] font-black italic">VACÍO</span>
                                )}
                                <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">{['A', 'S'][idx - 3]}</span>
                            </button>
                        ))}
                        <button
                            id="mx_btn_5"
                            onClick={() => handleGridAction(5)}
                            className={`rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden transition-all active:scale-95 group border-2 ${(match.gamestate?.[selectedTeam === 'home' ? 'home_timeouts' : 'away_timeouts'] || 0) >= 3 ? 'bg-red-900/40 border-red-500/30' : 'bg-white/[0.02] border-white/[0.05] hover:border-white/20'}`}
                        >
                            <div className="flex gap-2 mb-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`w-3 h-3 rounded-full ${i <= (match.gamestate?.[selectedTeam === 'home' ? 'home_timeouts' : 'away_timeouts'] || 0) ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-white/10'}`}></div>
                                ))}
                            </div>
                            <span className="text-[10px] uppercase font-black opacity-50 tracking-widest text-center">TIMEOUT</span>
                            <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">D</span>
                        </button>

                        {/* Fila Inferior: 7, 8, 9 */}
                        <button
                            id="mx_btn_6"
                            onClick={() => handleGridAction(6)}
                            className={`rounded-[2.5rem] flex flex-col items-center justify-center transition-all active:scale-95 border-2 relative group ${isRunning ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:border-amber-500/60' : 'bg-blue-500/10 border-blue-500/30 text-blue-500 hover:border-blue-500/60'
                                }`}
                        >
                            {isRunning ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
                            <span className="absolute bottom-4 text-[10px] uppercase font-black tracking-[0.1em]">{timerActionLabel}</span>
                            <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">Z</span>
                        </button>
                        <button
                            id="mx_btn_7"
                            onClick={() => handleGridAction(7)}
                            className={`rounded-[2.5rem] flex flex-col items-center justify-center transition-all active:scale-95 border-2 relative group ${activeClockSelection === 'shot_sec' ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-red-900/10 border-red-500/30 text-red-500 hover:border-red-500/60'}`}
                        >
                            <span className={`text-6xl font-black transition-transform ${activeClockSelection === 'shot_sec' ? 'text-cyan-400 scale-110' : 'text-red-500'}`}>14</span>
                            <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">X</span>
                        </button>
                        <button
                            id="mx_btn_8"
                            onClick={() => handleGridAction(8)}
                            className={`rounded-[2.5rem] flex flex-col items-center justify-center transition-all active:scale-95 border-2 relative group ${activeClockSelection === 'shot_sec' ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-red-900/10 border-red-500/30 text-red-500 hover:border-red-500/60'}`}
                        >
                            <span className={`text-6xl font-black transition-transform ${activeClockSelection === 'shot_sec' ? 'text-cyan-400 scale-110' : 'text-red-500'}`}>24</span>
                            <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">C</span>
                        </button>
                    </>
                )}

                {view === 'actions' && (
                    <>
                        {/* +1, +2, +3 */}
                        {[1, 2, 3].map((v, i) => (
                            <button id={`mx_btn_${i}`} key={i} onClick={() => handlePlayerAction('pts', v)} className="bg-blue-500/10 border-2 border-blue-500/30 rounded-[2.5rem] flex flex-col items-center justify-center active:scale-95 transition-all group hover:border-blue-500/60 relative">
                                <span className="text-6xl font-black text-blue-400 group-hover:scale-110 transition-transform">+{v}</span>
                                <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">{['Q', 'W', 'E'][i]}</span>
                            </button>
                        ))}

                        {/* -1, -2, -3 */}
                        {[1, 2, 3].map((v, i) => (
                            <button id={`mx_btn_${i + 3}`} key={i} onClick={() => handlePlayerAction('pts', -v)} className="bg-red-500/10 border-2 border-red-500/30 rounded-[2.5rem] flex flex-col items-center justify-center active:scale-95 transition-all group hover:border-red-500/60 relative">
                                <span className="text-6xl font-black text-red-500 group-hover:scale-110 transition-transform">-{v}</span>
                                <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">{['A', 'S', 'D'][i]}</span>
                            </button>
                        ))}

                        {/* +F, -F, C */}
                        <button id="mx_btn_6" onClick={() => handlePlayerAction('foul', 1)} className="bg-orange-500/10 border-2 border-orange-500/30 rounded-[2.5rem] flex flex-col items-center justify-center active:scale-95 transition-all group hover:border-orange-500/60 relative">
                            <span className="text-5xl font-black text-orange-400 tracking-tighter group-hover:scale-110">+F</span>
                            <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">Z</span>
                        </button>
                        <button id="mx_btn_7" onClick={() => handlePlayerAction('foul', -1)} className="bg-orange-900/10 border-2 border-orange-900/30 rounded-[2.5rem] flex flex-col items-center justify-center active:scale-95 transition-all group hover:border-orange-900/60 relative">
                            <span className="text-5xl font-black text-orange-900 tracking-tighter group-hover:scale-110">-F</span>
                            <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">X</span>
                        </button>
                        <button id="mx_btn_8" onClick={() => setView('substitution')} className="bg-white/10 border-2 border-white/20 rounded-[2.5rem] flex flex-col items-center justify-center active:scale-95 transition-all group hover:border-white/40 relative">
                            <span className="text-6xl font-black text-white group-hover:rotate-12 transition-all">C</span>
                            <span className="absolute bottom-5 text-[10px] font-black uppercase tracking-widest opacity-40">Sub</span>
                            <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">C</span>
                        </button>
                    </>
                )}

                {view === 'substitution' && (
                    <>
                        {Array.from({ length: 9 }).map((_, idx) => (
                            <button
                                key={idx}
                                id={`mx_btn_${idx}`}
                                onClick={() => handleGridAction(idx)}
                                className={`rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden transition-all active:scale-95 group border-2 ${bench[idx]
                                    ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60'
                                    : 'bg-white/[0.02] border-white/5'
                                    }`}
                            >
                                {bench[idx] ? (
                                    <>
                                        <span className="text-5xl font-black mb-1 group-hover:scale-110 transition-transform text-blue-400">{bench[idx].number}</span>
                                        <span className="text-[10px] uppercase font-black opacity-50 tracking-widest truncate w-full px-4 text-center">{bench[idx].name}</span>
                                    </>
                                ) : (
                                    <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                )}
                                <span className="absolute top-4 left-5 text-[10px] opacity-20 font-black">
                                    {['Q', 'W', 'E', 'A', 'S', 'D', 'Z', 'X', 'C'][idx]}
                                </span>
                            </button>
                        ))}
                    </>
                )}
            </div>

            {/* Navigation Bar (Bottom) */}
            <div className="flex justify-between items-center gap-6 mt-auto">
                <button
                    onClick={() => setSelectedTeam('home')}
                    className={`flex-1 flex items-center justify-center gap-4 h-20 rounded-[2rem] border-2 transition-all duration-500 font-black text-2xl tracking-tighter relative ${selectedTeam === 'home'
                        ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] scale-105'
                        : 'bg-white/5 border-transparent text-white/20 hover:bg-white/10'
                        }`}
                >
                    <ChevronLeft size={40} strokeWidth={4} /> LOCAL
                    <span className="absolute top-4 left-5 text-[10px] opacity-40 font-black">N</span>
                </button>

                {view !== 'main' && (
                    <button
                        onClick={() => { setView('main'); setActivePlayer(null); }}
                        className="w-20 h-20 rounded-[2rem] bg-white/10 border-2 border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
                    >
                        <X size={40} strokeWidth={4} />
                    </button>
                )}

                <button
                    onClick={() => setSelectedTeam('away')}
                    className={`flex-1 flex items-center justify-center gap-4 h-20 rounded-[2rem] border-2 transition-all duration-500 font-black text-2xl tracking-tighter relative ${selectedTeam === 'away'
                        ? 'bg-green-600 border-green-400 text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] scale-105'
                        : 'bg-white/5 border-transparent text-white/20 hover:bg-white/10'
                        }`}
                >
                    VISITANTE <ChevronRight size={40} strokeWidth={4} />
                    <span className="absolute top-4 right-5 text-[10px] opacity-40 font-black">M</span>
                </button>
            </div>

            {/* Instruction Footer */}
            <div className="mt-8 flex justify-center">
                <div className="glass px-6 py-2 rounded-2xl border border-white/5">
                    {view === 'main' ? (
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                            <span className="text-white/60">Q-S: Seleccionar</span>
                            <span>•</span>
                            <span className="text-white/60">Z: Reloj</span>
                            <span>•</span>
                            <span className="text-white/60">N / M: Equipos</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                            <span className="text-white/60">Active: #{activePlayer?.number} {activePlayer?.name}</span>
                            <span>•</span>
                            <span className="text-blue-400">ESC / Q: Volver</span>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                body {
                    background-color: #0a0a0a;
                    overscroll-behavior: none;
                }
                .radial-gradient {
                    background: radial-gradient(circle at 50% -20%, #1a1a1a 0%, #0a0a0a 100%);
                }
                .glass {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                }
            `}</style>
        </main>
    );
}
