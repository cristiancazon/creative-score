'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { directus } from '@/lib/directus';
import { createItem, updateItem, readItem, readItems } from '@directus/sdk';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Match, Team, Sport } from '@/types/directus';

interface MatchFormProps {
    id?: string;
}

export default function MatchForm({ id }: MatchFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [sports, setSports] = useState<Sport[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    // Filtered teams based on selected sport
    const [availableTeams, setAvailableTeams] = useState<Team[]>([]);

    const [formData, setFormData] = useState<Partial<Match>>({
        sport: '',
        home_team: '',
        away_team: '',
        status: 'scheduled',
        start_time: new Date().toISOString().slice(0, 16), // datetime-local format
        home_score: 0,
        away_score: 0,
        timer_seconds: 0
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [sportsData, teamsData] = await Promise.all([
                    directus.request(readItems('sports')),
                    directus.request(readItems('teams'))
                ]);
                setSports(sportsData);
                setTeams(teamsData);

                if (id && id !== 'new') {
                    await fetchMatch(id);
                } else if (sportsData.length > 0) {
                    // Default sport
                    setFormData(prev => ({ ...prev, sport: sportsData[0].id }));
                }
            } catch (err) {
                console.error("Error loading data:", err);
            }
        };
        loadData();
    }, [id]);

    // Update available teams when selected sport changes
    useEffect(() => {
        if (formData.sport) {
            const sportId = typeof formData.sport === 'object' ? (formData.sport as Sport).id : formData.sport;
            const filtered = teams.filter(t => {
                const tSportId = typeof t.sport === 'object' ? (t.sport as Sport).id : t.sport;
                return tSportId === sportId;
            });
            setAvailableTeams(filtered);
        } else {
            setAvailableTeams([]);
        }
    }, [formData.sport, teams]);

    const fetchMatch = async (matchId: string) => {
        const data = await directus.request(readItem('matches', matchId));
        // Normalize IDs
        const sportId = typeof data.sport === 'object' && data.sport ? (data.sport as Sport).id : data.sport;
        const homeId = typeof data.home_team === 'object' && data.home_team ? (data.home_team as Team).id : data.home_team;
        const awayId = typeof data.away_team === 'object' && data.away_team ? (data.away_team as Team).id : data.away_team;

        // Format date for input
        let dateStr = data.start_time;
        if (dateStr && dateStr.length > 16) dateStr = dateStr.slice(0, 16);

        setFormData({
            ...data,
            sport: sportId as string,
            home_team: homeId as string,
            away_team: awayId as string,
            start_time: dateStr
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id && id !== 'new') {
                await directus.request(updateItem('matches', id, formData));
            } else {
                await directus.request(createItem('matches', formData));
            }
            router.push('/admin/matches');
            router.refresh();
        } catch (error) {
            console.error('Error saving match:', error);
            alert('Failed to save match');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/matches" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-400" />
                </Link>
                <h1 className="text-3xl font-bold text-white">
                    {id && id !== 'new' ? 'Edit Match' : 'New Match'}
                </h1>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Sport Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Sport</label>
                        <select
                            value={formData.sport as string}
                            onChange={(e) => setFormData({ ...formData, sport: e.target.value, home_team: '', away_team: '' })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="" disabled>Select Sport</option>
                            {sports.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Teams */}
                    <div className="grid grid-cols-2 gap-8 p-6 bg-gray-950/50 rounded-xl border border-gray-800/50">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2 text-center uppercase tracking-wider">Home Team</label>
                            <select
                                value={formData.home_team as string}
                                onChange={(e) => setFormData({ ...formData, home_team: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="" disabled>Select Home</option>
                                {availableTeams.map(t => (
                                    <option key={t.id} value={t.id} disabled={t.id === formData.away_team}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-center text-gray-600 font-black text-2xl pt-6">VS</div>

                        <div>
                            <label className="block text-sm font-bold text-white mb-2 text-center uppercase tracking-wider">Away Team</label>
                            <select
                                value={formData.away_team as string}
                                onChange={(e) => setFormData({ ...formData, away_team: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="" disabled>Select Away</option>
                                {availableTeams.map(t => (
                                    <option key={t.id} value={t.id} disabled={t.id === formData.home_team}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Start Time</label>
                            <input
                                type="datetime-local"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Initial Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="scheduled">Scheduled</option>
                                <option value="live">Live</option>
                                <option value="paused">Paused</option>
                                <option value="finished">Finished</option>
                            </select>
                        </div>
                    </div>

                    {/* Initial Scores (Hidden for new mostly, but useful for edits) */}
                    {(id && id !== 'new') && (
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Home Score</label>
                                <input
                                    type="number"
                                    value={formData.home_score}
                                    onChange={(e) => setFormData({ ...formData, home_score: parseInt(e.target.value) })}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Away Score</label>
                                <input
                                    type="number"
                                    value={formData.away_score}
                                    onChange={(e) => setFormData({ ...formData, away_score: parseInt(e.target.value) })}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium ml-auto transition-colors"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Match'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
