'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { directus } from '@/lib/directus';
import { createItem, updateItem, readItem } from '@directus/sdk';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Sport } from '@/types/directus';

interface SportFormProps {
    id?: string; // If id provided, it's Edit mode
}

export default function SportForm({ id }: SportFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Sport>>({
        name: '',
        type: 'basketball',
        periods: 4,
        period_duration: 10
    });

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (id && id !== 'new') {
            fetchSport(id);
        }
    }, [id]);

    const fetchSport = async (sportId: string) => {
        try {
            const data = await directus.request(readItem('sports', sportId));
            setFormData(data);
        } catch (error) {
            console.error('Error fetching sport:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // We use standard fetch here because SDK uploadFiles is sometimes tricky with environments
            const token = await directus.getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055'}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            const fileId = data.data.id;

            setFormData(prev => ({ ...prev, icon: fileId }));
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id && id !== 'new') {
                await directus.request(updateItem('sports', id, formData));
            } else {
                await directus.request(createItem('sports', formData));
            }
            router.push('/admin/sports');
            router.refresh();
        } catch (error) {
            console.error('Error saving sport:', error);
            alert('Failed to save sport');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/sports" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-400" />
                </Link>
                <h1 className="text-3xl font-bold text-white">
                    {id && id !== 'new' ? 'Edit Sport' : 'New Sport'}
                </h1>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Sport Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none  focus:ring-blue-500"
                            placeholder="e.g. Basketball, Soccer"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Sport Icon (Logo)</label>
                        <div className="flex items-center gap-4">
                            {formData.icon && (
                                <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055'}/assets/${formData.icon}`}
                                        alt="Icon"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/30 file:text-blue-400 hover:file:bg-blue-900/50"
                            />
                            {uploading && <span className="text-xs text-blue-400 animate-pulse">Uploading...</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Game Engine (Type)
                                <span className="block text-xs text-gray-500 font-normal mt-1">Defines the scoring rules</span>
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none  focus:ring-blue-500"
                            >
                                <option value="basketball">Basketball (Quarters)</option>
                                <option value="soccer">Soccer (Halves)</option>
                                <option value="volleyball">Volleyball (Sets)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Periods (Quarters/Halves)</label>
                            <input
                                type="number"
                                value={formData.periods || 4}
                                onChange={(e) => setFormData({ ...formData, periods: parseInt(e.target.value) })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none  focus:ring-blue-500"
                                min={1}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Duration (Minutes)</label>
                            <input
                                type="number"
                                value={formData.period_duration || 10}
                                onChange={(e) => setFormData({ ...formData, period_duration: parseInt(e.target.value) })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none  focus:ring-blue-500"
                                min={1}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium ml-auto transition-colors"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Sport'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

