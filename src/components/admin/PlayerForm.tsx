'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { directus } from '@/lib/directus';
import { createItem, updateItem, readItem, readItems } from '@directus/sdk';
import { ArrowLeft, Save, User } from 'lucide-react';
import Link from 'next/link';
import { Player, Team } from '@/types/directus';

interface PlayerFormProps {
    id?: string;
}

export default function PlayerForm({ id }: PlayerFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [formData, setFormData] = useState<Partial<Player>>({
        name: '',
        number: 0,
        team: '',
        position: '',
        avatar: undefined,
        active: true
    });

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchTeams();
        if (id && id !== 'new') {
            fetchPlayer(id);
        }
    }, [id]);

    const fetchTeams = async () => {
        try {
            const data = await directus.request(readItems('teams'));
            setTeams(data);
            // Default team if new
            if (id === 'new' && data.length > 0) {
                setFormData(prev => ({ ...prev, team: data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const fetchPlayer = async (playerId: string) => {
        try {
            const data = await directus.request(readItem('players', playerId));
            const teamId = typeof data.team === 'object' && data.team ? (data.team as Team).id : data.team;
            setFormData({
                ...data,
                team: teamId as string,
                avatar: data.avatar || undefined,
                position: data.position || '',
                number: data.number ? Number(data.number) : 0, // Ensure number is parsed
                active: data.active ?? true
            });
        } catch (error) {
            console.error('Error fetching player:', error);
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

            setFormData(prev => ({ ...prev, avatar: fileId }));
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
            // Ensure number is an integer before sending
            const dataToSave = {
                ...formData,
                number: formData.number ? parseInt(formData.number as any) : 0 // Cast to any for safety, though it should be number already
            };

            if (id && id !== 'new') {
                await directus.request(updateItem('players', id, dataToSave));
            } else {
                await directus.request(createItem('players', dataToSave));
            }
            router.push('/admin/players');
            router.refresh();
        } catch (error) {
            console.error('Error saving player:', error);
            alert('Failed to save player');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/players" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-400" />
                </Link>
                <h1 className="text-3xl font-bold text-white">
                    {id && id !== 'new' ? 'Edit Player' : 'New Player'}
                </h1>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Avatar Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Player Photo</label>
                        <div className="flex items-center gap-4">
                            {formData.avatar ? (
                                <div className="w-16 h-16 bg-gray-800 rounded-full overflow-hidden border border-gray-700 flex-shrink-0">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055'}/assets/${formData.avatar}?width=100&height=100&fit=cover`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 flex-shrink-0 text-gray-500">
                                    <User size={32} />
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
                        <label className="block text-sm font-medium text-gray-400 mb-2">Player Name</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none  focus:ring-blue-500"
                            placeholder="e.g. LeBron James"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Team</label>
                            <select
                                value={formData.team as string}
                                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none  focus:ring-blue-500"
                                required
                            >
                                <option value="" disabled>Select Team</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Jersey Number</label>
                            <input
                                type="number"
                                value={formData.number || ''}
                                onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 0 })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none  focus:ring-blue-500"
                                placeholder="e.g. 23"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Position</label>
                            <input
                                type="text"
                                value={formData.position || ''}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none  focus:ring-blue-500"
                                placeholder="e.g. Forward"
                            />
                        </div>
                        <div className="flex items-end pb-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={formData.active ?? true}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer- peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                                <span className="text-sm font-medium text-gray-400">Active Player</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium ml-auto transition-colors"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Player'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

