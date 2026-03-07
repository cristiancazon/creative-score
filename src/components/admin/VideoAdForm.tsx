'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { directus } from '@/lib/directus';
import { createItem, updateItem, readItem, readItems, deleteItem } from '@directus/sdk';
import { ArrowLeft, Save, Trash2, Video } from 'lucide-react';
import Link from 'next/link';
import { VideoAd, Match } from '@/types/directus';

interface VideoAdFormProps {
    id?: string;
}

export default function VideoAdForm({ id }: VideoAdFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [matches, setMatches] = useState<Match[]>([]);
    const [formData, setFormData] = useState<Partial<VideoAd>>({
        video: undefined,
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
            const data = await directus.request(readItem('video_ads' as any, adId));
            const matchId = typeof data.match === 'object' && data.match ? (data.match as any).id : data.match;
            setFormData({ ...data, match: matchId as string });
        } catch (error) {
            console.error('Error fetching video ad:', error);
            alert('Failed to load ad data.');
            router.push('/admin/video-ads');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            const formPayload = new FormData();
            formPayload.append('file', file);

            const token = await directus.getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055'}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formPayload
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            const fileId = data.data.id;

            setFormData(prev => ({ ...prev, video: fileId }));
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload video");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.video) {
            alert('A video file must be uploaded before saving.');
            setLoading(false);
            return;
        }

        try {
            if (id && id !== 'new') {
                await directus.request(updateItem('video_ads' as any, id, formData));
            } else {
                await directus.request(createItem('video_ads' as any, formData));
            }
            router.push('/admin/video-ads');
            router.refresh();
        } catch (error) {
            console.error('Error saving video ad:', error);
            alert('Failed to save ad.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!id || id === 'new') return;
        
        if (window.confirm('Are you sure you want to delete this Video Ad instance? (The file physically uploaded will remain in the Directus Library)')) {
            setDeleting(true);
            try {
                await directus.request(deleteItem('video_ads' as any, id));
                router.push('/admin/video-ads');
                router.refresh();
            } catch (error) {
                console.error('Error deleting video ad:', error);
                alert('Failed to delete ad.');
                setDeleting(false);
            }
        }
    };

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
                    <Link href="/admin/video-ads" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-400" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white">
                        {id && id !== 'new' ? 'Edit Video Ad' : 'New Video Ad'}
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
                        <label className="block text-sm font-medium text-gray-400 mb-2">Video File</label>
                        <div className="flex items-center gap-4">
                            {formData.video ? (
                                <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0 flex items-center justify-center">
                                    <Video className="text-pink-500 opacity-50" size={24} />
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-gray-950 rounded-lg overflow-hidden border border-gray-800 border-dashed flex-shrink-0 flex items-center justify-center">
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="video/mp4,video/webm"
                                    onChange={handleFileUpload}
                                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-900/30 file:text-pink-400 hover:file:bg-pink-900/50 cursor-pointer"
                                />
                                {formData.video && (
                                    <p className="mt-2 text-xs font-mono text-gray-500">ID: {formData.video}</p>
                                )}
                            </div>
                            {uploading && <span className="text-xs text-pink-400 animate-pulse">Uploading...</span>}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || uploading || deleting}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium ml-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
