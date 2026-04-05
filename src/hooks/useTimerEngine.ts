'use client';

import { useEffect, useRef, useState } from 'react';

interface TimerEngineOptions {
    match: any | null;
}

interface TimerEngineResult {
    localTimer: number;
    shotClock: number | null;
    formatTime: (seconds: number) => string;
    formatShotClock: (value: number) => string;
}

/**
 * Encapsulates the 100ms tick loop for the game clock and shot clock.
 * Handles live→paused anti-jump by freezing displayed values on transition.
 */
export function useTimerEngine({ match }: TimerEngineOptions): TimerEngineResult {
    const [localTimer, setLocalTimer] = useState(0);
    const [shotClock, setShotClock] = useState<number | null>(null);

    const frozenTimerRef = useRef<number | null>(null);
    const frozenShotClockRef = useRef<number | null>(null);
    const prevStatusRef = useRef<string | null>(null);

    useEffect(() => {
        if (!match) return;

        const updateTimer = () => {
            const now = Date.now();
            const wasLive = prevStatusRef.current === 'live';
            const isNowPaused = match.status !== 'live';

            // Detect live → paused transition and freeze clocks
            if (wasLive && isNowPaused) {
                if (match.timer_started_at && frozenTimerRef.current === null) {
                    const startedAt = new Date(match.timer_started_at).getTime();
                    const elapsed = (now - startedAt) / 1000;
                    frozenTimerRef.current = Math.max(0, (match.timer_seconds || 0) - elapsed);
                }
                const sc = match?.gamestate?.shot_clock;
                if (sc?.started_at && frozenShotClockRef.current === null) {
                    const scStartedAt = new Date(sc.started_at).getTime();
                    const scElapsed = (now - scStartedAt) / 1000;
                    frozenShotClockRef.current = Math.max(0, (sc.seconds || 0) - scElapsed);
                }
            }

            if (match.status === 'live' && match.timer_started_at) {
                const startedAt = new Date(match.timer_started_at).getTime();
                const elapsedMs = now - startedAt;
                setLocalTimer(Math.max(0, (match.timer_seconds || 0) - elapsedMs / 1000));

                // Running → clear frozen values
                frozenTimerRef.current = null;
                frozenShotClockRef.current = null;

                // Shot clock live sync
                const sc = match?.gamestate?.shot_clock;
                if (sc?.started_at && sc?.seconds !== undefined) {
                    const scStartedAt = new Date(sc.started_at).getTime();
                    const scElapsedMs = now - scStartedAt;
                    setShotClock(Math.max(0, sc.seconds - scElapsedMs / 1000));
                }
            } else {
                // Paused: use frozen value or fallback to server value
                setLocalTimer(
                    frozenTimerRef.current !== null
                        ? frozenTimerRef.current
                        : match.timer_seconds || 0
                );

                const sc = match?.gamestate?.shot_clock;
                if (sc?.seconds !== undefined) {
                    setShotClock(
                        frozenShotClockRef.current !== null
                            ? frozenShotClockRef.current
                            : Math.max(0, sc.seconds)
                    );
                } else {
                    setShotClock(null);
                }
            }

            prevStatusRef.current = match.status;
        };

        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [match]);

    const formatTime = (seconds: number): string => {
        if (seconds < 60 && seconds > 0) return Math.abs(seconds).toFixed(1);
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatShotClock = (value: number): string => {
        return value < 5 && value > 0 ? value.toFixed(1) : Math.ceil(value).toString();
    };

    return { localTimer, shotClock, formatTime, formatShotClock };
}
