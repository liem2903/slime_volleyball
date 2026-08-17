import { StringFormatParams } from "zod/v4/core";

export type Links = {
    host_link: string;
    join_link: string;
    session_id: string;
}

export type SessionRequest = {
    host_name: string;
    host_email: string;
    time_start: string
    time_end: string
    cost_cents: number
    capacity: number;
    date: string;
    court_name: string;
    host_is_player: boolean;
}

export type SessionBusinessRequest = {
    id: string,
    host_name: string,
    host_email: string,
    created_at: string,
    admin_token_hash: string,
    time_start: string,
    time_end: string,
    cost_cents: number,
    capacity: number,
    date: string,
    court_name: string,
    player_count: number,
}

export type SessionResult = {
    id: string;
    host_name: string;
    admin_token_hash: string;
    time_start: string
    time_end: string
    cost_cents: number
    capacity: number;
    court_name: string;
    date: string;
    player_count: number;
    state: 'locked' | 'unlocked' | 'completed' | 'cancelled';
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
    user_state: string,
}

export type Player = {
    id: string;
    name: string;
    state: 'interested' | 'waitlist' | 'payment_pending' | 'confirmed';
}

export type WaitList = Player;