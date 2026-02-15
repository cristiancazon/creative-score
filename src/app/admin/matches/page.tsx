'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import Link from 'next/link';
import { Plus, Edit, Trash2, Calendar, Clock, PlayCircle, Monitor, Gamepad2, Cpu } from 'lucide-react';
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
                fields: ['*', 'home_team.name' as any, 'away_team.name' as any, 'sport.name' as any, 'sport.type' as any],
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
        scheduled: 'bg-gray-800 text-gray-300',
        live: 'bg-green-900/40 text-green-400 border border-green-800/50',
        paused: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50',
        finished: 'bg-blue-900/40 text-blue-400 border border-blue-800/50'
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Matches</h1>
                <Link
                    href="/admin/matches/new"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                    <Plus size={18} />
                    New Match
                </Link>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-400">
                        <thead className="bg-gray-950 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Sport</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Matchup</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Score</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Time</th>
                                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>
                            ) : matches.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center">No matches found.</td></tr>
                            ) : (
                                matches.map((match) => (
                                    <tr key={match.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide ${statusColors[match.status as keyof typeof statusColors] || statusColors.scheduled}`}>
                                                {match.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            {typeof match.sport === 'object' && match.sport ? (match.sport as Sport).name : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">
                                                    {typeof match.home_team === 'object' && match.home_team ? (match.home_team as Team).name : 'Home'}
                                                </span>
                                                <span className="text-gray-500 text-xs">vs</span>
                                                <span className="text-white font-medium">
                                                    {typeof match.away_team === 'object' && match.away_team ? (match.away_team as Team).name : 'Away'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-lg text-white">
                                            {match.home_score} - {match.away_score}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {match.status === 'live' ? (
                                                <div className="flex items-center gap-2 text-green-400">
                                                    <PlayCircle size={14} />
                                                    Live
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Calendar size={14} />
                                                    {new Date(match.start_time).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-3">
                                            <Link
                                                href={`/board/${match.id}`}
                                                target="_blank"
                                                className="p-2 hover:bg-gray-800 rounded-lg text-purple-400 transition-colors"
                                                title="Open Board"
                                            >
                                                <Monitor size={18} />
                                            </Link>
                                            <Link
                                                href={`/control/${match.id}`}
                                                target="_blank"
                                                className="p-2 hover:bg-gray-800 rounded-lg text-green-400 transition-colors"
                                                title="Open Control"
                                            >
                                                <Gamepad2 size={18} />
                                            </Link>
                                            <Link
                                                href={`/controlmx/${match.id}`}
                                                target="_blank"
                                                className="p-2 hover:bg-gray-800 rounded-lg text-blue-400 transition-colors"
                                                title="Open MX Control"
                                            >
                                                <Cpu size={18} />
                                            </Link>
                                            <div className="w-px h-6 bg-gray-800 mx-1"></div>
                                            <Link
                                                href={`/admin/matches/${match.id}`}
                                                className="p-2 hover:bg-gray-800 rounded-lg text-blue-400 transition-colors"
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
