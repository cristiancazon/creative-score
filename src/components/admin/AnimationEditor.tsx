'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { directus } from '@/lib/directus';
import { createItem, updateItem, readItem } from '@directus/sdk';
import { ArrowLeft, Save, Play, Plus, Trash2, Settings, Layers, Zap, Info } from 'lucide-react';
import Link from 'next/link';
import { ScoringAnimation } from '@/types/directus';

interface AnimationEditorProps {
    id?: string;
}

const DEFAULT_CONFIG = {
    overlay: {
        background: 'rgba(0, 0, 0, 0.8)',
        backdropBlur: '12px'
    },
    content: {
        initial: { x: -200, opacity: 0, scale: 0.8 },
        animate: { x: 0, opacity: 1, scale: 1 },
        exit: { x: 200, opacity: 0, scale: 0.8 },
        transition: { duration: 0.6, ease: "easeOut" }
    },
    score: {
        initial: { y: 100, opacity: 0, scale: 0.5 },
        animate: { y: 0, opacity: 1, scale: 1.5 },
        transition: { delay: 0.3, type: "spring", stiffness: 200 }
    },
    elements: [
        {
            type: 'emoji',
            value: '🔥',
            animate: { 
                scale: [0, 1.2, 1], 
                y: [0, -50, -100], 
                opacity: [0, 1, 0] 
            },
            transition: { 
                duration: 2, 
                repeat: Infinity,
                repeatDelay: 0.5
            }
        }
    ]
};

