'use client';

import { useState, useEffect } from 'react';
import { directus } from '@/lib/directus';
import { readItems, deleteItem } from '@directus/sdk';
import { Plus, Edit2, Trash2, Zap, Play } from 'lucide-react';
import Link from 'next/link';
import { ScoringAnimation } from '@/types/directus';

export default function AnimationsPage() {
    const [animations, setAnimations] = useState<ScoringAnimation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnimations();
    }, []);

    const fetchAnimations = async () => {
        try {
            const data = await directus.request(readItems('scoring_animations'));
            setAnimations(data as ScoringAnimation[]);
        } catch (error) {
            console.error("Error fetching animations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this animation?')) return;
        try {
            await directus.request(deleteItem('scoring_animations', id));
            setAnimations(animations.filter(a => a.id !== id));
        } catch (error) {
            console.error("Error deleting animation:", error);
            alert('Failed to delete animation');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Zap className="text-yellow-400" /> Scoring Animations
                    </h1>
                    <p className="text-gray-400 mt-2">Manage and design your scoreboard celebrations.</p>
                </div>
                <Link
                    href="/admin/animations/new"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-blue-900/20"
                >
                    <Plus size={20} /> New Animation
                </Link>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-950 border-b border-gray-800">
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Trigger Points</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {animations.map((anim) => (
                            <tr key={anim.id} className="hover:bg-gray-800/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">{anim.name}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        anim.trigger_points === 3 ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50' : 
                                        anim.trigger_points === 2 ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' : 
                                        'bg-gray-800 text-gray-400'
                                    }`}>
                                        {anim.trigger_points ? `+${anim.trigger_points}` : 'Generic'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-block w-2 h-2 rounded-full ${anim.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/admin/animations/${anim.id}`}
                                            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            title="Edit Visual"
                                        >
                                            <Edit2 size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(anim.id)}
                                            className="p-2 hover:bg-red-900/30 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {animations.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                    No animations found. Create your first celebration!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
