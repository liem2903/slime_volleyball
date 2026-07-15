export type Links = {
    host_link: string;
    join_link: string;
}

export type Session = {
    hostLink: string
    joinLink: string
    capacity: number
    date: string
    startTime: string
    endTime: string
    price: number
}

export type SessionDetails = {
    id: string;
    host_name: string;
    host_email: string;
    created_at: string;
    admin_token_hash: string;
    time_start: string
    time_end: string
    cost_cents: number
    capacity: number;
}