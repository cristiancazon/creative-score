'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { directus } from '@/lib/directus';
import { readItem, readItems, readMe } from '@directus/sdk';
import { useMatchSubscription } from '@/hooks/useMatchSubscription';
import { Match, Team } from '@/types/directus';

interface UseMatchSyncOptions {
    matchId: string | null;
    /** Extra fields to fetch (e.g. board, animations) */
    extraFields?: string[];
    /** Skip if in preview mode or not yet authenticated */
    skip?: boolean;
    /** Called when authentication fails */
    onAuthFail?: () => void;
}

interface UseMatchSyncResult {
    match: Match | null;
    setMatch: React.Dispatch<React.SetStateAction<Match | null>>;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    homePlayers: any[];
    awayPlayers: any[];
    homeTeam: Team | null;
    awayTeam: Team | null;
    /** Ref to stamp after local writes, prevents WS echo from overwriting UI */
    lastLocalWriteRef: React.MutableRefObject<number>;
}

const generateRoster = (teamId: string) =>
    Array.from({ length: 12 }, (_, i) => ({
        id: `temp_${teamId}_${i + 4}`,
        name: `Player ${i + 4}`,
        number: i + 4,
        team: teamId,
        temp: true,
    }));

/**
 * Manages the full lifecycle of match data for a live scoreboard or control panel:
 * - Auth check (redirects via onAuthFail)
 * - Initial fetch of match + teams + players
 * - Real-time WebSocket subscription (with 1.5s polling fallback)
 * - Write guard via lastLocalWriteRef (prevents WS echo overwrites)
 */
export function useMatchSync({
    matchId,
    extraFields = [],
    skip = false,
    onAuthFail,
}: UseMatchSyncOptions): UseMatchSyncResult {
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [homePlayers, setHomePlayers] = useState<any[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<any[]>([]);
    const [homeTeam, setHomeTeam] = useState<Team | null>(null);
    const [awayTeam, setAwayTeam] = useState<Team | null>(null);
    const lastLocalWriteRef = useRef<number>(0);

    // Auth check
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await directus.getToken();
                if (!token) { onAuthFail?.(); return; }
                await directus.request(readMe());
                setIsAuthenticated(true);
            } catch {
                onAuthFail?.();
            }
        };
        checkAuth();
    }, [onAuthFail]);

    // Initial data fetch (teams, players — loaded once)
    useEffect(() => {
        if (!matchId || !isAuthenticated || skip) return;

        const fetchData = async () => {
            try {
                const fields = ['*', 'home_team.*', 'away_team.*', 'board.*', ...extraFields] as any[];
                const matchData = await directus.request(
                    readItem('matches', matchId, { fields })
                ) as any as Match;

                setMatch(matchData);
                setHomeTeam((matchData as any).home_team ?? null);
                setAwayTeam((matchData as any).away_team ?? null);

                const homeId = matchData.home_team
                    ? String(typeof matchData.home_team === 'object' ? (matchData.home_team as any).id : matchData.home_team)
                    : null;
                const awayId = matchData.away_team
                    ? String(typeof matchData.away_team === 'object' ? (matchData.away_team as any).id : matchData.away_team)
                    : null;

                if (homeId && awayId) {
                    const playersData = await directus.request(
                        readItems('players', {
                            filter: { _or: [{ team: { _eq: homeId } }, { team: { _eq: awayId } }] },
                            limit: 100,
                        })
                    ) as any[];

                    const hReal = playersData
                        .filter(p => String(typeof p.team === 'object' ? p.team.id : p.team) === homeId)
                        .sort((a, b) => a.number - b.number);
                    const aReal = playersData
                        .filter(p => String(typeof p.team === 'object' ? p.team.id : p.team) === awayId)
                        .sort((a, b) => a.number - b.number);

                    setHomePlayers(hReal.length > 0 ? hReal : generateRoster(homeId));
                    setAwayPlayers(aReal.length > 0 ? aReal : generateRoster(awayId));
                } else {
                    setHomePlayers(generateRoster('home'));
                    setAwayPlayers(generateRoster('away'));
                }

                setLoading(false);
            } catch (err) {
                console.error('[useMatchSync] Fetch error:', err);
                setError('Failed to load match data.');
                setLoading(false);
            }
        };

        fetchData();
    }, [matchId, isAuthenticated, skip]);

    // Anti-jump: freeze clock on live→paused before merging incoming data
    const frozenTimerRef = useRef<number | null>(null);
    const frozenShotClockRef = useRef<number | null>(null);

    const handleMatchUpdate = useCallback((data: any) => {
        // Skip WS updates within 500ms of a local write
        if (Date.now() - lastLocalWriteRef.current < 500) return;

        setMatch(prev => {
            if (!prev) return prev;
            const merged = { ...prev, ...data };

            // Detect live → paused transition, freeze clocks locally
            if (prev.status === 'live' && merged.status === 'paused') {
                const now = Date.now();
                if (prev.timer_started_at) {
                    const elapsed = (now - new Date(prev.timer_started_at).getTime()) / 1000;
                    frozenTimerRef.current = Math.max(0, (prev.timer_seconds || 0) - elapsed);
                }
                const sc = (prev as any).gamestate?.shot_clock;
                if (sc?.started_at) {
                    const scElapsed = (now - new Date(sc.started_at).getTime()) / 1000;
                    frozenShotClockRef.current = Math.max(0, (sc.seconds || 0) - scElapsed);
                }
            }

            // Clear frozen values when resuming
            if (merged.status === 'live') {
                frozenTimerRef.current = null;
                frozenShotClockRef.current = null;
            }

            return merged;
        });
    }, []);

    useMatchSubscription({
        matchId,
        fields: ['*', 'home_team.*', 'away_team.*', ...extraFields],
        skip: !isAuthenticated || skip,
        onData: handleMatchUpdate,
        fallbackInterval: 1500,
    });

    return {
        match,
        setMatch,
        loading,
        error,
        isAuthenticated,
        homePlayers,
        awayPlayers,
        homeTeam,
        awayTeam,
        lastLocalWriteRef,
    };
}
