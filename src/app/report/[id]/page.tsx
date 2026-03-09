'use client';

import { useEffect, useState, use } from 'react';
import { directus } from '@/lib/directus';
import { readItem, readItems } from '@directus/sdk';
import { Match, Player } from '@/types/directus';

export default function MatchReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [match, setMatch] = useState<Match | null>(null);
    const [homePlayers, setHomePlayers] = useState<Player[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const matchData = await directus.request(readItem('matches', id, {
                    fields: ['*', 'home_team.*', 'away_team.*'] as any
                })) as unknown as Match;
                setMatch(matchData);

                const tHomeId = typeof matchData.home_team === 'object' ? matchData.home_team.id : matchData.home_team;
                const tAwayId = typeof matchData.away_team === 'object' ? matchData.away_team.id : matchData.away_team;

                if (tHomeId) {
                    const homeP = await directus.request(readItems('players', {
                        filter: { team: { _eq: tHomeId } },
                        limit: -1,
                        sort: ['number'] as any
                    })) as Player[];
                    setHomePlayers(homeP);
                }
                if (tAwayId) {
                    const awayP = await directus.request(readItems('players', {
                        filter: { team: { _eq: tAwayId } },
                        limit: -1,
                        sort: ['number'] as any
                    })) as Player[];
                    setAwayPlayers(awayP);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return <div className="p-8 text-black bg-white min-h-screen">Loading Report Data...</div>;
    if (!match) return <div className="p-8 text-black bg-white min-h-screen">Match not found.</div>;

    const homeTeam = typeof match.home_team === 'object' ? match.home_team : null;
    const awayTeam = typeof match.away_team === 'object' ? match.away_team : null;

    // Build chronological events and progressive score
    const events = match.gamestate?.events || [];
    const sortedEvents = [...events].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let currentHomeScore = 0;
    let currentAwayScore = 0;

    const tHomeId = typeof match.home_team === 'object' ? match.home_team?.id : match.home_team;

    const progressiveLog = sortedEvents.map(e => {
        const isHome = e.team === 'home' || e.team === tHomeId;
        if (e.type === 'pts') {
            if (isHome) currentHomeScore += e.value;
            else currentAwayScore += e.value;
        }
        return { ...e, isHome, homeScore: currentHomeScore, awayScore: currentAwayScore };
    });

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const renderFoulBoxes = (foulCount: number) => {
        const boxes = [];
        for (let i = 1; i <= 5; i++) {
            boxes.push(
                <div key={i} className={`w-4 h-4 border border-black flex items-center justify-center text-[10px] font-bold ${i <= foulCount ? 'bg-gray-400' : ''}`}>
                    {i <= foulCount ? 'X' : ''}
                </div>
            );
        }
        return <div className="flex gap-1">{boxes}</div>;
    };

    return (
        <div className="min-h-screen bg-gray-200 print:bg-white text-black p-8 font-sans">
            {/* Control Strip (Hidden on Print) */}
            <div className="mb-8 print:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow max-w-[210mm] mx-auto">
                <div>
                    <h2 className="text-xl font-bold">Match Report Preview</h2>
                    <p className="text-sm text-gray-500">Press Print and save as PDF. Ensure "Background Graphics" is enabled.</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
                >
                    Print Report (A4)
                </button>
            </div>

            {/* A4 Page Container */}
            <div className="max-w-[210mm] mx-auto bg-white print:shadow-none shadow-lg print:w-full print:max-w-none border print:border-none border-gray-300">
                
                {/* HEADERS */}
                <header className="border-b-4 border-black p-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">OFFICIAL MATCH REPORT</h1>
                        <h2 className="text-xl font-bold mt-2 uppercase text-gray-800">Team A: {homeTeam?.name || 'Home'}</h2>
                        <h2 className="text-xl font-bold uppercase text-gray-800">Team B: {awayTeam?.name || 'Away'}</h2>
                    </div>
                    <div className="text-right text-sm font-semibold space-y-1">
                        <div><span className="text-gray-500">DATE:</span> {new Date(match.start_time).toLocaleDateString()}</div>
                        <div><span className="text-gray-500">TIME:</span> {new Date(match.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div><span className="text-gray-500">MATCH ID:</span> <span className="font-mono text-xs">{match.id}</span></div>
                    </div>
                </header>

                <div className="p-6 grid grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: ROSTERS */}
                    <div className="col-span-7 space-y-8">
                        {/* HOME TEAM */}
                        <div>
                            <div className="bg-black text-white px-3 py-1 font-bold text-lg uppercase flex justify-between">
                                <span>TEAM A: {homeTeam?.name || 'Home'}</span>
                                <span>FINAL SCORE: {match.home_score}</span>
                            </div>
                            <table className="w-full text-sm border-collapse border border-black mt-2">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border border-black p-1 w-8 text-center">#</th>
                                        <th className="border border-black p-1 text-left px-2">Player Name</th>
                                        <th className="border border-black p-1 w-12 text-center">PTS</th>
                                        <th className="border border-black p-1 w-32 text-center">FOULS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {homePlayers.map((p, i) => {
                                        const stats = match.gamestate?.player_stats?.[p.id] || { points: 0, fouls: 0 };
                                        return (
                                            <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="border border-black p-1 text-center font-bold">{p.number}</td>
                                                <td className="border border-black p-1 px-2 uppercase truncate max-w-[150px] font-semibold text-gray-800">{p.name}</td>
                                                <td className="border border-black p-1 text-center font-bold">{stats.points}</td>
                                                <td className="border border-black p-1 flex justify-center py-1.5">
                                                    {renderFoulBoxes(stats.fouls)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* AWAY TEAM */}
                        <div>
                            <div className="bg-black text-white px-3 py-1 font-bold text-lg uppercase flex justify-between">
                                <span>TEAM B: {awayTeam?.name || 'Away'}</span>
                                <span>FINAL SCORE: {match.away_score}</span>
                            </div>
                            <table className="w-full text-sm border-collapse border border-black mt-2">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border border-black p-1 w-8 text-center">#</th>
                                        <th className="border border-black p-1 text-left px-2">Player Name</th>
                                        <th className="border border-black p-1 w-12 text-center">PTS</th>
                                        <th className="border border-black p-1 w-32 text-center">FOULS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {awayPlayers.map((p, i) => {
                                        const stats = match.gamestate?.player_stats?.[p.id] || { points: 0, fouls: 0 };
                                        return (
                                            <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="border border-black p-1 text-center font-bold">{p.number}</td>
                                                <td className="border border-black p-1 px-2 uppercase truncate max-w-[150px] font-semibold text-gray-800">{p.name}</td>
                                                <td className="border border-black p-1 text-center font-bold">{stats.points}</td>
                                                <td className="border border-black p-1 flex justify-center py-1.5">
                                                    {renderFoulBoxes(stats.fouls)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* SIGNATURES */}
                        <div className="border-2 border-black mt-12 p-4">
                            <h3 className="font-bold uppercase border-b-2 border-black pb-2 mb-12 text-center tracking-widest">Official Signatures</h3>
                            <div className="flex justify-between px-8">
                                <div className="text-center w-full">
                                    <div className="w-48 mx-auto border-b border-black mb-2"></div>
                                    <span className="text-sm font-bold text-gray-700">Scorer / Table Official</span>
                                </div>
                                <div className="text-center w-full">
                                    <div className="w-48 mx-auto border-b border-black mb-2"></div>
                                    <span className="text-sm font-bold text-gray-700">Main Referee</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-center text-xs text-gray-400 mt-4">
                            Generated by Creative Score (Powered by XEREX)
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PROGRESSIVE SCORE (PLAY BY PLAY) */}
                    <div className="col-span-5 flex flex-col h-full min-h-[500px]">
                        <div className="bg-black text-white px-3 py-1 font-bold text-sm uppercase text-center border-t border-l border-r border-black tracking-widest">
                            Progressive Events
                        </div>
                        <div className="border-l border-r border-b border-black flex-1 p-0 pb-4">
                            <table className="w-full text-xs text-center border-collapse">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="border-b border-r border-black p-1 w-10">PER</th>
                                        <th className="border-b border-r border-black p-1 w-12">TIME</th>
                                        <th className="border-b border-r border-black p-1 w-8">#</th>
                                        <th className="border-b border-r border-black p-1">ACTION</th>
                                        <th className="border-b border-black p-1 font-mono tracking-widest bg-gray-300 w-16">A-B</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {progressiveLog.map((ev, i) => {
                                        const player = [...homePlayers, ...awayPlayers].find(p => p.id === ev.player_id);
                                        const actionText = ev.type === 'pts' 
                                            ? <span className={ev.value > 0 ? 'text-green-700 font-bold' : 'text-red-700 whitespace-nowrap'}>{ev.value > 0 ? '+' : ''}{ev.value} PTS</span>
                                            : <span className="text-red-600 font-bold uppercase tracking-widest">Foul</span>;
                                            
                                        return (
                                            <tr key={ev.id || i} className="border-b border-gray-300">
                                                <td className="border-r border-gray-300 p-1 font-bold text-[10px] text-gray-700">{ev.period > (match.max_periods || 4) ? `OT${ev.period - (match.max_periods || 4)}` : `Q${ev.period}`}</td>
                                                <td className="border-r border-gray-300 p-1 text-[10px] font-mono text-gray-500 bg-gray-50">{formatTime(ev.time_remaining)}</td>
                                                <td className={`border-r border-gray-300 p-1 font-bold ${ev.isHome ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900'}`}>
                                                    {player?.number || '?'}
                                                </td>
                                                <td className={`border-r border-gray-300 p-1 ${ev.isHome ? 'text-purple-900' : 'text-blue-900'}`}>
                                                    {actionText}
                                                </td>
                                                <td className="p-1 font-mono font-bold bg-gray-100 border-gray-300">
                                                    {ev.homeScore}-{ev.awayScore}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {progressiveLog.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-gray-400 italic font-semibold">No progressive events recorded yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
