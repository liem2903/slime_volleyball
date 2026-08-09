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
    user_state: string,
}

export type Player = {
    id: string;
    name: string
}

export type WaitList = Player;