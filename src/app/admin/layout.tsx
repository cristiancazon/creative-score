'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { useRouter, usePathname } from 'next/navigation';
import { readMe } from '@directus/sdk';
import Link from 'next/link';
import { LayoutDashboard, Users, Trophy, Flag, LogOut, Swords, ChevronLeft, ChevronRight, Moon, Sun, Monitor, MessageSquare, Video, Download } from 'lucide-react';
import { Lexend } from 'next/font/google';
import './admin.css';


const lexend = Lexend({ subsets: ['latin'] });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [authorized, setAuthorized] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Initialize theme
        if (typeof window !== 'undefined') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('admin-page');
        }
        return () => {
            if (typeof window !== 'undefined') {
                document.body.classList.remove('admin-page');
            }
        };
    }, []);


    const toggleTheme = () => {
        setDarkMode(!darkMode);
        if (darkMode) {
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await directus.getToken();
                console.log("[AdminLayout] Checking auth, token:", token);

                if (!token) {
                    console.log("[AdminLayout] No token found. Redirecting to login.");
                    router.push('/login');
                    return;
                }

                // Try to fetch current user
                await directus.request(readMe());
                console.log("[AdminLayout] User authorized");
                setAuthorized(true);
            } catch (err) {
                console.error("[AdminLayout] Auth check failed:", err);
                // If fails, redirect to login
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);



    const handleLogout = async () => {
        try {
            await directus.logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            // Force local cleanup
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem('creative_score_cms_token');
            }
            router.push('/login');
        }
    };

    if (!authorized) {
        return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-gray-500">Checking access...</div>;
    }

    return (
        <div className={`${lexend.className} flex min-h-screen bg-slate-50 dark:bg-[#060e20] text-slate-800 dark:text-slate-100 transition-colors duration-300`}>
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-20'} border-r border-slate-200 dark:border-slate-800/20 bg-white/75 dark:bg-slate-950/60 backdrop-blur-xl flex flex-col fixed inset-y-0 z-20 transition-all duration-300`}
            >
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    {sidebarOpen && (
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Creative Score</h1>
                            <p className="text-xs text-slate-500 font-medium">Admin Panel</p>
                        </div>
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-800 rounded text-gray-400">
                        {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavItem href="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" isOpen={sidebarOpen} />

                    {sidebarOpen && <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-4 transition-opacity duration-300">Management</div>}
                    {!sidebarOpen && <div className="h-6 mt-6 mb-2" />}

                    <NavItem href="/admin/sports" icon={<Trophy size={20} />} label="Sports" isOpen={sidebarOpen} />
                    <NavItem href="/admin/teams" icon={<Flag size={20} />} label="Teams" isOpen={sidebarOpen} />
                    <NavItem href="/admin/players" icon={<Users size={20} />} label="Players" isOpen={sidebarOpen} />
                    <NavItem href="/admin/matches" icon={<Swords size={20} />} label="Matches" isOpen={sidebarOpen} />
                    <NavItem href="/admin/boards" icon={<Monitor size={20} />} label="Boards" isOpen={sidebarOpen} />

                    {sidebarOpen && <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-4 transition-opacity duration-300">Ads & Media</div>}
                    {!sidebarOpen && <div className="h-6 mt-6 mb-2" />}

                    <NavItem href="/admin/text-ads" icon={<MessageSquare size={20} />} label="Text Ads" isOpen={sidebarOpen} />
                    <NavItem href="/admin/video-ads" icon={<Video size={20} />} label="Video Ads" isOpen={sidebarOpen} />

                    {sidebarOpen && <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-4 transition-opacity duration-300">Resources</div>}
                    {!sidebarOpen && <div className="h-6 mt-6 mb-2" />}
                    <a href="/downloads/CreativeScoreMX_v1.2.1.lplug4" download className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-green-400 hover:text-green-300 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`} title="Download Logi Plugin v1.2.1">
                        <Download size={20} />
                        {sidebarOpen && <span className="whitespace-nowrap font-semibold">Get MX Plugin v1.2.1</span>}
                    </a>
                </nav>

                <div className="p-4 border-t border-cyan-500/10 space-y-2">
                    <button
                        onClick={toggleTheme}
                        className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-gray-800 text-gray-400 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
                        title="Toggle Theme"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        {sidebarOpen && <span className="text-sm font-label uppercase tracking-wider">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>


                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span className="text-sm font-label uppercase tracking-wider">Sign Out</span>}
                    </button>

                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {children}
            </main>
        </div>
    );
}

function NavItem({ href, icon, label, isOpen }: { href: string, icon: React.ReactNode, label: string, isOpen: boolean }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-cyan-400/10 text-cyan-400 border-r-2 border-cyan-400 active-nav-glow font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-100'} ${!isOpen ? 'justify-center' : ''}`} title={label}>
            <span className={`${isActive ? 'text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>{icon}</span>
            {isOpen && <span className="whitespace-nowrap font-label uppercase tracking-wider text-sm">{label}</span>}
        </Link>
    );
}
