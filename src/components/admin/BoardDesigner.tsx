'use client';

import { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { directus } from '@/lib/directus';
import { readItem, updateItem } from '@directus/sdk';
import { Loader2, Plus, Save, Type, Monitor, Image as ImageIcon, Box, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BoardElement {
    id: string;
    type: 'timer' | 'period' | 'score_home' | 'score_away' | 'name_home' | 'name_away' | 'fouls_home' | 'fouls_away' | 'timeouts_home' | 'timeouts_away' | 'players_home' | 'players_away' | 'text' | 'box';
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    style: React.CSSProperties;
    content?: string; // For text elements
    label?: string; // For adding custom labels
}

interface BoardDesignerProps {
    boardId: string;
}

const DEFAULT_CANVAS_WIDTH = 640;
const DEFAULT_CANVAS_HEIGHT = 360;

export default function BoardDesigner({ boardId }: BoardDesignerProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [elements, setElements] = useState<BoardElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [canvasScale, setCanvasScale] = useState(0.5);
    const [background, setBackground] = useState({
        type: 'solid', // solid, gradient_2, gradient_3
        colors: ['#000000', '#1a1a1a', '#333333'],
        direction: 'to bottom right'
    });
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const loadBoard = async () => {
            try {
                const data = await directus.request(readItem('boards', boardId));
                if (data.layout && data.layout.elements) {
                    setElements(data.layout.elements);
                    if (data.layout.canvas?.background) {
                        setBackground(data.layout.canvas.background);
                    }
                } else {
                    // Initialize with default elements if empty
                    initializeDefaults();
                }
            } catch (error) {
                console.error("Error loading board:", error);
            } finally {
                setLoading(false);
            }
        };
        loadBoard();

        // Auto-fit canvas
        const handleResize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                const scaleX = (width - 64) / DEFAULT_CANVAS_WIDTH; // 64px padding
                const scaleY = (height - 64) / DEFAULT_CANVAS_HEIGHT;
                // Allow scaling UP (zoom in) for low-res boards on high-res screens
                setCanvasScale(Math.min(scaleX, scaleY, 10.0));
            }
        };
        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 100); // Delay to ensure container is rendered
        return () => window.removeEventListener('resize', handleResize);

    }, [boardId]);

    const initializeDefaults = () => {
        setElements([
            {
                id: 'timer-main',
                type: 'timer',
                x: 800, y: 50, width: 320, height: 150, zIndex: 10,
                style: { fontSize: '80px', fontWeight: 'bold', color: '#ffffff', textAlign: 'center', fontFamily: 'monospace' }
            },
            {
                id: 'score-home',
                type: 'score_home',
                x: 200, y: 300, width: 300, height: 300, zIndex: 5,
                style: { fontSize: '150px', fontWeight: 'bold', color: '#ff0000', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
            },
            {
                id: 'score-away',
                type: 'score_away',
                x: 1420, y: 300, width: 300, height: 300, zIndex: 5,
                style: { fontSize: '150px', fontWeight: 'bold', color: '#0000ff', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
            }
        ]);
    };

    const addElement = (type: BoardElement['type']) => {
        const newEl: BoardElement = {
            id: `${type}-${Date.now()}`,
            type,
            x: DEFAULT_CANVAS_WIDTH / 2 - 100,
            y: DEFAULT_CANVAS_HEIGHT / 2 - 50,
            width: 200,
            height: 100,
            zIndex: elements.length + 1,
            style: { color: '#ffffff', fontSize: '32px', textAlign: 'center' },
            content: type === 'text' ? 'NEW TEXT' : undefined
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
    };

    const updateElement = (id: string, updates: Partial<BoardElement>) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const updateElementStyle = (id: string, styleUpdates: React.CSSProperties) => {
        setElements(elements.map(el => el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el));
    };

    const deleteElement = (id: string) => {
        setElements(elements.filter(el => el.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await directus.request(updateItem('boards', boardId, {
                layout: {
                    canvas: {
                        width: DEFAULT_CANVAS_WIDTH,
                        height: DEFAULT_CANVAS_HEIGHT,
                        background
                    },
                    elements
                }
            }));
            alert('Layout saved successfully!');
        } catch (error) {
            console.error("Error saving:", error);
            alert('Failed to save layout');
        } finally {
            setLoading(false);
        }
    };

    const getBackgroundStyle = () => {
        if (background.type === 'solid') return { backgroundColor: background.colors[0] };
        if (background.type === 'gradient_2') return { backgroundImage: `linear-gradient(${background.direction}, ${background.colors[0]}, ${background.colors[1]})` };
        if (background.type === 'gradient_3') return { backgroundImage: `linear-gradient(${background.direction}, ${background.colors[0]}, ${background.colors[1]}, ${background.colors[2]})` };
        return { backgroundColor: '#000000' };
    };

    const handleCleanBoard = () => {
        if (confirm('Are you sure you want to clean the board? This will remove all elements.')) {
            setElements([]);
            setSelectedId(null);
        }
    };

    const renderPreviewContent = (el: BoardElement) => {
        switch (el.type) {
            case 'timer': return "12:00";
            case 'period': return "1";
            case 'score_home': return "88";
            case 'score_away': return "76";
            case 'name_home': return "HOME TEAM";
            case 'name_away': return "AWAY TEAM";
            case 'fouls_home': return "3";
            case 'fouls_away': return "2";
            case 'timeouts_home': return "•••";
            case 'timeouts_away': return "••";
            case 'players_home': return (
                <div className="text-xs w-full">
                    <div className="flex justify-between border-b border-white/20 pb-1 mb-1"><span>#23 James</span><span>12pts</span></div>
                    <div className="flex justify-between border-b border-white/20 pb-1 mb-1"><span>#3 Davis</span><span>8pts</span></div>
                    <div className="flex justify-between opacity-50"><span>#1 Russell</span><span>5pts</span></div>
                </div>
            );
            case 'players_away': return (
                <div className="text-xs w-full">
                    <div className="flex justify-between border-b border-white/20 pb-1 mb-1"><span>#0 Tatum</span><span>15pts</span></div>
                    <div className="flex justify-between border-b border-white/20 pb-1 mb-1"><span>#7 Brown</span><span>10pts</span></div>
                    <div className="flex justify-between opacity-50"><span>#4 Holiday</span><span>2pts</span></div>
                </div>
            );
            case 'text': return el.content || "Text";
            case 'box': return "";
            default: return el.type;
        }
    };

    const selectedElement = elements.find(el => el.id === selectedId);

    if (loading && elements.length === 0) return <div className="text-white flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex h-screen bg-gray-950 text-white overflow-hidden">

            {/* TOOLBAR */}
            <div className="w-64 flex flex-col py-4 bg-gray-900 border-r border-gray-800 z-20 overflow-y-auto shrink-0 transition-all duration-300">
                <div className="px-4 mb-2">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Widgets</div>
                </div>

                <div className="flex flex-col gap-2 px-4">
                    <button onClick={() => addElement('timer')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-blue-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-gray-700">
                        <Monitor size={18} /> Timer
                    </button>
                    <button onClick={() => addElement('period')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-blue-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-gray-700">
                        <span className="font-mono text-xs border border-current px-1 rounded">1</span> Period
                    </button>
                    <button onClick={() => addElement('text')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-blue-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-gray-700">
                        <Type size={18} /> Text Label
                    </button>
                    <button onClick={() => addElement('box')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-blue-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-gray-700">
                        <Box size={18} /> Shape / Box
                    </button>

                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 mb-1">Home Team</div>
                    <button onClick={() => addElement('score_home')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-red-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-red-900/30">
                        <div className="w-5 h-5 rounded bg-red-500/20 text-red-500 flex items-center justify-center text-[10px] font-bold">H</div>
                        Home Score
                    </button>
                    <button onClick={() => addElement('name_home')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-red-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-red-900/30">
                        <Type size={18} className="text-red-500" /> Team Name
                    </button>
                    <button onClick={() => addElement('fouls_home')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-red-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-red-900/30">
                        <span className="text-red-500 font-bold text-xs">F</span> Fouls
                    </button>
                    <button onClick={() => addElement('timeouts_home')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-red-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-red-900/30">
                        <span className="text-red-500 font-bold text-xs">T.O</span> Timeouts
                    </button>
                    <button onClick={() => addElement('players_home')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-red-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-red-900/30">
                        <div className="flex flex-col gap-0.5"><div className="w-3 h-0.5 bg-red-500/50"></div><div className="w-3 h-0.5 bg-red-500/50"></div></div>
                        Player List
                    </button>

                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 mb-1">Away Team</div>
                    <button onClick={() => addElement('score_away')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-blue-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-blue-900/30">
                        <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-bold">A</div>
                        Away Score
                    </button>
                    <button onClick={() => addElement('name_away')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-blue-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-blue-900/30">
                        <Type size={18} className="text-blue-500" /> Team Name
                    </button>
                    <button onClick={() => addElement('fouls_away')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-blue-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-blue-900/30">
                        <span className="text-blue-500 font-bold text-xs">F</span> Fouls
                    </button>
                    <button onClick={() => addElement('timeouts_away')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-blue-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-blue-900/30">
                        <span className="text-blue-500 font-bold text-xs">T.O</span> Timeouts
                    </button>
                    <button onClick={() => addElement('players_away')} className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg hover:text-blue-400 transition text-sm font-medium text-gray-300 border border-transparent hover:border-blue-900/30">
                        <div className="flex flex-col gap-0.5"><div className="w-3 h-0.5 bg-blue-500/50"></div><div className="w-3 h-0.5 bg-blue-500/50"></div></div>
                        Player List
                    </button>
                </div>

                <div className="flex-1" />
                <div className="p-4 border-t border-gray-800 mt-2">
                    <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-500 rounded-lg transition shadow-lg shadow-green-900/20 font-bold text-white">
                        <Save size={18} /> Save Layout
                    </button>
                </div>
            </div>

            {/* CANVAS AREA */}
            <div className="flex-1 relative overflow-hidden bg-zinc-950 flex items-center justify-center" ref={containerRef}>
                <div
                    className="bg-black shadow-2xl relative border border-white/5"
                    style={{
                        width: DEFAULT_CANVAS_WIDTH,
                        height: DEFAULT_CANVAS_HEIGHT,
                        transform: `scale(${canvasScale})`,
                        transformOrigin: 'center center',
                        ...getBackgroundStyle(),
                        backgroundSize: 'cover'
                    }}
                    onClick={() => setSelectedId(null)}
                >
                    {/* Grid Overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
                            `,
                            backgroundSize: '40px 40px'
                        }}
                    />

                    {/* Center Lines */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500/50 -translate-x-1/2 pointer-events-none z-0 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-blue-500/50 -translate-y-1/2 pointer-events-none z-0 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>

                    {elements.map(el => (
                        <Rnd
                            key={el.id}
                            scale={canvasScale}
                            size={{ width: el.width, height: el.height }}
                            position={{ x: el.x, y: el.y }}
                            onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                            onResizeStop={(e, direction, ref, delta, position) => {
                                updateElement(el.id, {
                                    width: parseInt(ref.style.width),
                                    height: parseInt(ref.style.height),
                                    ...position,
                                });
                            }}
                            bounds="parent"
                            onClick={(e: any) => {
                                e.stopPropagation();
                                setSelectedId(el.id);
                            }}
                            className={`border ${selectedId === el.id ? 'border-2 border-blue-500 z-50' : 'border-transparent hover:border-white/20'}`}
                            style={{ ...el.style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            lockAspectRatio={false}
                        >
                            {renderPreviewContent(el)}
                        </Rnd>
                    ))}
                </div>

                {/* Scale Info */}
                <div className="absolute bottom-4 left-4 bg-black/50 text-xs px-2 py-1 rounded">
                    Scale: {(canvasScale * 100).toFixed(0)}%
                </div>
            </div>

            {/* PROPERTIES PANEL */}
            <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-20">
                <div className="p-4 border-b border-gray-800 uppercase text-xs font-bold tracking-widest text-gray-500">
                    {selectedElement ? 'Element Properties' : 'Board Properties'}
                </div>

                {selectedElement ? (
                    <div className="p-4 space-y-6 overflow-y-auto flex-1">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Type</label>
                            <div className="text-white font-mono bg-gray-950 px-2 py-1 rounded">{selectedElement.type}</div>
                        </div>

                        {selectedElement.type === 'text' && (
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Content</label>
                                <input
                                    type="text"
                                    value={selectedElement.content || ''}
                                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                                    className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white"
                                />
                            </div>
                        )}

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 mt-4 border-b border-gray-800 pb-1">Appearance</h4>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Font Size</label>
                                <input
                                    type="text"
                                    value={selectedElement.style.fontSize || ''}
                                    onChange={(e) => updateElementStyle(selectedElement.id, { fontSize: e.target.value })}
                                    className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Text Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={selectedElement.style.color as string || '#ffffff'}
                                        onChange={(e) => updateElementStyle(selectedElement.id, { color: e.target.value })}
                                        className="bg-transparent w-8 h-8 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={selectedElement.style.color as string || ''}
                                        onChange={(e) => updateElementStyle(selectedElement.id, { color: e.target.value })}
                                        className="flex-1 bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Background Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={(selectedElement.style.backgroundColor as string) || '#000000'}
                                        onChange={(e) => updateElementStyle(selectedElement.id, { backgroundColor: e.target.value })}
                                        className="bg-transparent w-8 h-8 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={(selectedElement.style.backgroundColor as string) || 'transparent'}
                                        onChange={(e) => updateElementStyle(selectedElement.id, { backgroundColor: e.target.value })}
                                        className="flex-1 bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white"
                                        placeholder="transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Font Weight</label>
                                <select
                                    value={selectedElement.style.fontWeight as string || 'normal'}
                                    onChange={(e) => updateElementStyle(selectedElement.id, { fontWeight: e.target.value })}
                                    className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                    <option value="100">Thin</option>
                                    <option value="900">Black</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-8 mt-auto">
                            <button
                                onClick={() => deleteElement(selectedElement.id)}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors border border-red-900/50"
                            >
                                <Trash2 size={16} /> Delete Element
                            </button>
                        </div>
                    </div>
                ) : (
                    // BOARD PROPERTIES (When no element is selected)
                    <div className="p-4 space-y-6 overflow-y-auto flex-1">
                        <div>
                            <label className="text-xs text-gray-500 block mb-2">Background Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setBackground(prev => ({ ...prev, type: 'solid' }))}
                                    className={`p-2 text-xs rounded border ${background.type === 'solid' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                >
                                    Solid
                                </button>
                                <button
                                    onClick={() => setBackground(prev => ({ ...prev, type: 'gradient_2' }))}
                                    className={`p-2 text-xs rounded border ${background.type === 'gradient_2' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                >
                                    2-Color
                                </button>
                                <button
                                    onClick={() => setBackground(prev => ({ ...prev, type: 'gradient_3' }))}
                                    className={`p-2 text-xs rounded border ${background.type === 'gradient_3' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                >
                                    3-Color
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Color 1 (Top/Left)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={background.colors[0]}
                                        onChange={(e) => {
                                            const newColors = [...background.colors];
                                            newColors[0] = e.target.value;
                                            setBackground(prev => ({ ...prev, colors: newColors }));
                                        }}
                                        className="bg-transparent w-8 h-8 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={background.colors[0]}
                                        onChange={(e) => {
                                            const newColors = [...background.colors];
                                            newColors[0] = e.target.value;
                                            setBackground(prev => ({ ...prev, colors: newColors }));
                                        }}
                                        className="flex-1 bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white"
                                    />
                                </div>
                            </div>

                            {(background.type === 'gradient_2' || background.type === 'gradient_3') && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Color 2 {background.type === 'gradient_3' ? '(Middle)' : '(Bottom/Right)'}</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={background.colors[1]}
                                            onChange={(e) => {
                                                const newColors = [...background.colors];
                                                newColors[1] = e.target.value;
                                                setBackground(prev => ({ ...prev, colors: newColors }));
                                            }}
                                            className="bg-transparent w-8 h-8 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={background.colors[1]}
                                            onChange={(e) => {
                                                const newColors = [...background.colors];
                                                newColors[1] = e.target.value;
                                                setBackground(prev => ({ ...prev, colors: newColors }));
                                            }}
                                            className="flex-1 bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {background.type === 'gradient_3' && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Color 3 (Bottom/Right)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={background.colors[2]}
                                            onChange={(e) => {
                                                const newColors = [...background.colors];
                                                newColors[2] = e.target.value;
                                                setBackground(prev => ({ ...prev, colors: newColors }));
                                            }}
                                            className="bg-transparent w-8 h-8 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={background.colors[2]}
                                            onChange={(e) => {
                                                const newColors = [...background.colors];
                                                newColors[2] = e.target.value;
                                                setBackground(prev => ({ ...prev, colors: newColors }));
                                            }}
                                            className="flex-1 bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {(background.type === 'gradient_2' || background.type === 'gradient_3') && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Gradient Direction</label>
                                    <select
                                        value={background.direction}
                                        onChange={(e) => setBackground(prev => ({ ...prev, direction: e.target.value }))}
                                        className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white"
                                    >
                                        <option value="to bottom">To Bottom (↓)</option>
                                        <option value="to right">To Right (→)</option>
                                        <option value="to bottom right">Diagonal (↘)</option>
                                        <option value="to bottom left">Diagonal (↙)</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 p-4 bg-blue-900/10 border border-blue-900/30 rounded text-center">
                            <p className="text-xs text-blue-300">
                                This background will be applied to the public scoreboard view.
                            </p>
                        </div>

                        <div className="pt-8 mt-6 border-t border-gray-800">
                            <button
                                onClick={handleCleanBoard}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-lg transition-colors border border-red-900/50 hover:border-red-500/50"
                            >
                                <Trash2 size={16} /> Clean Board
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

