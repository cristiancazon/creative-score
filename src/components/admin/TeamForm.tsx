'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { directus } from '@/lib/directus';
import { createItem, updateItem, readItem, readItems } from '@directus/sdk';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Team, Sport } from '@/types/directus';

interface TeamFormProps {
    id?: string;
}

export default function TeamForm({ id }: TeamFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [sports, setSports] = useState<Sport[]>([]);
    const [formData, setFormData] = useState<Partial<Team>>({
        name: '',
        short_name: '',
        logo: undefined,
        primary_color: '#000000',
        secondary_color: '#ffffff',
        sport: '' // Will store ID
    });

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchSports();
        if (id && id !== 'new') {
            fetchTeam(id);
        }
    }, [id]);

    const fetchSports = async () => {
        try {
            const data = await directus.request(readItems('sports'));
            setSports(data);
            // Default sport if new
            if (id === 'new' && data.length > 0) {
                setFormData(prev => ({ ...prev, sport: data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching sports:', error);
        }
    };

    const fetchTeam = async (teamId: string) => {
        try {
            const data = await directus.request(readItem('teams', teamId));
            // Ensure we just keep the ID for the sport
            const sportId = typeof data.sport === 'object' && data.sport ? (data.sport as Sport).id : data.sport;
            setFormData({ ...data, sport: sportId as string });
        } catch (error) {
            console.error('Error fetching team:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

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

            setFormData(prev => ({ ...prev, logo: fileId }));
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
                await directus.request(updateItem('teams', id, formData));
            } else {
                await directus.request(createItem('teams', formData));
            }
            router.push('/admin/teams');
            router.refresh();
        } catch (error) {
            console.error('Error saving team:', error);
            alert('Failed to save team');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/teams" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-400" />
                </Link>
                <h1 className="text-3xl font-bold text-white">
                    {id && id !== 'new' ? 'Edit Team' : 'New Team'}
                </h1>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Team Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Los Angeles Lakers"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Short Name (Abbreviation)</label>
                            <input
                                type="text"
                                value={formData.short_name || ''}
                                onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. LAL"
                                maxLength={3}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Team Logo</label>
                        <div className="flex items-center gap-4">
                            {formData.logo && (
                                <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055'}/assets/${formData.logo}`}
                                        alt="Logo"
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

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Sport</label>
                        <select
                            value={formData.sport as string}
                            onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="" disabled>Select Sport</option>
                            {sports.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Primary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.primary_color}
                                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                    className="h-12 w-16 bg-transparent border-0 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.primary_color}
                                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Secondary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.secondary_color}
                                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                                    className="h-12 w-16 bg-transparent border-0 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.secondary_color}
                                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium ml-auto transition-colors"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Team'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
