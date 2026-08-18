export type Links = {
    host_link: string,
    join_link: string,
    session_id: string,
}

export type Session = {
    hostLink: string,
    joinLink: string,
    capacity: number,
    date: string,
    startTime: string,
    endTime: string,
    cost_cents: number,
    courtName: string,
}

export type SessionRequest = {
    id: string;
    host_name: string;
    host_email: string;
    created_at: string;
    admin_token_hash: string;
    time_start: string
    time_end: string
    cost_cents: number
    capacity: number;
    date: string;
    court_name?: string;
}

export type SessionResult = {
    id: string;
    host_name: string;
    admin_token_hash: string;
    time_start: string
    time_end: string
    cost_cents: number
    capacity: number;
    court_name?: string;
    date: string;
    player_count: number;
    state: 'locked' | 'unlocked' | 'completed' | 'teams' | 'cancelled';
    price_per_player: number | null;
}

export type PlayerRequest = {
    name: string,
    email: string,
    session_id: string,
}

export type PlayerResponse = {
    id: string,
    name: string,
    email: string,
    session_id: string,
    joined_at: string,
    user_link: string,
    user_state: 'interested' | 'waitlist' | 'payment_pending' | 'confirmed',
}

export type PlayerPosition = 'middle' | 'oppo' | 'outside' | 'lib';

export type Player = {
    id: string;
    name: string
    state: 'interested' | 'waitlist' | 'payment_pending' | 'confirmed'
    primary_position?: PlayerPosition | null
    secondary_position?: PlayerPosition | null
    assigned_position?: PlayerPosition | null
}

export type WaitList = Player;