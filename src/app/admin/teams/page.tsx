'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Team, Sport } from '@/types/directus';

export default function TeamsList() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const data = await directus.request(readItems('teams', {
                fields: ['*', 'sport.*'] as any
            }));
            setTeams(data as any);
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Teams</h1>
                <Link
                    href="/admin/teams/new"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                    <Plus size={18} />
                    Add Team
                </Link>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-400">
                        <thead className="bg-gray-950 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-semibold tracking-wider">Logo</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Name</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Sport</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Colors</th>
                                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr>
                            ) : teams.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center">No teams found.</td></tr>
                            ) : (
                                teams.map((team) => (
                                    <tr key={team.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                                                {/* Placeholder for logo if image not available */}
                                                <span className="text-xs font-bold">{team.name.substring(0, 2).toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">{team.name}</td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {typeof team.sport === 'object' && team.sport ? (team.sport as Sport).name : 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <div className="w-6 h-6 rounded-full border border-gray-700" style={{ backgroundColor: team.primary_color }} title={team.primary_color}></div>
                                                <div className="w-6 h-6 rounded-full border border-gray-700" style={{ backgroundColor: team.secondary_color }} title={team.secondary_color}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-3">
                                            <Link
                                                href={`/admin/teams/${team.id}`}
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
