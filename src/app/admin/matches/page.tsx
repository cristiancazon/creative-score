'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { updateItem, readItems } from '@directus/sdk';
import Link from 'next/link';
import { Plus, Edit, Trash2, Calendar, Clock, PlayCircle, Monitor, Gamepad2, Cpu, Printer, RotateCcw } from 'lucide-react';
import { Match, Team, Sport } from '@/types/directus';

export default function MatchesList() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const data = await directus.request(readItems('matches', {
                fields: ['*', 'home_team.name', 'away_team.name', 'sport.name', 'sport.type'] as any,
                sort: ['-date_created' as any]
            }));
            setMatches(data as any);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        scheduled: 'bg-slate-800/60 text-slate-300 border border-slate-700/50',
        live: 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]',
        paused: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]',
        finished: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
    };

    const handleResetMatch = async (match: Match) => {
        const hTeam = typeof match.home_team === 'object' && match.home_team ? (match.home_team as Team).name : 'Home';
        const aTeam = typeof match.away_team === 'object' && match.away_team ? (match.away_team as Team).name : 'Away';

        const confirmed = window.confirm(`🚨 RESET MATCH 🚨\n\nAre you sure you want to completely erase scores, clock, and play-by-play events for:\n${hTeam} vs ${aTeam}?\n\nThis CANNOT be undone.`);
        if (!confirmed) return;

        const basePeriodLen = match.period_length || 10;
        const seconds = basePeriodLen * 60;

        const clearedGamestate = {
            ...match.gamestate,
            player_stats: {},
            events: [],
            home_on_court: [],
            away_on_court: [],
            home_fouls: 0,
            away_fouls: 0
        };

        const resetData = {
            home_score: 0,
            away_score: 0,
            current_period: 1,
            timer_seconds: seconds,
            status: 'paused',
            timer_started_at: null,
            gamestate: clearedGamestate
        };

        try {
            await directus.request(updateItem('matches', match.id, resetData));
            fetchMatches();
        } catch (e: any) {
            alert(`Failed to reset match: ${e.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Matches</h1>
                <Link
                    href="/admin/matches/new"
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 font-semibold shadow-[0_0_20px_rgba(0,206,209,0.1)] hover:shadow-[0_0_25px_rgba(0,206,209,0.2)]"
                >
                    <Plus size={18} />
                    New Match
                </Link>
            </div>

            <div className="rounded-2xl bg-[#0c1629]/40 backdrop-blur-xl border border-cyan-500/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-300">
                        <thead className="bg-[#0e1726]/60 border-b border-cyan-500/10 text-slate-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold">Sport</th>
                                <th className="px-6 py-4 font-bold">Matchup</th>
                                <th className="px-6 py-4 font-bold">Score</th>
                                <th className="px-6 py-4 font-bold">Time</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-500/5">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
                            ) : matches.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No matches found.</td></tr>
                            ) : (
                                matches.map((match) => (
                                    <tr key={match.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${statusColors[match.status as keyof typeof statusColors] || statusColors.scheduled}`}>
                                                {match.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-white">
                                            {typeof match.sport === 'object' && match.sport ? (match.sport as Sport).name : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-semibold">
                                                    {typeof match.home_team === 'object' && match.home_team ? (match.home_team as Team).name : 'Home'}
                                                </span>
                                                <span className="text-slate-500 text-xs my-0.5">vs</span>
                                                <span className="text-white font-semibold">
                                                    {typeof match.away_team === 'object' && match.away_team ? (match.away_team as Team).name : 'Away'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xl font-bold text-cyan-400">
                                            {match.home_score} <span className="text-slate-600">-</span> {match.away_score}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {match.status === 'live' ? (
                                                <div className="flex items-center gap-2 text-green-400 font-semibold">
                                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                                    Live
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Calendar size={14} className="text-cyan-500" />
                                                    {new Date(match.start_time).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            <Link
                                                href={`/board/${match.id}`}
                                                target="_blank"
                                                className="p-2 hover:bg-cyan-500/10 rounded-xl text-purple-400 hover:text-purple-300 transition-all duration-200 hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                                title="Open Board"
                                            >
                                                <Monitor size={18} />
                                            </Link>
                                            <Link
                                                href={`/control/${match.id}`}
                                                target="_blank"
                                                className="p-2 hover:bg-cyan-500/10 rounded-xl text-green-400 hover:text-green-300 transition-all duration-200 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                                                title="Open Control"
                                            >
                                                <Gamepad2 size={18} />
                                            </Link>
                                            <Link
                                                href={`/controlmx/${match.id}`}
                                                target="_blank"
                                                className="p-2 hover:bg-cyan-500/10 rounded-xl text-cyan-400 hover:text-cyan-300 transition-all duration-200 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                                title="Open MX Control"
                                            >
                                                <Cpu size={18} />
                                            </Link>
                                            <div className="w-px h-6 bg-cyan-500/10 mx-1 self-center"></div>
                                            <button
                                                onClick={() => handleResetMatch(match)}
                                                className="p-2 hover:bg-red-500/10 rounded-xl text-red-500 hover:text-red-400 transition-all duration-200 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                                title="Reset Match to 0"
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                            <Link
                                                href={`/report/${match.id}`}
                                                target="_blank"
                                                className="p-2 hover:bg-cyan-500/10 rounded-xl text-yellow-500 hover:text-yellow-400 transition-all duration-200 hover:shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                                                title="Print Match Report"
                                            >
                                                <Printer size={18} />
                                            </Link>
                                            <div className="w-px h-6 bg-cyan-500/10 mx-1 self-center"></div>
                                            <Link
                                                href={`/admin/matches/${match.id}`}
                                                className="p-2 hover:bg-cyan-500/10 rounded-xl text-blue-400 hover:text-blue-300 transition-all duration-200 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
