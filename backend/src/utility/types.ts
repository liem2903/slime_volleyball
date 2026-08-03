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
}

export type WaitList = Player;