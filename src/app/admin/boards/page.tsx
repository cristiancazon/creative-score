'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import { readItems, deleteItem } from '@directus/sdk';
import Link from 'next/link';
import { Plus, Monitor, Edit, Trash, Settings } from 'lucide-react';
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
        return <div className="text-white">Loading boards...</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Display Boards</h1>
                    <p className="text-gray-400">Manage screens and their specific configurations</p>
                </div>
                <Link href="/admin/boards/new" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Plus size={20} />
                    New Board
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {boards.map((board) => (
                    <div key={board.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gray-800 rounded-lg">
                                    <Monitor size={24} className="text-blue-400" />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/admin/boards/${board.id}`} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white">
                                        <Edit size={18} />
                                    </Link>
                                    <button onClick={() => handleDelete(board.id)} className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-400">
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{board.name}</h3>

                            <div className="mb-6">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Currently Showing</span>
                                <div className="text-gray-300 mt-1 flex items-center gap-2">
                                    {(board as any).active_match ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            {/* @ts-ignore */}
                                            {(board.active_match as any).home_team?.name} vs {(board.active_match as any).away_team?.name}
                                        </>
                                    ) : (
                                        <span className="text-gray-600 italic">No active match</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full border border-gray-700" style={{ backgroundColor: board.background_color }}></div>
                                    Bg Color
                                </div>
                                <div>
                                    {board.show_timer ? '✓' : '✗'} Timer
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-950 p-4 border-t border-gray-800 flex justify-between items-center">
                            <Link
                                href={`/board/${board.id}?preview=true`}
                                target="_blank"
                                className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-2"
                            >
                                Open Preview <ArrowRightIcon />
                            </Link>
                        </div>
                    </div>
                ))}

                {boards.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
                        <Monitor size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No boards configured yet.</p>
                        <Link href="/admin/boards/new" className="text-blue-400 hover:underline mt-2 inline-block">Create your first board</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

function ArrowRightIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
    )
}
