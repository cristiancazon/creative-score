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
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Text Ads</h1>
                <Link
                    href="/admin/text-ads/new"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                    <Plus size={18} />
                    Add Text Ad
                </Link>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-400">
                        <thead className="bg-gray-950 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-semibold tracking-wider">Ad Content</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Match</th>
                                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={3} className="px-6 py-8 text-center">Loading...</td></tr>
                            ) : ads.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-8 text-center">No text ads found.</td></tr>
                            ) : (
                                ads.map((ad) => (
                                    <tr key={ad.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-white font-medium flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                                                <MessageSquare size={16} className="text-blue-400" />
                                            </div>
                                            <span className="truncate max-w-sm" title={ad.content}>{ad.content}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {typeof ad.match === 'object' && ad.match && ad.match.home_team ? 
                                                `${(ad.match.home_team as any).name} vs ${(ad.match.away_team as any).name}` : 
                                                <span className="text-gray-600 italic">No match assigned</span>}
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-3">
                                            <Link
                                                href={`/admin/text-ads/${ad.id}`}
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
