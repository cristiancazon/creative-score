'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Sport } from '@/types/directus';

export default function SportsList() {
    const [sports, setSports] = useState<Sport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSports();
    }, []);

    const fetchSports = async () => {
        try {
            const data = await directus.request(readItems('sports'));
            setSports(data);
        } catch (error) {
            console.error('Error fetching sports:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Sports</h1>
                <Link
                    href="/admin/sports/new"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                    <Plus size={18} />
                    Add Sport
                </Link>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-400">
                        <thead className="bg-gray-950 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-semibold tracking-wider">Name</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Engine (Type)</th>
                                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={3} className="px-6 py-8 text-center">Loading...</td></tr>
                            ) : sports.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-8 text-center">No sports found.</td></tr>
                            ) : (
                                sports.map((sport) => (
                                    <tr key={sport.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                            {sport.icon ? (
                                                <img
                                                    src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055'}/assets/${sport.icon}?width=32&height=32&fit=cover`}
                                                    className="w-8 h-8 object-contain bg-white/10 rounded-md p-1"
                                                    alt=""
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-800 rounded-md"></div>
                                            )}
                                            {sport.name}
                                        </td>
                                        <td className="px-6 py-4 capitalize text-gray-400">{sport.type}</td>
                                        <td className="px-6 py-4 flex justify-end gap-3">
                                            <Link
                                                href={`/admin/sports/${sport.id}`}
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
