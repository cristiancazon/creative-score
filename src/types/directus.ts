export interface Sport {
    id: string;
    name: string;
    slug: string;
    type: string; // 'basketball', 'soccer', 'volleyball'
    periods: number;
    period_duration: number; // minutes
    rules_config: Record<string, any>; // JSON
    icon?: string;
}

export interface Team {
    id: string;
    name: string;
    short_name: string;
    logo?: string;
    primary_color: string;
    secondary_color: string;
    sport?: string | Sport;
}

export interface Player {
    id: string;
    name: string;
    number: number;
    team: string | Team;
    avatar?: string;
    position: string;
    active: boolean;
}

export interface Match {
    id: string;
    start_time: string;
    sport: string | Sport;
    home_team: string | Team;
    away_team: string | Team;
    status: 'scheduled' | 'live' | 'finished' | 'paused';
    home_score: number;
    away_score: number;
    current_period: number;
    timer_seconds: number; // Remaining seconds when paused/saved
    timer_started_at: string | null; // ISO Timestamp when clock started running
    gamestate: Record<string, any>; // JSON
}

export interface Schema {
    sports: Sport[];
    teams: Team[];
    players: Player[];
    matches: Match[];
}
