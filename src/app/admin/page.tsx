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
        <div className="space-y-8">
            {/* Welcome Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-[#091328]/60 backdrop-blur-md min-h-[160px] flex items-center px-10 border border-slate-800/20">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 to-transparent"></div>
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-l from-cyan-400/40 to-transparent blur-3xl rounded-full translate-x-1/2"></div>
                </div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-extrabold font-headline tracking-tight text-slate-100 mb-2">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Admin!</span>
                    </h2>
                    <p className="text-slate-400 font-body">Manage your sports ecosystem and review live scores at a glance.</p>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="glass-card p-6 rounded-3xl flex items-center gap-5 group hover:bg-[#192540]/40 transition-all cursor-default"
                >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 21h-5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"></path><path d="M11 18h2"></path></svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">Total Matches</p>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold font-headline">{stats.matches}</span>
                            <span className="text-xs text-emerald-400 font-medium flex items-center">+3%</span>
                        </div>
                    </div>
                </motion.div>

                {/* Card 2 */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-3xl flex items-center gap-5 group hover:bg-[#192540]/40 transition-all cursor-default relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4">
                        <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">Live Now</p>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold font-headline text-emerald-400">{stats.live}</span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter">Active</span>
                        </div>
                    </div>
                </motion.div>

                {/* Card 3 */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-3xl flex items-center gap-5 group hover:bg-[#192540]/40 transition-all cursor-default"
                >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">Registered Teams</p>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold font-headline text-cyan-400">{stats.teams}</span>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Dashboard Widgets Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Card or Summary */}
                <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden flex flex-col p-6">
                    <div className="border-b border-slate-800/20 flex justify-between items-center pb-4 mb-4">
                        <h3 className="text-xl font-bold font-headline">Recent Activity</h3>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                        <p>Detailed module logs and upcoming matches will be listed here.</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card rounded-3xl p-6 flex flex-col">
                    <h3 className="text-xl font-bold font-headline mb-6">Quick Actions</h3>
                    <div className="space-y-4 flex-1">
                        <a href="/admin/matches" className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-800/40 hover:-translate-y-1 transition-all group border border-slate-800/10">
                            <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-400 group-hover:text-slate-900 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">Create Match</p>
                                p<span className="text-[11px] text-slate-400">Schedule a new sports event</span>
                            </div>
                        </a>
                        <a href="/admin/boards" className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-800/40 hover:-translate-y-1 transition-all group border border-slate-800/10">
                            <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-400 group-hover:text-slate-900 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">Manage Boards</p>
                                <p className="text-[11px] text-slate-400">Configure active scoreboards</p>
                            </div>
                        </a>
                        <a href="/admin/text-ads" className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-800/40 hover:-translate-y-1 transition-all group border border-slate-800/10">
                            <div className="w-12 h-12 rounded-xl bg-orange-400/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-400 group-hover:text-slate-900 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">Deploy Ad</p>
                                <p className="text-[11px] text-slate-400">Publish media to displays</p>
                            </div>
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}

