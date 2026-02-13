export interface GameState {
    sport: string;
    homeScore: number;
    awayScore: number;
    period: number;
    timer: number;
    isRunning: boolean;
    status: 'scheduled' | 'live' | 'finished' | 'paused';
}

export abstract class AbstractSport {
    protected state: GameState;

    constructor(initialState: GameState) {
        this.state = initialState;
    }

    abstract addScore(team: 'home' | 'away', points: number): GameState;
    abstract nextPeriod(): GameState;

    startTimer(): void {
        this.state.isRunning = true;
    }

    stopTimer(): void {
        this.state.isRunning = false;
    }

    tick(): GameState {
        if (this.state.isRunning && this.state.timer > 0) {
            this.state.timer--;
        } else if (this.state.timer === 0) {
            this.state.isRunning = false;
        }
        return { ...this.state };
    }

    getState(): GameState {
        return { ...this.state };
    }
}
