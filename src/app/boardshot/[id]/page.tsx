'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { directus } from '@/lib/directus';
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

    // Polling for updates
    useEffect(() => {
        if (!id) return;

        const pollData = async () => {
            try {
                const updatedMatch = await directus.request(readItem('matches', id, {
                    fields: ['*', 'sport.*', 'board.*'] as any[]
                })) as unknown as Match;

                setMatch(prev => {
                    if (!prev) return prev;
                    return { ...prev, ...updatedMatch };
                });
            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        const interval = setInterval(pollData, 1000);
        return () => clearInterval(interval);
    }, [id]);

    // Timer Tick Logic (Same as Board)
    useEffect(() => {
        if (!match) return;

        if (match.status !== 'live' || !match.timer_started_at) {
            setLocalTimer(match.timer_seconds || 0);
            // Crucial: check gamestate specifically
            const gsShot = match.gamestate?.shot_clock;
            if (gsShot !== undefined && gsShot !== null) {
                setShotClock(Number(gsShot));
            } else {
                setShotClock(null);
            }
            return;
        }

        const tick = () => {
            const now = Date.now();
            const startedAt = new Date(match.timer_started_at!).getTime();
            if (isNaN(startedAt)) return;

            const elapsed = (now - startedAt) / 1000;
            
            const newTime = Math.max(0, (match.timer_seconds || 0) - elapsed);
            setLocalTimer(newTime);
            
            const gsShot = match.gamestate?.shot_clock;
            if (gsShot !== undefined && gsShot !== null) {
                const newShotClock = Math.max(0, Number(gsShot) - elapsed);
                setShotClock(newShotClock);
            }
        };

        const timerId = setInterval(tick, 100);
        return () => clearInterval(timerId);
    }, [match?.status, match?.timer_seconds, match?.timer_started_at, match?.gamestate]);

    // Enhanced logging for debugging
    useEffect(() => {
        if (match) {
            console.log("[DEBUG] Match Update:", {
                status: match.status,
                timer: match.timer_seconds,
                shotClock: match.gamestate?.shot_clock,
                rawGamestate: match.gamestate
            });
        }
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
