'use client';

import { Match, Team } from '@/types/directus';
import { getFileUrl } from '@/lib/directus';
import { motion } from 'framer-motion';

interface HeaderProps {
    match: Match;
    homeTeam: Team | null;
    awayTeam: Team | null;
    timerSeconds: number;
}

export function LiveReportHeader({ match, homeTeam, awayTeam, timerSeconds }: HeaderProps) {
    const isLive = match.status === 'live';
    const isFinished = match.status === 'finished';
    
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="bg-[#0f172a] text-white p-6 rounded-3xl shadow-2xl border border-slate-800/50 mb-6">
            <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-2 flex-1 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800/50 p-2 flex items-center justify-center border border-slate-700/50 shadow-inner">
                        {homeTeam?.logo ? (
                            <img src={getFileUrl(homeTeam.logo)} alt={homeTeam.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                            <div className="text-2xl font-black text-slate-600">{homeTeam?.short_name || 'H'}</div>
                        )}
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 truncate max-w-[120px]">
                        {homeTeam?.name || 'Local'}
                    </h2>
                </div>

                {/* Score Area */}
                <div className="flex flex-col items-center justify-center gap-1 min-w-[180px]">
                    <div className="flex items-center gap-6">
                        <motion.span 
                            key={match.home_score}
                            initial={{ scale: 1.2, color: '#22d3ee' }}
                            animate={{ scale: 1, color: '#fff' }}
                            className="text-6xl font-black tabular-nums tracking-tighter"
                        >
                            {match.home_score}
                        </motion.span>
                        <span className="text-slate-600 text-2xl font-bold">-</span>
                        <motion.span 
                            key={match.away_score}
                            initial={{ scale: 1.2, color: '#22d3ee' }}
                            animate={{ scale: 1, color: '#fff' }}
                            className="text-6xl font-black tabular-nums tracking-tighter"
                        >
                            {match.away_score}
                        </motion.span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                            isLive ? 'bg-red-500/20 text-red-400 border border-red-500/20 animate-pulse' : 
                            isFinished ? 'bg-slate-700 text-slate-400' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                        }`}>
                            {isFinished ? 'Final del Partido' : isLive ? 'En Vivo' : 'Programado'}
                        </span>
                        {!isFinished && (
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {match.current_period > (match.max_periods || 4) 
                                        ? `OT ${match.current_period - (match.max_periods || 4)}` 
                                        : `Periodo ${match.current_period}`}
                                </span>
                                <span className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
                                    {timeStr}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-2 flex-1 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800/50 p-2 flex items-center justify-center border border-slate-700/50 shadow-inner">
                        {awayTeam?.logo ? (
                            <img src={getFileUrl(awayTeam.logo)} alt={awayTeam.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                            <div className="text-2xl font-black text-slate-600">{awayTeam?.short_name || 'V'}</div>
                        )}
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 truncate max-w-[120px]">
                        {awayTeam?.name || 'Visitante'}
                    </h2>
                </div>
            </div>
        </div>
    );
}
