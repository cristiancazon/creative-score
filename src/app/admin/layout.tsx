'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { useRouter } from 'next/navigation';
import { readMe } from '@directus/sdk';
import Link from 'next/link';
import { LayoutDashboard, Users, Trophy, Flag, LogOut, Swords, ChevronLeft, ChevronRight, Moon, Sun, Monitor, MessageSquare, Video } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [authorized, setAuthorized] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Initialize theme
        if (typeof window !== 'undefined') {
            document.documentElement.classList.add('dark');
        }
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
        <div className={`flex min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300`}>
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-20'} border-r border-gray-800 bg-gray-900/50 backdrop-blur-xl flex flex-col fixed inset-y-0 z-20 transition-all duration-300`}
            >
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    {sidebarOpen && (
                        <div>
                            <h1 className="text-xl font-bold font-sans tracking-tight">Creative Score</h1>
                            <p className="text-xs text-gray-500">Admin Panel</p>
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
                </nav>

                <div className="p-4 border-t border-gray-800 space-y-2">
                    <button
                        onClick={toggleTheme}
                        className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-gray-800 text-gray-400 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
                        title="Toggle Theme"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        {sidebarOpen && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>

                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span>Sign Out</span>}
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
    return (
        <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors ${!isOpen ? 'justify-center' : ''}`} title={label}>
            {icon}
            {isOpen && <span className="whitespace-nowrap">{label}</span>}
        </Link>
    );
}
