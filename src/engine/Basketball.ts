import { AbstractSport, GameState } from './AbstractSport';

export interface BasketballState extends GameState {
    sport: 'basketball';
    quarter: number;
    possession: 'home' | 'away' | null;
    fouls: { home: number; away: number };
    timeouts: { home: number; away: number };
}

export class Basketball extends AbstractSport {
    protected state: BasketballState;

    constructor(initialState?: Partial<BasketballState>) {
        super({
            sport: 'basketball',
            homeScore: 0,
            awayScore: 0,
            period: 1,
            timer: 600, // 10 minutes in seconds
            isRunning: false,
            status: 'scheduled',
            ...initialState,
        });

        this.state = this.state as BasketballState;
        if (!this.state.fouls) this.state.fouls = { home: 0, away: 0 };
        if (!this.state.timeouts) this.state.timeouts = { home: 3, away: 3 };
    }

    addScore(team: 'home' | 'away', points: number): BasketballState {
        if (team === 'home') {
            this.state.homeScore += points;
        } else {
            this.state.awayScore += points;
        }
        return { ...this.state };
    }

    addFul(team: 'home' | 'away'): BasketballState {
        if (team === 'home') {
            this.state.fouls.home++;
        } else {
            this.state.fouls.away++;
        }
        return { ...this.state };
    }

    nextPeriod(): BasketballState {
        if (this.state.period < 4) {
            this.state.period++;
            this.state.timer = 600;
            this.state.timeouts = { home: 3, away: 3 }; // Reset timeouts? Depends on rules. Usually reset halves or simplified.
            // Simplified: Reset timeouts to 2 if > 2, etc. For now reset. 
        }
        return { ...this.state };
    }
}
