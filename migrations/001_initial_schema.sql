CREATE TYPE session_state as ENUM ('locked', 'unlocked', 'completed', 'cancelled');
CREATE TYPE attendance_state as ENUM ('waitlist', 'confirmed', 'payment_pending', 'cancelled', 'payment_cancelled', 'interested');

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    host_name VARCHAR(255) NOT NULL,
    host_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    admin_token_hash VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time_start TIMESTAMPTZ NOT NULL,
    time_end TIMESTAMPTZ NOT NULL,
    cost_cents INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    court_name TEXT,
    player_count INTEGER,
    price_per_player INTEGER,
    state session_state NOT NULL DEFAULT 'unlocked'
);

CREATE TABLE attendances (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    user_token_hash VARCHAR(255) NOT NULL,
    state attendance_state NOT NULL DEFAULT 'interested',
    session_id TEXT NOT NULL REFERENCES sessions(id), 
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email, session_id)
)