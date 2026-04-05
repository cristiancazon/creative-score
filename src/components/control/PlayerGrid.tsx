'use client';

import { Play, Pause } from 'lucide-react';

interface Player {
    id: string | number;
    name: string;
    number: number;
    [key: string]: any;
}

type ViewState = 'main' | 'actions' | 'substitution';

interface PlayerGridProps {
    view: ViewState;
    onCourt: Player[];
    bench: Player[];
    selectedTeam: 'home' | 'away';
    isRunning: boolean;
    gamestate: any;
    onGridAction: (index: number) => void;
    onPlayerAction: (type: 'pts' | 'foul', value: number) => void;
    onSubstitution: (benchId: any) => void;
    onSetView: (view: ViewState) => void;
}

/**
 * The 3x3 grid of buttons for the ControlMX page.
 * Handles main (players/actions), scoring, and substitution views.
 * Also renders the Logi plugin icon capture layer (off-screen).
 */
export function PlayerGrid({
    view,
    onCourt,
    bench,
    selectedTeam,
    isRunning,
    gamestate,
    onGridAction,
    onPlayerAction,
    onSubstitution,
    onSetView,
}: PlayerGridProps) {
    const homeStyle = 'bg-purple-900/20 border-purple-500/30';
    const awayStyle = 'bg-green-900/20 border-green-500/30';
    const teamStyle = selectedTeam === 'home' ? homeStyle : awayStyle;
    const numberColor = selectedTeam === 'home' ? 'text-purple-400' : 'text-green-400';

    return (
        <>
            {/* --- Main interactive grid --- */}
            <div className="grid grid-cols-3 grid-rows-3 gap-4 flex-1 max-w-[600px] mx-auto w-full mb-8">
                {view === 'main' && (
                    <>
                        {onCourt.map((p, idx) => (
                            <button
                                key={p.id}
                                id={`mx_btn_${idx}`}
                                onClick={() => onGridAction(idx)}
                                className={`rounded-[2.5rem] flex flex-col items-center justify-center relative border-2 ${teamStyle}`}
                            >
                                <span className={`text-5xl font-black mb-1 ${numberColor}`}>{p.number}</span>
                                <span className="text-[10px] uppercase font-black opacity-50 truncate w-full px-4 text-center">{p.name}</span>
                                {gamestate?.player_stats?.[p.id]?.fouls > 0 && (
                                    <div className="absolute top-4 right-4 text-red-500 font-black text-xs">
                                        F:{gamestate.player_stats[p.id].fouls}
                                    </div>
                                )}
                            </button>
                        ))}
                        {Array.from({ length: 5 - onCourt.length }).map((_, i) => (
                            <div key={i} className="bg-white/5 border-2 border-white/5 rounded-[2.5rem] flex items-center justify-center">
                                <span className="opacity-10 font-black">EMPTY</span>
                            </div>
                        ))}
                        {/* Timeout button */}
                        <button
                            id="mx_btn_5"
                            onClick={() => onGridAction(5)}
                            className="rounded-[2.5rem] border-2 bg-white/5 border-white/10 flex flex-col items-center justify-center"
                        >
                            <div className="flex gap-1 mb-2">
                                {[1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${i <= (gamestate?.[selectedTeam === 'home' ? 'home_timeouts' : 'away_timeouts'] || 0) ? 'bg-red-500' : 'bg-white/10'}`}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] font-black opacity-50">TIMEOUT</span>
                        </button>
                        {/* Play/Pause button */}
                        <button
                            id="mx_btn_6"
                            onClick={() => onGridAction(6)}
                            className={`rounded-[2.5rem] border-2 flex flex-col items-center justify-center ${isRunning ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-500'}`}
                        >
                            {isRunning ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
                            <span className="text-[10px] font-black uppercase mt-1">{isRunning ? 'PAUSE' : 'PLAY'}</span>
                        </button>
                        {/* Shot clock 14 */}
                        <button id="mx_btn_7" onClick={() => onGridAction(7)} className="rounded-[2.5rem] border-2 bg-red-900/10 border-red-500/30 text-red-500 flex items-center justify-center">
                            <span className="text-6xl font-black">14</span>
                        </button>
                        {/* Shot clock 24 */}
                        <button id="mx_btn_8" onClick={() => onGridAction(8)} className="rounded-[2.5rem] border-2 bg-red-900/10 border-red-500/30 text-red-500 flex items-center justify-center">
                            <span className="text-6xl font-black">24</span>
                        </button>
                    </>
                )}

                {view === 'actions' && (
                    <>
                        {[1, 2, 3, -1, -2, -3].map((v, i) => (
                            <button
                                key={i}
                                id={`mx_btn_${i}`}
                                onClick={() => onPlayerAction('pts', v)}
                                className={`rounded-[2.5rem] border-2 flex items-center justify-center ${v > 0 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}
                            >
                                <span className="text-6xl font-black">{v > 0 ? `+${v}` : v}</span>
                            </button>
                        ))}
                        <button id="mx_btn_6" onClick={() => onPlayerAction('foul', 1)} className="rounded-[2.5rem] border-2 bg-orange-500/10 border-orange-500/30 text-orange-400 flex items-center justify-center font-black text-5xl">+F</button>
                        <button id="mx_btn_7" onClick={() => onPlayerAction('foul', -1)} className="rounded-[2.5rem] border-2 bg-orange-900/10 border-orange-900/30 text-orange-900 flex items-center justify-center font-black text-5xl">-F</button>
                        <button id="mx_btn_8" onClick={() => onSetView('substitution')} className="rounded-[2.5rem] border-2 bg-white/10 border-white/20 text-white flex items-center justify-center font-black text-6xl">C</button>
                    </>
                )}

                {view === 'substitution' && bench.slice(0, 9).map((p, idx) => (
                    <button
                        key={p.id}
                        id={`mx_btn_${idx}`}
                        onClick={() => onSubstitution(p.id)}
                        className="rounded-[2.5rem] border-2 bg-blue-500/10 border-blue-500/30 flex flex-col items-center justify-center"
                    >
                        <span className="text-5xl font-black text-blue-400">{p.number}</span>
                        <span className="text-[10px] font-black opacity-50 uppercase truncate w-full px-2 text-center">{p.name}</span>
                    </button>
                ))}
            </div>

            {/* --- Logi Plugin Icon Capture Layer (off-screen) --- */}
            <div className="fixed bottom-[-2000px] left-[-2000px] grid grid-cols-3 gap-0 opacity-100 pointer-events-none p-0 m-0">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} id={`mx_icon_capture_${i}`} className="w-[200px] h-[200px] bg-black flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full flex flex-col items-center justify-center text-center">
                            {view === 'main' && (
                                <>
                                    {i < 5 && onCourt[i] ? (
                                        <div className="flex flex-col items-center">
                                            <span className={`text-9xl font-black leading-none ${selectedTeam === 'home' ? 'text-purple-500' : 'text-green-500'}`}>{onCourt[i].number}</span>
                                            <span className="text-[20px] font-black text-white/50 uppercase">{onCourt[i].name?.substring(0, 8)}</span>
                                        </div>
                                    ) : i === 5 ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-full border-8 border-red-500 flex items-center justify-center">
                                                <div className="w-6 h-6 rounded-full bg-red-500" />
                                            </div>
                                            <span className="text-[24px] font-black text-red-500 uppercase mt-2">TIME</span>
                                        </div>
                                    ) : i === 6 ? (
                                        <div className="flex flex-col items-center">
                                            {isRunning ? <Pause size={100} className="text-amber-500" fill="currentColor" /> : <Play size={100} className="text-blue-500 ml-4" fill="currentColor" />}
                                            <span className={`text-[24px] font-black uppercase mt-2 ${isRunning ? 'text-amber-500' : 'text-blue-500'}`}>{isRunning ? 'PAUSE' : 'PLAY'}</span>
                                        </div>
                                    ) : i === 7 ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[120px] font-black text-red-500 leading-none">14</span>
                                            <span className="text-[20px] font-black text-red-500/50 uppercase">SHOT</span>
                                        </div>
                                    ) : i === 8 ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[120px] font-black text-red-500 leading-none">24</span>
                                            <span className="text-[20px] font-black text-red-500/50 uppercase">SHOT</span>
                                        </div>
                                    ) : null}
                                </>
                            )}
                            {view === 'actions' && (
                                <div className="flex flex-col items-center">
                                    {i < 3 ? <span className="text-[120px] font-black text-blue-500">+{i + 1}</span>
                                        : i < 6 ? <span className="text-[120px] font-black text-red-500">-{i - 2}</span>
                                            : i === 6 ? <span className="text-[120px] font-black text-orange-500">+F</span>
                                                : i === 7 ? <span className="text-[120px] font-black text-orange-900">-F</span>
                                                    : <span className="text-9xl font-black text-white">SUB</span>}
                                </div>
                            )}
                            {view === 'substitution' && bench[i] && (
                                <div className="flex flex-col items-center">
                                    <span className="text-9xl font-black text-blue-500 leading-none">{bench[i].number}</span>
                                    <span className="text-[20px] font-black text-white/50 uppercase">{bench[i].name?.substring(0, 8)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