export default function AnimationEditor({ id }: AnimationEditorProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'overlay' | 'content' | 'score' | 'elements' | 'json'>('general');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<ScoringAnimation>>({
        name: 'New Animation',
        trigger_points: 3,
        active: true,
        config: DEFAULT_CONFIG
    });

    const [jsonText, setJsonText] = useState(JSON.stringify(DEFAULT_CONFIG, null, 2));

    useEffect(() => {
        if (formData.config && activeTab !== 'json') {
            setJsonText(JSON.stringify(formData.config, null, 2));
        }
    }, [formData.config, activeTab]);

    const handleJsonChange = (val: string) => {
        setJsonText(val);
        try {
            const parsed = JSON.parse(val);
            setFormData(prev => ({ ...prev, config: parsed }));
            setJsonError(null);
        } catch (e) {
            setJsonError('Invalid JSON format');
        }
    };

    useEffect(() => {
        if (id) {
            const load = async () => {
                setLoading(true);
                try {
                    const data = await directus.request(readItem('scoring_animations', id));
                    setFormData(data as ScoringAnimation);
                } catch (error) {
                    console.error("Error loading animation:", error);
                } finally {
                    setLoading(false);
                }
            };
            load();
        }
    }, [id]);

    const handleSave = async () => {
        setLoading(true);
        try {
            if (id) {
                await directus.request(updateItem('scoring_animations', id, formData));
            } else {
                await directus.request(createItem('scoring_animations', formData));
            }
            router.push('/admin/animations');
            router.refresh();
        } catch (error) {
            console.error("Error saving animation:", error);
            alert('Failed to save animation');
        } finally {
            setLoading(false);
        }
    };

    const playPreview = () => {
        setIsPlaying(false);
        setTimeout(() => setIsPlaying(true), 50);
        setTimeout(() => setIsPlaying(false), 4000);
    };

    const updateConfig = (section: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            config: {
                ...(prev.config || DEFAULT_CONFIG),
                [section]: value
            } as ScoringAnimation['config']
        }));
    };

    // Helper to fix JSON-specific string values (like "Infinity")
    const fixConfig = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) {
            if (obj === 'Infinity' || obj === 'infinity') return Infinity;
            return obj;
        }
        if (Array.isArray(obj)) return obj.map(fixConfig);
        const fixed: any = {};
        for (const key in obj) {
            fixed[key] = fixConfig(obj[key]);
        }
        return fixed;
    };

    const config = fixConfig(formData.config || DEFAULT_CONFIG);

    if (loading && !formData.name) return <div className="p-8 text-center text-gray-500 italic">Loading configuration...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/animations" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {id ? `Editing: ${formData.name}` : 'New Animation'}
                    </h1>
                </div>
                <div className="ml-auto flex gap-3">
                    <button
                        onClick={playPreview}
                        className="bg-yellow-600/20 text-yellow-400 border border-yellow-900/50 hover:bg-yellow-600/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                    >
                        <Play size={18} fill="currentColor" /> Preview
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="flex gap-6 flex-1 overflow-hidden">
                {/* PREVIEW AREA (LEFT) */}
                <div className="flex-1 bg-black rounded-2xl border border-gray-800/50 relative overflow-hidden flex items-center justify-center shadow-2xl">
                    {/* Placeholder Background (Court) */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="w-full h-full border-2 border-dashed border-white/20 m-8 rounded-lg flex items-center justify-center">
                            <div className="w-1/2 h-full border-r-2 border-dashed border-white/10" />
                            <div className="absolute w-32 h-32 border-2 border-dashed border-white/10 rounded-full" />
                        </div>
                    </div>

                    <AnimatePresence>
                        {isPlaying && (
                            <motion.div
                                key="overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                                style={{
                                    background: config.overlay.background,
                                    backdropFilter: `blur(${config.overlay.backdropBlur || '0px'})`
                                }}
                            >
                                <div className="relative z-10 text-center">
                                    <motion.div
                                        initial={config.content.initial}
                                        animate={config.content.animate}
                                        transition={config.content.transition}
                                        className="text-white text-4xl font-black uppercase tracking-tighter mb-4"
                                    >
                                        STEPHEN CURRY
                                        <div className="text-xl text-blue-400 font-bold mt-1">GOLDEN STATE WARRIORS</div>
                                    </motion.div>

                                    <motion.div
                                        initial={config.score.initial}
                                        animate={config.score.animate}
                                        transition={config.score.transition}
                                        className="text-7xl font-black italic drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                                    >
                                        +{formData.trigger_points || 3}
                                    </motion.div>
                                </div>

                                {config.elements.map((el: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={el.initial}
                                        animate={el.animate}
                                        exit={el.exit}
                                        transition={el.transition}
                                        className="absolute text-5xl flex items-center justify-center"
                                    >
                                        {el.value}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Instructions Overlay */}
                    {!isPlaying && (
                        <div className="flex flex-col items-center gap-4 text-gray-500 animate-pulse">
                            <Zap size={48} />
                            <p className="text-sm font-medium">Click PREVIEW to see the celebration</p>
                        </div>
                    )}
                </div>

                {/* CONTROLS (RIGHT) */}
                <div className="w-[450px] bg-gray-950 border border-gray-800 rounded-2xl flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-800">
                        <TabButton id="general" active={activeTab} onClick={setActiveTab} icon={<Settings size={14} />} label="Global" />
                        <TabButton id="overlay" active={activeTab} onClick={setActiveTab} icon={<Layers size={14} />} label="BG" />
                        <TabButton id="content" active={activeTab} onClick={setActiveTab} icon={<Info size={14} />} label="Text" />
                        <TabButton id="score" active={activeTab} onClick={setActiveTab} icon={<Zap size={14} />} label="Point" />
                        <TabButton id="elements" active={activeTab} onClick={setActiveTab} icon={<Plus size={14} />} label="FX" />
                        <TabButton id="json" active={activeTab} onClick={setActiveTab} icon={<Layers size={14} className="text-purple-400" />} label="JSON" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Animation Name</label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Trigger Points</label>
                                    <select
                                        value={formData.trigger_points || 3}
                                        onChange={(e) => setFormData({ ...formData, trigger_points: parseInt(e.target.value) })}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value={1}>+1 Point</option>
                                        <option value={2}>+2 Points</option>
                                        <option value={3}>+3 Points</option>
                                        <option value={0}>Generic (Any)</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.active || false}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="w-4 h-4 rounded bg-gray-900 border-gray-800 text-blue-600"
                                    />
                                    <label className="text-sm font-medium text-gray-300">Enable in rotation</label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'overlay' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Background Color (RGBA)</label>
                                    <input
                                        type="text"
                                        value={config.overlay.background}
                                        onChange={(e) => updateConfig('overlay', { ...config.overlay, background: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="rgba(0,0,0,0.8)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Backdrop Blur</label>
                                    <input
                                        type="text"
                                        value={config.overlay.backdropBlur}
                                        onChange={(e) => updateConfig('overlay', { ...config.overlay, backdropBlur: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="12px"
                                    />
                                </div>
                            </div>
                        )}

                        {(activeTab === 'content' || activeTab === 'score') && (
                            <MotionControls 
                                section={activeTab} 
                                config={(config as any)[activeTab]} 
                                onChange={(val: any) => updateConfig(activeTab, val)} 
                            />
                        )}

                        {activeTab === 'elements' && (
                            <ElementsManager 
                                elements={config.elements || []} 
                                onChange={(val: any) => updateConfig('elements', val)} 
                            />
                        )}
                        {activeTab === 'json' && (
                            <div className="space-y-4 h-full flex flex-col">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Advanced JSON Editor</label>
                                    {jsonError && <span className="text-[10px] text-red-500 font-bold bg-red-900/20 px-2 py-0.5 rounded animate-pulse">{jsonError}</span>}
                                </div>
                                <textarea
                                    value={jsonText}
                                    onChange={(e) => handleJsonChange(e.target.value)}
                                    className={`flex-1 w-full bg-gray-900 border ${jsonError ? 'border-red-900' : 'border-gray-800'} rounded-lg p-4 text-xs font-mono text-purple-300 focus:outline-none custom-scrollbar min-h-[400px]`}
                                    spellCheck={false}
                                />
                                <div className="p-3 bg-blue-900/10 border border-blue-900/30 rounded flex gap-3 text-xs text-blue-300">
                                    <Info size={16} className="shrink-0" />
                                    <p>Aquí puedes pegar configuraciones complejas de Framer Motion. Los cambios reflejan en las otras pestañas.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabButton({ id, active, onClick, icon, label }: { id: string; active: string; onClick: (id: any) => void; icon: React.ReactNode; label: string }) {
    const isActive = active === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                isActive ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-900'
            }`}
        >
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </button>
    );
}

function MotionControls({ section, config, onChange }: { section: string; config: any; onChange: (val: any) => void }) {
    const handleUpdate = (path: string, field: string, val: any) => {
        const numericVal = !isNaN(val) && val !== "" ? parseFloat(val) : val;
        onChange({
            ...config,
            [path]: {
                ...config[path],
                [field]: numericVal
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest border-b border-gray-800 pb-2">Initial State (Start)</h4>
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="X Pos" value={config.initial?.x} onChange={(v) => handleUpdate('initial', 'x', v)} />
                    <InputGroup label="Y Pos" value={config.initial?.y} onChange={(v) => handleUpdate('initial', 'y', v)} />
                    <InputGroup label="Opacity" value={config.initial?.opacity} onChange={(v) => handleUpdate('initial', 'opacity', v)} step="0.1" />
                    <InputGroup label="Scale" value={config.initial?.scale} onChange={(v) => handleUpdate('initial', 'scale', v)} step="0.1" />
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-xs font-bold text-green-500 uppercase tracking-widest border-b border-gray-800 pb-2">Animate State (Final)</h4>
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="X Pos" value={config.animate?.x} onChange={(v) => handleUpdate('animate', 'x', v)} />
                    <InputGroup label="Y Pos" value={config.animate?.y} onChange={(v) => handleUpdate('animate', 'y', v)} />
                    <InputGroup label="Opacity" value={config.animate?.opacity} onChange={(v) => handleUpdate('animate', 'opacity', v)} step="0.1" />
                    <InputGroup label="Scale" value={config.animate?.scale} onChange={(v) => handleUpdate('animate', 'scale', v)} step="0.1" />
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-xs font-bold text-purple-500 uppercase tracking-widest border-b border-gray-800 pb-2">Transition</h4>
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Duration (s)" value={config.transition?.duration} onChange={(v) => handleUpdate('transition', 'duration', v)} step="0.1" />
                    <InputGroup label="Delay (s)" value={config.transition?.delay} onChange={(v) => handleUpdate('transition', 'delay', v)} step="0.1" />
                    <div className="col-span-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Ease Function</label>
                        <select 
                            value={config.transition?.ease || 'linear'}
                            onChange={(e) => handleUpdate('transition', 'ease', e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white"
                        >
                            <option value="linear">Linear</option>
                            <option value="easeIn">Ease In</option>
                            <option value="easeOut">Ease Out</option>
                            <option value="easeInOut">Ease In Out</option>
                            <option value="circIn">Circ In</option>
                            <option value="circOut">Circ Out</option>
                            <option value="backIn">Back In</option>
                            <option value="backOut">Back Out</option>
                            <option value="anticipate">Anticipate</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ElementsManager({ elements, onChange }: { elements: any[]; onChange: (val: any[]) => void }) {
    const addElement = () => {
        const newEl = {
            type: 'emoji',
            value: '🏀',
            animate: { y: [0, -100], opacity: [0, 1, 0] },
            transition: { duration: 1.5, repeat: Infinity }
        };
        onChange([...elements, newEl]);
    };

    const removeElement = (index: number) => {
        onChange(elements.filter((_: any, i: number) => i !== index));
    };

    return (
        <div className="space-y-6">
            <button
                onClick={addElement}
                className="w-full py-2 bg-gray-900 border border-dashed border-gray-700 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
            >
                <Plus size={14} /> Add Decorative Element
            </button>

            <div className="space-y-4">
                {elements.map((el: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-950 border border-gray-800 rounded-xl relative group">
                        <button
                            onClick={() => removeElement(index)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-900 text-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <Plus className="rotate-45" size={12} />
                        </button>

                        <div className="grid grid-cols-4 gap-4 items-end">
                            <div className="col-span-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Value</label>
                                <input
                                    type="text"
                                    value={el.value}
                                    onChange={(e) => {
                                        const newEls = [...elements];
                                        newEls[index] = { ...el, value: e.target.value };
                                        onChange(newEls);
                                    }}
                                    className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-sm"
                                />
                            </div>
                            <div className="col-span-3">
                                <p className="text-[10px] text-gray-600 italic">Advanced config via JSON (coming soon in 1.3)</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function InputGroup({ label, value, onChange, step = "1" }: { label: string; value: any; onChange: (v: string) => void; step?: string }) {
    return (
        <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">{label}</label>
            <input
                type="number"
                step={step}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
        </div>
    );
}
