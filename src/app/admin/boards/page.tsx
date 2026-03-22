'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItems, deleteItem } from '@directus/sdk';
import Link from 'next/link';
import { Plus, Monitor, Edit, Trash, Settings, ArrowRight } from 'lucide-react';
import { Board } from '@/types/directus';

export default function BoardsPage() {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBoards = async () => {
        try {
            const data = await directus.request(readItems('boards', {
                fields: ['*', 'active_match.home_team.name', 'active_match.away_team.name'] as any
            }));
            // @ts-ignore
            setBoards(data);
        } catch (error) {
            console.error("Error fetching boards:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoards();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this board?')) return;
        try {
            await directus.request(deleteItem('boards', id));
            fetchBoards();
        } catch (error) {
            console.error("Error deleting board:", error);
            alert("Error deleting board");
        }
    };

    if (loading) {
        return <div className="text-slate-400 font-medium p-8">Loading boards...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Display Boards</h1>
                    <p className="text-slate-400 text-sm">Manage screens and their specific configurations</p>
                </div>
                <Link href="/admin/boards/new" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 font-semibold shadow-[0_0_20px_rgba(0,206,209,0.1)] hover:shadow-[0_0_25px_rgba(0,206,209,0.2)]">
                    <Plus size={20} />
                    New Board
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {boards.map((board) => (
                    <div key={board.id} className="glass-card rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)] transition-all duration-300 group flex flex-col justify-between">

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(0,206,209,0.1)]">
                                    <Monitor size={24} className="text-cyan-400" />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <Link href={`/admin/boards/${board.id}`} className="p-2 hover:bg-cyan-500/10 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors">
                                        <Edit size={18} />
                                    </Link>
                                    <button onClick={() => handleDelete(board.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{board.name}</h3>

                            <div className="mb-6">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Currently Showing</span>
                                <div className="text-slate-300 mt-1 flex items-center gap-2 font-medium">
                                    {(board as any).active_match ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                            {/* @ts-ignore */}
                                            <span className="text-cyan-400">{(board.active_match as any).home_team?.name}</span> <span className="text-slate-500 text-xs">vs</span> <span className="text-cyan-400">{(board.active_match as any).away_team?.name}</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-600 italic text-sm">No active match</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-400 border-t border-cyan-500/5 pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full border border-cyan-500/20 shadow-[0_0_5px_rgba(0,206,209,0.1)]" style={{ backgroundColor: board.background_color }}></div>
                                    <span className="text-xs">Bg Color</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                    <span className={board.show_timer ? 'text-green-400' : 'text-slate-500'}>{board.show_timer ? '✓' : '✗'}</span>
                                    <span>Timer</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#0e1726]/40 p-4 border-t border-cyan-500/10 flex justify-between items-center mt-auto">
                            <Link
                                href={`/board/${board.id}?preview=true`}
                                target="_blank"
                                className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-2 transition-colors group/link"
                            >
                                Open Preview 
                                <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                ))}

                {boards.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-500 bg-[#0c1629]/40 backdrop-blur-xl rounded-2xl border border-dashed border-cyan-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                        <Monitor size={48} className="mx-auto mb-4 text-cyan-500/40" />
                        <p className="font-medium text-slate-300">No boards configured yet.</p>
                        <Link href="/admin/boards/new" className="text-cyan-400 hover:text-cyan-300 font-semibold mt-2 inline-block transition-colors">Create your first board</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

