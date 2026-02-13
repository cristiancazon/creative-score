'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ matches: 0, live: 0, teams: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const matches = await directus.request(readItems('matches', { limit: -1, fields: ['status'] }));
                const teams = await directus.request(readItems('teams', { limit: -1, fields: ['id'] }));

                setStats({
                    matches: matches.length,
                    live: matches.filter((m: any) => m.status === 'live').length,
                    teams: teams.length
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Matches</div>
                    <div className="text-4xl font-bold text-white">{stats.matches}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Live Now</div>
                    <div className="text-4xl font-bold text-green-400">{stats.live}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Registered Teams</div>
                    <div className="text-4xl font-bold text-blue-400">{stats.teams}</div>
                </motion.div>
            </div>

            <div className="mt-12 p-8 bg-gray-900 rounded-2xl border border-gray-800 text-center">
                <h2 className="text-xl font-semibold mb-4 text-gray-300">Welcome to Creative Score Admin</h2>
                <p className="text-gray-500 max-w-lg mx-auto">Select a module from the sidebar to manage your sports data. You can create new matches, manage teams, or configure sport rules.</p>
            </div>
        </div>
    );
}
