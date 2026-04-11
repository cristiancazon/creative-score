'use client';

import { useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMatchSync } from '@/hooks/useMatchSync';
import { LiveReportHeader } from '@/components/report/LiveReportHeader';
import { LiveReportTabs } from '@/components/report/LiveReportTabs';
import { LiveTimeline } from '@/components/report/LiveTimeline';
import { motion, AnimatePresence } from 'framer-motion';

export default function VisualReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('live');

    const {
        match,
        loading,
        error,
        isAuthenticated,
        homePlayers,
        awayPlayers,
        homeTeam,
        awayTeam,
    } = useMatchSync({
        matchId: id,
        onAuthFail: () => router.push('/login')
    });

    // Calculate progressive scores for the timeline
    const eventsWithScores = useMemo(() => {
        if (!match?.gamestate?.events) return [];
        
        const events = [...match.gamestate.events].sort((a: any, b: any) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        let homeScore = 0;
        let awayScore = 0;
        const homeTeamId = typeof match.home_team === 'object' ? match.home_team.id : match.home_team;

        return events.map(ev => {
            const isHome = ev.team === 'home' || ev.team === homeTeamId;
            if (ev.type === 'pts') {
                if (isHome) homeScore += ev.value;
                else awayScore += ev.value;
            }
            return { ...ev, homeScore, awayScore };
        });
    }, [match?.gamestate?.events, match?.home_team]);

    if (!isAuthenticated) return (
        <div className="min-h-screen bg-[#060e20] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Verificando Acceso...</span>
            </div>
        </div>
    );

    if (loading) return (
        <div className="min-h-screen bg-[#060e20] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Creative Score</h2>
                <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="w-full h-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
                    />
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-4">Iniciando Reporte Visual...</p>
            </div>
        </div>
    );

    if (error || !match) return (
        <div className="min-h-screen bg-[#060e20] flex items-center justify-center p-8">
            <div className="max-w-md text-center">
                <h1 className="text-4xl font-black text-white mb-4">Error</h1>
                <p className="text-slate-400 mb-8">{error || 'El partido no pudo ser cargado.'}</p>
                <button 
                    onClick={() => router.push('/admin/matches')}
                    className="bg-cyan-500 text-[#060e20] px-8 py-3 rounded-xl font-black uppercase tracking-wider hover:bg-cyan-400 transition-colors"
                >
                    Volver a Partidos
                </button>
            </div>
        </div>
    );

    const allPlayers = [...homePlayers, ...awayPlayers];

    return (
        <div className="min-h-screen bg-[#060e20] text-slate-100 selection:bg-cyan-500/30">
            {/* Top Navigation Bar */}
            <nav className="border-b border-slate-800/50 bg-[#060e20]/80 backdrop-blur-xl sticky top-0 z-[100] px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black text-xl">C</div>
                    <span className="font-black tracking-tighter text-xl text-white">Creative Score</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50">
                        Visual Report v2.0
                    </span>
                    <button 
                        onClick={() => router.push('/admin/matches')}
                        className="text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        Cerrar
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-4 md:p-8">
                {/* Header Section */}
                <LiveReportHeader 
                    match={match} 
                    homeTeam={homeTeam} 
                    awayTeam={awayTeam} 
                    timerSeconds={match.timer_seconds} // In a real live app, we'd use a local timer hook, but here we can rely on match updates for the report.
                />

                {/* Main Content Area */}
                <div className="bg-slate-900/50 rounded-3xl border border-slate-800/50 backdrop-blur-sm shadow-xl min-h-[600px] overflow-hidden">
                    <LiveReportTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    
                    <div className="p-4 md:p-10">
                        <AnimatePresence mode="wait">
                            {activeTab === 'live' ? (
                                <motion.div
                                    key="live"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <LiveTimeline 
                                        match={match}
                                        events={eventsWithScores}
                                        players={allPlayers}
                                        homeTeamId={typeof match.home_team === 'object' ? match.home_team.id : String(match.home_team)}
                                        homeTeamColor={homeTeam?.primary_color}
                                        awayTeamColor={awayTeam?.primary_color}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-40 gap-4"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-600">
                                        {activeTab === 'stats' ? '📊' : activeTab === 'players' ? '🏆' : '🎯'}
                                    </div>
                                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Módulo en Desarrollo</p>
                                    <p className="text-slate-600 text-[10px] text-center max-w-xs">Esta sección estará disponible próximamente en la versión mejorada del reporte visual.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <footer className="mt-12 mb-8 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Creative Score Analytics</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span>Powered by XEREX Agency</span>
                    </div>
                    <p className="text-slate-600 text-[9px] text-center max-w-lg">
                        Este reporte es propiedad de Creative Score. Los datos mostrados son procesados en tiempo real mediante nuestra exclusiva infraestructura de baja latencia.
                    </p>
                </footer>
            </div>
        </div>
    );
}
