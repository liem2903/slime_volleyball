import { SessionDetails } from "../utlity/types";
import  { pool } from "../data";

export async function createSessionData(session_data: SessionDetails) {
    try {
        await pool.query(
            `INSERT INTO sessions (id, host_name, host_email, created_at, admin_token_hash, time_start, time_end, cost_cents, capacity) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                session_data.id,
                session_data.host_name,
                session_data.host_email,
                session_data.created_at,
                session_data.admin_token_hash,
                session_data.time_start,
                session_data.time_end,
                session_data.cost_cents,
                session_data.capacity
            ]
        );
    } catch (err) {
        throw new Error(`session insert failed: ${err}`);
    }
}