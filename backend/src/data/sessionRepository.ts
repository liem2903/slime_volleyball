import { SessionDetails, SessionInformation } from "../types";
import  { pool } from "../data";
import { SessionNotFoundError } from "../error"

export async function createSessionData(session_data: SessionDetails) {
    try {
        await pool.query(
            `INSERT INTO sessions (id, host_name, host_email, created_at, admin_token_hash, time_start, time_end, cost_cents, capacity, date, court_name) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                session_data.id,
                session_data.host_name,
                session_data.host_email,
                session_data.created_at,
                session_data.admin_token_hash,
                session_data.time_start,
                session_data.time_end,
                session_data.cost_cents,
                session_data.capacity,
                session_data.date,
                session_data.court_name
            ]
        );
    } catch (err) {
        throw new Error(`session insert failed: ${err}`);
    }
}

export async function getSessionData(session_id: string): Promise<SessionInformation> {
    let session = await pool.query('SELECT * FROM sessions WHERE id = $1', [session_id]);
    let session_data = session.rows[0]

    if (session.rowCount == 0) {
        throw new SessionNotFoundError();
    }

    console.log(session_data);
    
    return {
        id: session_data.id,
        host_name: session_data.host_name,
        time_start: session_data.time_start,
        admin_token_hash: session_data.admin_token_hash,
        time_end: session_data.time_end,
        cost_cents: session_data.cost_cents,
        capacity: session_data.capacity,
        court_name: session_data.court_name,
        date: session_data.date,
    }   
}