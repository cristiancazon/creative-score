'use client';

import { useEffect, useRef, useCallback } from 'react';
import { directus } from '@/lib/directus';
import { readItem } from '@directus/sdk';

interface UseMatchSubscriptionOptions {
    matchId: string | null;
    /** Fields to request on each update */
    fields?: string[];
    /** Whether to skip subscription (e.g., preview mode) */
    skip?: boolean;
    /** Callback invoked when new data arrives (via WS or polling fallback) */
    onData: (data: any) => void;
    /** Polling interval in ms to use as fallback (default: 3000) */
    fallbackInterval?: number;
}

/**
 * Hook that subscribes to a Directus match via WebSocket.
 * Falls back to HTTP polling (at a slower 3s interval) if WebSocket
 * connection fails or is unavailable.
 */
export function useMatchSubscription({
    matchId,
    fields = ['*'],
    skip = false,
    onData,
    fallbackInterval = 1500,
}: UseMatchSubscriptionOptions) {
    const wsActiveRef = useRef(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const onDataRef = useRef(onData);
    const mountedRef = useRef(true);

    // Keep callback ref fresh without re-triggering the effect
    useEffect(() => {
        onDataRef.current = onData;
    }, [onData]);

    // Single poll function reusable for both initial fetch and fallback
    const poll = useCallback(async () => {
        if (!matchId) return;
        try {
            const data = await directus.request(readItem('matches', matchId, {
                fields: fields as any[],
            }));
            if (mountedRef.current) {
                onDataRef.current(data);
            }
        } catch (err) {
            console.error('[MatchSub] Poll error:', err);
        }
    }, [matchId, fields.join(',')]);

    // Start polling fallback
    const startPolling = useCallback(() => {
        if (pollingRef.current) return; // already polling
        pollingRef.current = setInterval(() => {
            if (mountedRef.current) poll();
        }, fallbackInterval);
    }, [poll, fallbackInterval]);

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!matchId || skip) return;
        mountedRef.current = true;

        let cancelled = false;

        const setupWebSocket = async () => {
            try {
                // 1. Connect to Directus WebSocket
                await directus.connect();

                if (cancelled) return;

                // 2. Subscribe to updates on this specific match
                const { subscription, unsubscribe } = await directus.subscribe('matches', {
                    event: 'update',
                    query: {
                        fields: fields as any,
                        filter: { id: { _eq: matchId } },
                    },
                });

                if (cancelled) {
                    unsubscribe();
                    return;
                }

                unsubscribeRef.current = unsubscribe;
                wsActiveRef.current = true;

                // WS connected → stop fallback polling if it was running
                stopPolling();

                // 3. Consume the async iterator for real-time events
                (async () => {
                    try {
                        for await (const message of subscription) {
                            if (cancelled || !mountedRef.current) break;

                            // Cast to any — the SDK's SubscriptionOutput union type
                            // doesn't expose 'data' on all variants (e.g. error events)
                            const msg = message as any;
                            if (msg?.data && Array.isArray(msg.data) && msg.data.length > 0) {
                                onDataRef.current(msg.data[0]);
                            }
                        }
                    } catch (iterErr) {
                        // Iterator ended (disconnect, server restart, etc.)
                        if (!cancelled && mountedRef.current) {
                            console.warn('[MatchSub] WS iterator ended, falling back to polling:', iterErr);
                            wsActiveRef.current = false;
                            startPolling();

                            // Attempt reconnect after a delay
                            setTimeout(() => {
                                if (!cancelled && mountedRef.current && !wsActiveRef.current) {
                                    setupWebSocket();
                                }
                            }, 5000);
                        }
                    }
                })();
            } catch (wsErr) {
                // WebSocket connection failed entirely → use polling fallback
                if (!cancelled && mountedRef.current) {
                    console.warn('[MatchSub] WS connection failed, using polling fallback:', wsErr);
                    wsActiveRef.current = false;
                    startPolling();
                }
            }
        };

        // Initial poll to get data immediately (don't wait for WS)
        poll();

        // Then try to set up WebSocket
        setupWebSocket();

        return () => {
            cancelled = true;
            mountedRef.current = false;
            stopPolling();
            wsActiveRef.current = false;

            if (unsubscribeRef.current) {
                try { unsubscribeRef.current(); } catch (_) { /* ignore */ }
                unsubscribeRef.current = null;
            }
        };
    }, [matchId, skip, fields.join(','), startPolling, stopPolling, poll]);
}
