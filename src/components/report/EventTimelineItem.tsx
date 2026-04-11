'use client';

import { Player } from '@/types/directus';
import { getFileUrl } from '@/lib/directus';
import { Dribbble, ShieldAlert, ArrowRightLeft, Timer, Megaphone, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface EventProps {
    event: any;
    player: Player | null;
    isHome: boolean;
    homeTeamColor?: string;
    awayTeamColor?: string;
}

export function EventTimelineItem({ event, player, isHome, homeTeamColor, awayTeamColor }: EventProps) {
    const isPoints = event.type === 'pts';
    const isFoul = event.type === 'foul';
    const isSub = event.type === 'sub';
    const isTimeout = event.type === 'timeout';

    const teamColor = isHome 
        ? (homeTeamColor || '#22d3ee') 
        : (awayTeamColor || '#f43f5e');

    const getIcon = () => {
        if (isPoints) return <Dribbble size={18} className="text-orange-400" />;
        if (isFoul) return <ShieldAlert size={18} className="text-red-400" />;
        if (isSub) return <ArrowRightLeft size={18} className="text-cyan-400" />;
        if (isTimeout) return <Timer size={18} className="text-yellow-400" />;
        return <Info size={18} className="text-slate-400" />;
    };

    const getLabel = () => {
        if (isPoints) {
            if (event.value === 1) return 'Tiro Libre Anotado';
            if (event.value === 2) return 'Canasta de 2 Puntos';
            if (event.value === 3) return 'Triple Anotado';
            if (event.value === 0) return 'Tiro Fallado';
            return `Puntos Anotados (+${event.value})`;
        }
        if (isFoul) return 'Falta Cometida';
        if (isSub) return 'Sustitución';
        if (isTimeout) return 'Tiempo Muerto';
        return event.type.toUpperCase();
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Aligned to side: 
    // Home events on Left (flex-row-reverse)
    // Away events on Right (flex-row)
    // This matches the provided image donde el local/visitante se diferencian posicionalmente.

    return (
        <motion.div 
            initial={{ opacity: 0, x: isHome ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex w-full items-center gap-4 mb-8 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}
        >
            {/* Player Info (Name and Photo) */}
            <div className={`flex flex-1 items-center gap-3 ${isHome ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col ${isHome ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs font-bold text-white uppercase tracking-tight">{player?.name || 'Equipo'}</span>
                    <span className="text-[10px] text-slate-500 font-medium">#{player?.number || '-'} · P{event.period} · {formatTime(event.time_remaining)}</span>
                    {isPoints && event.homeScore !== undefined && (
                        <span className="text-xs font-black mt-1">
                            <span className={isHome ? 'text-white' : 'text-slate-500'}>{event.homeScore}</span>
                            <span className="text-slate-600 mx-1">-</span>
                            <span className={!isHome ? 'text-white' : 'text-slate-500'}>{event.awayScore}</span>
                        </span>
                    )}
                </div>
                
                <div className={`w-12 h-12 rounded-full border-2 p-0.5 overflow-hidden flex-shrink-0 bg-slate-800 ${isHome ? 'order-last' : 'order-first'}`} style={{ borderColor: teamColor }}>
                    {player?.avatar ? (
                        <img src={getFileUrl(player.avatar)} alt={player.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold bg-slate-800 rounded-full">
                            {player?.name?.[0] || '?'}
                        </div>
                    )}
                </div>
            </div>

            {/* Event Icon / Center Marker */}
            <div className="relative flex flex-col items-center justify-center z-10">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg group-hover:border-cyan-500 transition-colors">
                    {getIcon()}
                </div>
                {/* Visual Connector Line (Handled by parent container but this is the anchor) */}
            </div>

            {/* Event Description */}
            <div className={`flex flex-1 flex-col ${isHome ? 'items-start' : 'items-end'}`}>
                <span className="text-xs font-black uppercase tracking-widest text-slate-200" style={{ color: teamColor }}>
                    {getLabel()}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">{event.type === 'timeout' ? 'Solicitado' : ''}</span>
            </div>
        </motion.div>
    );
}
