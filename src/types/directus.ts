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
    timer_seconds: number;
    timer_started_at: string | null;
    gamestate: Record<string, any>;
    board?: string | Board; // The selected board theme
    max_periods?: number;
    period_length?: number;
    overtime_length?: number;
    animations?: (string | ScoringAnimation)[];
}

export interface ScoringAnimation {
    id: string;
    name: string;
    trigger_points?: number;
    config: {
        overlay: {
            background: string;
            backdropBlur: string;
        };
        content: {
            initial: any;
            animate: any;
            exit: any;
            transition: any;
        };
        score: {
            initial: any;
            animate: any;
            transition: any;
        };
        elements: {
            type: string;
            value: string;
            animate: any;
            transition: any;
        }[];
    };
    active: boolean;
}

export interface Schema {
    sports: Sport[];
    teams: Team[];
    players: Player[];
    matches: Match[];
    boards: Board[];
    text_ads: TextAd[];
    video_ads: VideoAd[];
}

export interface Board {
    id: string;
    name: string;
    // active_match removed as it is now on the Match side
    background_color?: string;
    text_color?: string;
    show_timer: boolean;
    show_period: boolean;
    show_fouls: boolean;
    show_timeouts: boolean;
    show_players: boolean;
    show_player_stats: boolean;
    primary_color_home?: string;
    primary_color_away?: string;
    label_period?: string;
    label_fouls?: string;
    layout?: any; // JSON configuration for Board Designer
}

export interface TextAd {
    id: string;
    content: string;
    match?: string | Match;
    sort?: number;
}

export interface VideoAd {
    id: string;
    video: string; // The UUID of the Directus File
    match?: string | Match;
    sort?: number;
}
