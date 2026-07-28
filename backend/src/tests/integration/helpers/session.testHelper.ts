import { pool } from "../../../setup/data"
import { SessionRequest } from "../../../utility/types";

export async function findSession(sessionId: String) {
    const {rows} = await pool.query('SELECT id, host_name, time_start, time_end, cost_cents, capacity, court_name, date FROM sessions WHERE id = $1', [sessionId]);
    return rows[0]
}

export async function deleteSession(sessionId: String) {
    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

export async function addSession(sessionRequest: SessionRequest) {
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO sessions (id, host_name, host_email, created_at, admin_token_hash, time_start, time_end, cost_cents, capacity, date, court_name) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,    [id, sessionRequest.host_name, sessionRequest.host_email, new Date().toISOString(), "hello", "2026-07-10T01:36:00.000Z", "2026-07-10T01:36:00.000Z", 100, sessionRequest.capacity, "2026-07-10T01:36:00.000Z", "Olympic Park"])
    return id
}

export async function addPlayer(session_id: String, id: String) {
    await pool.query(`INSERT INTO attendances (id, name, email, user_token_hash, state, session_id, joined_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [id, "FILLER MAN", "limefan190@gmail.com", "TOKEN HASH", "confirmed", session_id, new Date().toISOString()]);
    return id;
}

export async function deletePlayer(player_id: String, session_id: String) {
    let { rows } = await pool.query('DELETE FROM attendances WHERE id = $1 RETURNING state', [player_id]);

    if (rows[0].state == "interested") {        
        await pool.query('UPDATE sessions SET player_count = player_count - 1 WHERE id = $1', [session_id]);
    }
}

export async function getPlayers(session_id: String) {
    let { rowCount } = await pool.query('SELECT id FROM attendances WHERE session_id = $1', [session_id]);
    return rowCount;
}

export async function getPlayersAndWaitlist(session_id: String) {
    const { rows } = await pool.query(
        `SELECT 
            (SELECT COUNT(*)::INT FROM attendances WHERE session_id = $1 AND state = 'interested') AS players, 
            (SELECT COUNT(*)::INT FROM attendances WHERE session_id = $1 AND state = 'waitlist') AS waitlist,
            (SELECT player_count FROM sessions WHERE id = $1) AS counter`, 
        [session_id]);

    
    return {
        interested_players: rows[0].players,
        waitlisted_players: rows[0].waitlist,
        total_players: rows[0].counter
    }
}