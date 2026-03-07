'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { directus } from '@/lib/directus';
import { createItem, updateItem, readItem, readItems, deleteItem } from '@directus/sdk';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { TextAd, Match } from '@/types/directus';

interface TextAdFormProps {
    id?: string;
}

export default function TextAdForm({ id }: TextAdFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [matches, setMatches] = useState<Match[]>([]);
    const [formData, setFormData] = useState<Partial<TextAd>>({
        content: '',
        match: '',
        sort: 0
    });

    useEffect(() => {
        fetchMatches();
        if (id && id !== 'new') {
            fetchAd(id);
        }
    }, [id]);

    const fetchMatches = async () => {
        try {
            const data = await directus.request(readItems('matches', {
                fields: ['id', 'start_time', 'home_team.name', 'away_team.name'] as any,
                sort: ['-start_time'] as any
            }));
            setMatches(data as any);
        } catch (error) {
            console.error('Error fetching matches:', error);
        }
    };

    const fetchAd = async (adId: string) => {
        try {
            const data = await directus.request(readItem('text_ads' as any, adId));
            const matchId = typeof data.match === 'object' && data.match ? (data.match as any).id : data.match;
            setFormData({ ...data, match: matchId as string });
        } catch (error) {
            console.error('Error fetching text ad:', error);
            alert('Failed to load ad data.');
            router.push('/admin/text-ads');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Required field validation
        if (!formData.content?.trim()) {
            alert('Ad content is required.');
            setLoading(false);
            return;
        }

        try {
            if (id && id !== 'new') {
                await directus.request(updateItem('text_ads' as any, id, formData));
            } else {
                await directus.request(createItem('text_ads' as any, formData));
            }
            router.push('/admin/text-ads');
            router.refresh();
        } catch (error) {
            console.error('Error saving text ad:', error);
            alert('Failed to save ad.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!id || id === 'new') return;
        
        if (window.confirm('Are you sure you want to delete this Text Ad?')) {
            setDeleting(true);
            try {
                await directus.request(deleteItem('text_ads' as any, id));
                router.push('/admin/text-ads');
                router.refresh();
            } catch (error) {
                console.error('Error deleting text ad:', error);
                alert('Failed to delete ad.');
                setDeleting(false);
            }
        }
    };

    // Helper to render match name nicely in the select dropdown
    const formatMatchLabel = (m: any) => {
        const home = m.home_team?.name || 'Unknown Home';
        const away = m.away_team?.name || 'Unknown Away';
        const date = m.start_time ? new Date(m.start_time).toLocaleDateString() : 'No Date';
        return `${home} vs ${away} (${date})`;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/text-ads" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-400" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white">
                        {id && id !== 'new' ? 'Edit Text Ad' : 'New Text Ad'}
                    </h1>
                </div>
                {id && id !== 'new' && (
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-900/40 text-red-500 hover:bg-red-900/60 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                        {deleting ? 'Deleting...' : 'Delete Ad'}
                    </button>
                )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Assign to Match</label>
                        <select
                            value={(formData.match as string) || ''}
                            onChange={(e) => setFormData({ ...formData, match: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-blue-500"
                        >
                            <option value="">-- No specific match (Global) --</option>
                            {matches.map(m => (
                                <option key={m.id} value={m.id}>
                                    {formatMatchLabel(m)}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            If assigned to a match, it will be prioritized when cycling ads for that specific game.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Ad Content (Text)</label>
                        <textarea
                            value={formData.content || ''}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-blue-500 min-h-[120px]"
                            placeholder="e.g. VISÍTANOS EN NUESTRO LOCAL COMERCIAL"
                            required
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || deleting}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium ml-auto transition-colors"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Ad'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
