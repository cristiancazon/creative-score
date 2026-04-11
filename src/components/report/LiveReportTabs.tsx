'use client';

interface TabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function LiveReportTabs({ activeTab, onTabChange }: TabsProps) {
    const tabs = [
        { id: 'live', label: 'En Vivo' },
        { id: 'stats', label: 'Estadísticas' },
        { id: 'players', label: 'Mejores Jugadores' },
        { id: 'shotmap', label: 'Mapa de Tiro' }
    ];

    return (
        <div className="flex border-b border-slate-800 mb-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
                        activeTab === tab.id 
                        ? 'text-cyan-400' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400 rounded-t-full shadow-[0_-4px_10px_rgba(34,211,238,0.5)]"></div>
                    )}
                </button>
            ))}
        </div>
    );
}
