'use client';

import { Player, Match } from '@/types/directus';
import { EventTimelineItem } from './EventTimelineItem';

interface TimelineProps {
    match: Match;
    events: any[];
    players: Player[];
    homeTeamId: string;
    homeTeamColor?: string;
    awayTeamColor?: string;
}

export function LiveTimeline({ match, events, players, homeTeamId, homeTeamColor, awayTeamColor }: TimelineProps) {
    // Reverse events to show newest at the top
    const sortedEvents = [...events].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="relative flex flex-col items-center py-4">
            {/* Center Vertical Line */}
            <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 left-1/2 -ml-0.5 pointer-events-none"></div>

            {/* Event List */}
            <div className="w-full max-w-4xl relative z-10 px-4">
                {sortedEvents.map((event, index) => {
                    const player = players.find(p => p.id === event.player_id) || null;
                    const isHome = event.team === 'home' || event.team === homeTeamId;
                    
                    return (
                        <div key={event.id || index}>
                            {/* Period Divider if needed */}
                            {(index === 0 || sortedEvents[index-1].period !== event.period) && (
                                <div className="flex justify-center my-10 relative">
                                    <div className="bg-cyan-500 text-[#0f172a] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                        Fin del Periodo {event.period}
                                    </div>
                                </div>
                            )}

                            <EventTimelineItem 
                                event={event} 
                                player={player} 
                                isHome={isHome}
                                homeTeamColor={homeTeamColor}
                                awayTeamColor={awayTeamColor}
                            />
                        </div>
                    );
                })}

                {sortedEvents.length === 0 && (
                    <div className="text-center py-20 text-slate-500 italic">
                        No hay eventos registrados todavía.
                    </div>
                )}
            </div>
        </div>
    );
}
