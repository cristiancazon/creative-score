'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import Link from 'next/link';
import { Plus, Edit, User } from 'lucide-react';
import { Player, Team } from '@/types/directus';

export default function PlayersList() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            const data = await directus.request(readItems('players', {
                fields: ['*', 'team.name', 'team.logo'],
                sort: ['team.name', 'name']
            }));
            setPlayers(data);
        } catch (error) {
            console.error('Error fetching players:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Players</h1>
                <Link
                    href="/admin/players/new"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                    <Plus size={18} />
                    Add Player
                </Link>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-400">
                        <thead className="bg-gray-950 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-semibold tracking-wider">Player</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Number</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Team</th>
                                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center">Loading...</td></tr>
                            ) : players.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center">No players found.</td></tr>
                            ) : (
                                players.map((player) => (
                                    <tr key={player.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-white font-medium flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                                                <User size={16} />
                                            </div>
                                            {player.name}
                                        </td>
                                        <td className="px-6 py-4 font-mono">{player.number}</td>
                                        <td className="px-6 py-4">
                                            {typeof player.team === 'object' && player.team ? (player.team as Team).name : '-'}
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-3">
                                            <Link
                                                href={`/admin/players/${player.id}`}
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
