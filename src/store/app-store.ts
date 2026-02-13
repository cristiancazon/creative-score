import { create } from 'zustand';
import { AbstractSport } from '@/engine/AbstractSport';
import { Basketball } from '@/engine/Basketball';

interface AppState {
    game: AbstractSport | null;
    activeSport: string | null;
    initializeGame: (sport: string) => void;
    // Actions to mutate game state would go here, proxied to the game instance
}

export const useAppStore = create<AppState>((set) => ({
    game: null,
    activeSport: null,
    initializeGame: (sport) => {
        let gameInstance;
        switch (sport) {
            case 'basketball':
                gameInstance = new Basketball();
                break;
            // Add other sports here
            default:
                console.warn(`Sport ${sport} not implemented`);
                return;
        }
        set({ game: gameInstance, activeSport: sport });
    },
}));
