'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItems, readMe } from '@directus/sdk';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Video, Type, Swords, Monitor, Users, Flag } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ matches: 0, live: 0, teams: 0 });
    const [userEmail, setUserEmail] = useState<string>("Admin");

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

                const currentUser = await directus.request(readMe());
                if (currentUser && currentUser.email) {
                    setUserEmail(currentUser.email);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-slate-100 dark:bg-[#091328]/60 backdrop-blur-md min-h-[160px] flex items-center px-10 border border-slate-200 dark:border-slate-800/20">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 dark:from-cyan-900/20 to-transparent"></div>
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-l from-cyan-400/40 to-transparent blur-3xl rounded-full translate-x-1/2"></div>
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-slate-800 dark:text-slate-100 mb-2 truncate max-w-2xl">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400">{userEmail}</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-body">Manage your sports ecosystem and review live scores at a glance.</p>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1 - Matches */}
                <Link href="/admin/matches" className="block">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="glass-card p-6 rounded-3xl flex items-center gap-5 group hover:bg-slate-50 dark:hover:bg-[#192540]/40 transition-all cursor-pointer border border-transparent hover:border-cyan-500/20"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                            <Swords size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">Total Matches</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold font-headline">{stats.matches}</span>
                            </div>
                        </div>
                    </motion.div>
                </Link>

                {/* Card 2 - Teams */}
                <Link href="/admin/teams" className="block">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6 rounded-3xl flex items-center gap-5 group hover:bg-slate-50 dark:hover:bg-[#192540]/40 transition-all cursor-pointer border border-transparent hover:border-cyan-500/20"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                            <Flag size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">Registered Teams</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold font-headline text-cyan-600 dark:text-cyan-400">{stats.teams}</span>
                            </div>
                        </div>
                    </motion.div>
                </Link>
            </section>

            {/* Direct Access Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                
                {/* Matches & Boards Access */}
                <Link href="/admin/matches">
                    <div className="glass-card rounded-3xl p-6 h-full flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-[#192540]/40 transition-all group border border-transparent hover:border-cyan-500/20 cursor-pointer text-slate-800 dark:text-slate-100">
                        <div className="w-16 h-16 mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <Swords size={28} />
                        </div>
                        <h3 className="text-lg font-bold font-headline group-hover:text-blue-500 transition-colors">Matches</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Manage live scorings and events</p>
                    </div>
                </Link>

                <Link href="/admin/boards">
                    <div className="glass-card rounded-3xl p-6 h-full flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-[#192540]/40 transition-all group border border-transparent hover:border-cyan-500/20 cursor-pointer text-slate-800 dark:text-slate-100">
                        <div className="w-16 h-16 mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                            <Monitor size={28} />
                        </div>
                        <h3 className="text-lg font-bold font-headline group-hover:text-purple-500 transition-colors">Scoreboards</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Configure active display boards</p>
                    </div>
                </Link>

                {/* Teams & Players Combined Box */}
                <div className="glass-card rounded-3xl p-6 h-full flex flex-col border border-transparent hover:border-cyan-500/20 transition-all text-slate-800 dark:text-slate-100">
                    <h3 className="text-lg font-bold font-headline mb-4 text-center">Roster Management</h3>
                    <div className="flex flex-col gap-3 flex-1 justify-center">
                        <Link href="/admin/teams" className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 p-2 rounded-lg"><Flag size={20} /></div>
                            <span className="font-semibold text-sm">Teams Directory</span>
                        </Link>
                        <Link href="/admin/players" className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="bg-amber-500/20 text-amber-500 dark:text-amber-400 p-2 rounded-lg"><Users size={20} /></div>
                            <span className="font-semibold text-sm">Players Database</span>
                        </Link>
                    </div>
                </div>

                {/* Ads Section */}
                <Link href="/admin/text-ads">
                    <div className="glass-card rounded-3xl p-6 h-full flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-[#192540]/40 transition-all group border border-transparent hover:border-cyan-500/20 cursor-pointer text-slate-800 dark:text-slate-100">
                        <div className="w-16 h-16 mb-4 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                            <Type size={28} />
                        </div>
                        <h3 className="text-lg font-bold font-headline group-hover:text-orange-500 transition-colors">Text Ads</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Manage scrolling text banners</p>
                    </div>
                </Link>

                <Link href="/admin/video-ads">
                    <div className="glass-card rounded-3xl p-6 h-full flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-[#192540]/40 transition-all group border border-transparent hover:border-cyan-500/20 cursor-pointer text-slate-800 dark:text-slate-100">
                        <div className="w-16 h-16 mb-4 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                            <Video size={28} />
                        </div>
                        <h3 className="text-lg font-bold font-headline group-hover:text-rose-500 transition-colors">Video Ads</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Manage full-screen video ads</p>
                    </div>
                </Link>

            </section>
        </div>
    );
}
