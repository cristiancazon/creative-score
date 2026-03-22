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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Teams</h1>
                <Link
                    href="/admin/teams/new"
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 font-semibold shadow-[0_0_20px_rgba(0,206,209,0.1)] hover:shadow-[0_0_25px_rgba(0,206,209,0.2)]"
                >
                    <Plus size={18} />
                    Add Team
                </Link>
            </div>

            <div className="rounded-2xl bg-[#0c1629]/40 backdrop-blur-xl border border-cyan-500/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-300">
                        <thead className="bg-[#0e1726]/60 border-b border-cyan-500/10 text-slate-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-bold">Logo</th>
                                <th className="px-6 py-4 font-bold">Name</th>
                                <th className="px-6 py-4 font-bold">Sport</th>
                                <th className="px-6 py-4 font-bold">Colors</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-500/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
                            ) : teams.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No teams found.</td></tr>
                            ) : (
                                teams.map((team) => (
                                    <tr key={team.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-xl border border-cyan-500/20 flex items-center justify-center overflow-hidden shadow-[0_0_10px_rgba(0,206,209,0.1)]">
                                                <span className="text-sm font-bold text-cyan-400">{team.name.substring(0, 2).toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-white">{team.name}</td>
                                        <td className="px-6 py-4 text-slate-400 font-medium">
                                            {typeof team.sport === 'object' && team.sport ? (team.sport as Sport).name : 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <div className="w-6 h-6 rounded-full border border-cyan-500/20 shadow-[0_0_8px_rgba(0,206,209,0.1)]" style={{ backgroundColor: team.primary_color }} title={`Primary: ${team.primary_color}`}></div>
                                                <div className="w-6 h-6 rounded-full border border-cyan-500/20 shadow-[0_0_8px_rgba(0,206,209,0.1)]" style={{ backgroundColor: team.secondary_color }} title={`Secondary: ${team.secondary_color}`}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            <Link
                                                href={`/admin/teams/${team.id}`}
                                                className="p-2 hover:bg-cyan-500/10 rounded-xl text-cyan-400 hover:text-cyan-300 transition-all duration-200 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
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
