'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { directus } from '@/lib/directus';
import { createItem, updateItem, readItem } from '@directus/sdk';
import { ArrowLeft, Save, Monitor, Edit } from 'lucide-react';
import Link from 'next/link';
import { Board } from '@/types/directus';

interface BoardFormProps {
    id?: string;
}

export default function BoardForm({ id }: BoardFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<Board>>({
        name: '',
        background_color: '#0a0a0a',
        text_color: '#ffffff',
        show_timer: true,
        show_period: true,
        show_fouls: true,
        show_timeouts: true,
        show_players: true,
        show_player_stats: true,
        primary_color_home: '#ef4444',
        primary_color_away: '#3b82f6',
        label_period: 'PERIOD',
        label_fouls: 'FOULS'
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                if (id && id !== 'new') {
                    const data = await directus.request(readItem('boards', id));
                    setFormData(data);
                }
            } catch (err) {
                console.error("Error loading data:", err);
            }
        };
        loadData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id && id !== 'new') {
                await directus.request(updateItem('boards', id, formData));
            } else {
                await directus.request(createItem('boards', formData));
            }
            router.push('/admin/boards');
            router.refresh();
        } catch (error) {
            console.error('Error saving board:', error);
            alert('Failed to save board');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/boards" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-400" />
                </Link>
                <h1 className="text-3xl font-bold text-white">
                    {id && id !== 'new' ? 'Edit Board Theme' : 'New Board Theme'}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Config */}
                <div className="lg:col-span-2 space-y-6">
                    <form id="board-form" onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Theme Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Blue Minimalist, Red Digital..."
                                required
                            />
                        </div>

                        <div className="border-t border-gray-800 pt-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Display Toggles</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Toggle label="Show Timer" checked={formData.show_timer} onChange={(v) => setFormData({ ...formData, show_timer: v })} />
                                <Toggle label="Show Period" checked={formData.show_period} onChange={(v) => setFormData({ ...formData, show_period: v })} />
                                <Toggle label="Show Fouls" checked={formData.show_fouls} onChange={(v) => setFormData({ ...formData, show_fouls: v })} />
                                <Toggle label="Show Timeouts" checked={formData.show_timeouts} onChange={(v) => setFormData({ ...formData, show_timeouts: v })} />
                                <Toggle label="Show Players" checked={formData.show_players} onChange={(v) => setFormData({ ...formData, show_players: v })} />
                            </div>
                        </div>

                        <div className="border-t border-gray-800 pt-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Labels & Colors</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Label: Period</label>
                                    <input type="text" value={formData.label_period || ''} onChange={(e) => setFormData({ ...formData, label_period: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Label: Fouls</label>
                                    <input type="text" value={formData.label_fouls || ''} onChange={(e) => setFormData({ ...formData, label_fouls: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white" />
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Preview / Color Config */}
                <div className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Color Theme</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Background Color</label>
                                <div className="flex gap-2">
                                    <input type="color" value={formData.background_color} onChange={(e) => setFormData({ ...formData, background_color: e.target.value })} className="h-10 w-10 rounded cursor-pointer bg-transparent border-none" />
                                    <input type="text" value={formData.background_color} onChange={(e) => setFormData({ ...formData, background_color: e.target.value })} className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 text-white text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Text Color</label>
                                <div className="flex gap-2">
                                    <input type="color" value={formData.text_color} onChange={(e) => setFormData({ ...formData, text_color: e.target.value })} className="h-10 w-10 rounded cursor-pointer bg-transparent border-none" />
                                    <input type="text" value={formData.text_color} onChange={(e) => setFormData({ ...formData, text_color: e.target.value })} className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 text-white text-sm" />
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-800">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Home Team Tint</label>
                                <div className="flex gap-2">
                                    <input type="color" value={formData.primary_color_home} onChange={(e) => setFormData({ ...formData, primary_color_home: e.target.value })} className="h-10 w-10 rounded cursor-pointer bg-transparent border-none" />
                                    <input type="text" value={formData.primary_color_home} onChange={(e) => setFormData({ ...formData, primary_color_home: e.target.value })} className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 text-white text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Away Team Tint</label>
                                <div className="flex gap-2">
                                    <input type="color" value={formData.primary_color_away} onChange={(e) => setFormData({ ...formData, primary_color_away: e.target.value })} className="h-10 w-10 rounded cursor-pointer bg-transparent border-none" />
                                    <input type="text" value={formData.primary_color_away} onChange={(e) => setFormData({ ...formData, primary_color_away: e.target.value })} className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 text-white text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {id && id !== 'new' && (
                        <div className="flex flex-col gap-3">
                            <Link
                                href={`/admin/boards/${id}/design`}
                                className="w-full flex items-center justify-center gap-2 bg-purple-600/20 text-purple-400 px-4 py-3 rounded-lg hover:bg-purple-600/30 transition-colors border border-purple-900/50 font-medium"
                            >
                                <Edit size={18} />
                                Open Designer
                            </Link>
                            <Link
                                href={`/board/${id}?preview=true`}
                                target="_blank"
                                className="w-full flex items-center justify-center gap-2 bg-green-600/20 text-green-400 px-4 py-3 rounded-lg hover:bg-green-600/30 transition-colors border border-green-900/50 font-medium"
                            >
                                <Monitor size={18} />
                                Open Preview
                            </Link>
                        </div>
                    )}
                    <button
                        form="board-form"
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-blue-900/20"
                    >
                        <Save size={20} />
                        {loading ? 'Saving...' : 'Save Theme'}
                    </button>

                </div>
            </div>
        </div>
    );
}

function Toggle({ label, checked, onChange }: { label: string, checked?: boolean, onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group select-none">
            <div className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${checked ? 'bg-blue-600' : 'bg-gray-800'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={checked || false} onChange={(e) => onChange(e.target.checked)} />
            <span className="text-gray-300 group-hover:text-white transition-colors text-sm">{label}</span>
        </label>
    );
}
