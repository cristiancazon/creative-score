'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { directus } from '@/lib/directus';
import { useMatchSubscription } from '@/hooks/useMatchSubscription';
import { readItem } from '@directus/sdk';
import { Match, Board } from '@/types/directus';
import { Loader2 } from 'lucide-react';

export default function BoardShotPage() {
    const { id } = useParams() as { id: string };
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [localTimer, setLocalTimer] = useState<number>(0);
    const [shotClock, setShotClock] = useState<number | null>(null);
    const [scale, setScale] = useState(1);
    const frozenTimerRef = useRef<number | null>(null);
    const frozenShotClockRef = useRef<number | null>(null);
    
    // Initial Fetch
    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const matchData = await directus.request(readItem('matches', id, {
                    fields: ['*', 'sport.*', 'board.*'] as any[]
                })) as unknown as Match;

                if (!matchData) {
                    setError("Match not found.");
                    setLoading(false);
                    return;
                }

                setMatch(matchData);
                setLocalTimer(matchData.timer_seconds || 0);
                setShotClock(matchData.gamestate?.shot_clock ?? null);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching boardshot data:", err);
                setError("Failed to load data.");
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Real-time updates via WebSocket (with 3s polling fallback)
    // Anti-jump: when live→paused, freeze the local timer at current position
    const handleMatchUpdate = useCallback((data: any) => {
        setMatch(prev => {
            if (!prev) return prev;
            const merged = { ...prev, ...data };

            // Detect live → paused transition
            const wasLive = prev.status === 'live';
            const nowPaused = merged.status === 'paused';

            if (wasLive && nowPaused) {
                const now = Date.now();
                if (prev.timer_started_at) {
                    const startedAt = new Date(prev.timer_started_at).getTime();
                    const elapsed = (now - startedAt) / 1000;
                    frozenTimerRef.current = Math.max(0, (prev.timer_seconds || 0) - elapsed);
                }
                let gs: any = prev.gamestate;
                if (typeof gs === 'string') { try { gs = JSON.parse(gs); } catch (_) { gs = {}; } }
                const sc = gs?.shot_clock || gs?.shotClock;
                if (sc && typeof sc === 'object' && sc.started_at) {
                    const scStartedAt = new Date(sc.started_at).getTime();
                    const scElapsed = (now - scStartedAt) / 1000;
                    frozenShotClockRef.current = Math.max(0, (sc.seconds || 0) - scElapsed);
                }
            }

            return merged;
        });
    }, []);

    useMatchSubscription({
        matchId: id || null,
        fields: ['*', 'sport.*', 'board.*'],
        skip: !id,
        onData: handleMatchUpdate,
        fallbackInterval: 3000,
    });

    // Timer Tick Logic (with anti-jump support)
    useEffect(() => {
        if (!match) return;

        const updateTimer = () => {
            const now = Date.now();
            
            // Parse gamestate if it's a string
            let gs: any = match.gamestate;
            if (typeof gs === 'string') {
                try { gs = JSON.parse(gs); } catch (e) { gs = {}; }
            }

            // Game Clock Logic
            if (match.status === 'live' && match.timer_started_at) {
                const startedAt = new Date(match.timer_started_at!).getTime();
                if (!isNaN(startedAt)) {
                    const elapsedMs = now - startedAt;
                    setLocalTimer(Math.max(0, (match.timer_seconds || 0) - (elapsedMs / 1000)));
                }
                // Clear frozen values once running
                frozenTimerRef.current = null;
                frozenShotClockRef.current = null;
            } else {
                // Paused: use frozen value if available, else server value
                if (frozenTimerRef.current !== null) {
                    setLocalTimer(frozenTimerRef.current);
                } else {
                    setLocalTimer(match.timer_seconds || 0);
                }
            }

            // Shot Clock Logic
            const sc = gs?.shot_clock || gs?.shotClock;
            
            if (sc && typeof sc === 'object') {
                if (sc.started_at && match.status === 'live') {
                    const scStartedAt = new Date(sc.started_at).getTime();
                    if (!isNaN(scStartedAt)) {
                        const scElapsedMs = now - scStartedAt;
                        setShotClock(Math.max(0, (sc.seconds || 0) - (scElapsedMs / 1000)));
                    }
                } else {
                    // Paused: use frozen value if available
                    if (frozenShotClockRef.current !== null) {
                        setShotClock(frozenShotClockRef.current);
                    } else {
                        setShotClock(Math.max(0, sc.seconds || 0));
                    }
                }
            } else if (typeof sc === 'number') {
                setShotClock(sc);
            } else {
                setShotClock(null);
            }
        };

        const timerId = setInterval(updateTimer, 100);
        return () => clearInterval(timerId);
    }, [match]);



    // Handle Scaling for full screen feel
    useEffect(() => {
        const handleResize = () => {
            const vh = window.innerHeight;
            const vw = window.innerWidth;
            // Target a 16:9 base or just use full height
            setScale(Math.min(vw / 1920, vh / 1080));
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="text-xl font-light tracking-widest uppercase">Initializing View...</p>
        </div>
    );

    if (error || !match) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
            <p className="text-2xl font-bold">{error || "Data not found."}</p>
        </div>
    );

    const boardConfig = (match.board as Board);
    
    // Background style from board config
    const getBackgroundStyle = () => {
        if (!boardConfig?.layout?.canvas?.background) {
            return { backgroundColor: boardConfig?.background_color || '#050a15' };
        }
        const bg = boardConfig.layout.canvas.background;
        if (typeof bg === 'string') return { backgroundColor: bg };
        
        if (bg.type === 'solid') return { backgroundColor: bg.colors[0] };
        if (bg.type === 'gradient_2') return { backgroundImage: `linear-gradient(${bg.direction}, ${bg.colors[0]}, ${bg.colors[1]})` };
        if (bg.type === 'gradient_3') return { backgroundImage: `linear-gradient(${bg.direction}, ${bg.colors[0]}, ${bg.colors[1]}, ${bg.colors[2]})` };
        
        return { backgroundColor: '#050a15' };
    };

    const formatGameTime = (seconds: number) => {
        if (isNaN(seconds)) return '0:00';
        if (seconds < 60 && seconds > 0) return Math.abs(seconds).toFixed(1);
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatShotClock = (seconds: any) => {
        const value = Number(seconds);
        if (isNaN(value)) return '0';
        if (value < 5 && value > 0) return value.toFixed(1);
        return Math.ceil(value).toString();
    };

    const isShotClockLow = shotClock !== null && Number(shotClock) < 5 && Number(shotClock) > 0;
    const isShotClockExpired = shotClock !== null && Number(shotClock) <= 0;

    return (
        <div 
            className="w-screen h-screen overflow-hidden flex flex-col font-black italic tracking-tighter"
            style={getBackgroundStyle()}
        >
            {/* Top 30% - Game Clock */}
            <div 
                className="h-[30%] flex items-center justify-center border-b border-white/5 bg-black/20"
                style={{ color: '#ffffff' }}
            >
                <div className="text-[20vh] leading-none select-none">
                    {formatGameTime(localTimer)}
                </div>
            </div>

            {/* Bottom 70% - Shot Clock */}
            <div className="h-[70%] flex items-center justify-center relative">
                <div 
                    className={`text-[65vh] leading-none select-none transition-colors duration-200 ${
                        isShotClockExpired ? 'text-red-600' : 
                        isShotClockLow ? 'text-red-500 drop-shadow-[0_0_50px_rgba(239,68,68,0.5)]' : 
                        'text-yellow-400'
                    }`}
                >
                    {shotClock !== null ? formatShotClock(shotClock) : ''}
                </div>
                
                {/* Visual indicator for paused state */}
                {match.status === 'paused' && (
                    <div className="absolute top-4 right-8 px-4 py-2 bg-red-600/20 border border-red-600/50 rounded-lg text-red-500 text-2xl uppercase not-italic font-bold tracking-widest animate-pulse">
                        Clock Paused
                    </div>
                )}
            </div>
        </div>
    );
}
