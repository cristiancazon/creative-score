'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { useRouter } from 'next/navigation';
import { readMe } from '@directus/sdk';
import Link from 'next/link';
import { LayoutDashboard, Users, Trophy, Flag, LogOut, Swords } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();

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
        return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Checking access...</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-950 text-gray-100">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-800 bg-gray-900 flex flex-col fixed inset-y-0 z-20">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">Creative Score</h1>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-4">Management</div>
                    <Link href="/admin/sports" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
                        <Trophy size={20} />
                        Sports
                    </Link>
                    <Link href="/admin/teams" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
                        <Flag size={20} />
                        Teams
                    </Link>
                    <Link href="/admin/players" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
                        <Users size={20} />
                        Players
                    </Link>
                    <Link href="/admin/matches" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
                        <Swords size={20} />
                        Matches
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors">
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
