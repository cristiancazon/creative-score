'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Video } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ matches: 0, live: 0, teams: 0 });
    const [ads, setAds] = useState<any[]>([]);
    const [loadingAds, setLoadingAds] = useState(true);

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

                const adsData = await directus.request(readItems('video_ads' as any, {
                    fields: ['*', 'match.home_team.name', 'match.away_team.name'] as any,
                    limit: 5
                }));
                setAds(adsData as any);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingAds(false);
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
                    <h2 className="text-4xl font-extrabold font-headline tracking-tight text-slate-800 dark:text-slate-100 mb-2">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400">Admin!</span>
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 21h-5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"></path><path d="M11 18h2"></path></svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">Total Matches</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold font-headline">{stats.matches}</span>
                                <span className="text-xs text-emerald-500 font-medium flex items-center">+3%</span>
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
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

            {/* Dashboard Widgets Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Video Ads Card */}
                <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden flex flex-col p-6">
                    <div className="border-b border-slate-200 dark:border-slate-800/20 flex justify-between items-center pb-4 mb-4">
                        <h3 className="text-xl font-bold font-headline">Video Ads</h3>
                        <Link href="/admin/video-ads" className="text-xs text-cyan-500 hover:text-cyan-400 font-bold flex items-center gap-1">
                            View All <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        {loadingAds ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading ads...</div>
                        ) : ads.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No video ads active.</div>
                        ) : (
                            <table className="w-full text-left text-slate-300">
                                <thead className="text-slate-600 dark:text-slate-500 uppercase text-xs">
                                    <tr>
                                        <th className="pb-3 pr-4 font-bold">Video</th>
                                        <th className="pb-3 px-4 font-bold">Match</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/5 dark:divide-slate-800/20">
                                    {ads.map((ad: any) => (
                                        <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-[#192540]/20 transition-colors">
                                            <td className="py-3 pr-4 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                                    <Video size={14} />
                                                </div>
                                                <span className="truncate max-w-[150px] text-xs font-mono">{ad.video}</span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-sm font-medium">
                                                {ad.match && typeof ad.match === 'object' && ad.match.home_team ? (
                                                    <span>{ad.match.home_team.name} <span className="text-slate-400 dark:text-slate-600 text-xs">vs</span> {ad.match.away_team.name}</span>
                                                ) : (
                                                    <span className="italic text-xs text-slate-400">No match assigned</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card rounded-3xl p-6 flex flex-col">
                    <h3 className="text-xl font-bold font-headline mb-6">Quick Actions</h3>
                    <div className="space-y-4 flex-1">
                        <a href="/admin/matches" className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:-translate-y-1 transition-all group border border-slate-100 dark:border-slate-800/10">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white dark:group-hover:text-slate-900 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">Create Match</p>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">Schedule a new sports event</span>
                            </div>
                        </a>
                        <a href="/admin/boards" className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:-translate-y-1 transition-all group border border-slate-100 dark:border-slate-800/10">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white dark:group-hover:text-slate-900 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">Manage Boards</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure active scoreboards</p>
                            </div>
                        </a>
                        <a href="/admin/text-ads" className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:-translate-y-1 transition-all group border border-slate-100 dark:border-slate-800/10">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white dark:group-hover:text-slate-900 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">Deploy Ad</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Publish media to displays</p>
                            </div>
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}

