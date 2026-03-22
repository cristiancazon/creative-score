'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import Link from 'next/link';
import { Plus, Edit, MessageSquare } from 'lucide-react';
import { TextAd, Match } from '@/types/directus';

export default function TextAdsList() {
    const [ads, setAds] = useState<TextAd[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        try {
            const data = await directus.request(readItems('text_ads' as any, {
                fields: ['*', 'match.home_team.name', 'match.away_team.name'] as any,
                sort: ['match.start_time'] as any
            }));
            setAds(data as any);
        } catch (error) {
            console.error('Error fetching text ads:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Text Ads</h1>
                <Link
                    href="/admin/text-ads/new"
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 font-semibold shadow-[0_0_20px_rgba(0,206,209,0.1)] hover:shadow-[0_0_25px_rgba(0,206,209,0.2)]"
                >
                    <Plus size={18} />
                    Add Text Ad
                </Link>
            </div>

            <div className="rounded-2xl bg-[#0c1629]/40 backdrop-blur-xl border border-cyan-500/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-300">
                        <thead className="bg-[#0e1726]/60 border-b border-cyan-500/10 text-slate-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-bold">Ad Content</th>
                                <th className="px-6 py-4 font-bold">Match</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-500/5">
                            {loading ? (
                                <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
                            ) : ads.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">No text ads found.</td></tr>
                            ) : (
                                ads.map((ad) => (
                                    <tr key={ad.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-white font-semibold flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-lg border border-cyan-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(0,206,209,0.1)]">
                                                <MessageSquare size={16} className="text-cyan-400" />
                                            </div>
                                            <span className="truncate max-w-sm font-medium" title={ad.content}>{ad.content}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 font-medium">
                                            {typeof ad.match === 'object' && ad.match && ad.match.home_team ? 
                                                <div className="flex items-center gap-1">
                                                    <span className="text-cyan-400">{(ad.match.home_team as any).name}</span> <span className="text-slate-500 text-xs">vs</span> <span className="text-cyan-400">{(ad.match.away_team as any).name}</span>
                                                </div> : 
                                                <span className="text-slate-600 italic text-sm">No match assigned</span>}
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            <Link
                                                href={`/admin/text-ads/${ad.id}`}
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
