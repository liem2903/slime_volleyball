import expectCookies from "supertest/lib/cookies";
import { pool } from "../../../setup/data"
import { generateSHA256 } from "../../../utility/helper";
import { SessionRequest } from "../../../utility/types";

type playerReturn = {
    id: String,
    hash: string,
}

export async function findSession(sessionId: String) {
    const {rows} = await pool.query('SELECT id, host_name, time_start, time_end, cost_cents, capacity, court_name, date FROM sessions WHERE id = $1', [sessionId]);
    return rows[0]
}

export async function deleteSession(sessionId: String) {
    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

export async function addSession(sessionRequest: SessionRequest) {
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO sessions (id, host_name, host_email, created_at, admin_token_hash, time_start, time_end, cost_cents, capacity, date, court_name, player_count) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,    [id, sessionRequest.host_name, sessionRequest.host_email, new Date().toISOString(), "hello", "2026-07-10T01:36:00.000Z", "2026-07-10T01:36:00.000Z", sessionRequest.cost_cents, sessionRequest.capacity, "2026-07-10T01:36:00.000Z", "Olympic Park", 1])
    return id
}

export async function addAdminSession(sessionRequest: SessionRequest): Promise<playerReturn> {
    const id = crypto.randomUUID();
    const hash = crypto.randomUUID();
    const encrypted_hash = generateSHA256(hash);

    console.log(hash);
    console.log(encrypted_hash);


    await pool.query(`INSERT INTO sessions (id, host_name, host_email, created_at, admin_token_hash, time_start, time_end, cost_cents, capacity, date, court_name, player_count) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,    [id, sessionRequest.host_name, sessionRequest.host_email, new Date().toISOString(), encrypted_hash, "2026-07-10T01:36:00.000Z", "2026-07-10T01:36:00.000Z", sessionRequest.cost_cents, sessionRequest.capacity, "2026-07-10T01:36:00.000Z", "Olympic Park", 1])
    return {hash, id}
}

export async function getSessionState(sessionId: String): Promise<String> {
    let { rows } = await pool.query('SELECT state FROM sessions WHERE id = $1', [sessionId]);
    return rows[0].state;
}

export async function setSessionState(sessionId: String, state: string) {
    await pool.query('UPDATE sessions SET state = $1 WHERE id = $2', [state, sessionId]);
}

export async function getPricePerPlayer(sessionId: String) {
    let { rows } = await pool.query('SELECT price_per_player FROM sessions WHERE id = $1', [sessionId]);
    return rows[0].price_per_player;
}

export async function getSessionCapacity(sessionId: String) {
    let { rows } = await pool.query('SELECT capacity FROM sessions WHERE id = $1', [sessionId]);
    return rows[0].capacity;
}


export async function addInterestedPlayer(session_id: String, id: String, email: string): Promise<playerReturn> {    
    const hash = crypto.randomUUID();
    await pool.query(`INSERT INTO attendances (id, name, email, user_token_hash, state, session_id, joined_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [id, "FILLER MAN", email, generateSHA256(hash), "interested", session_id, new Date().toISOString()]);
    await pool.query(`UPDATE sessions SET player_count = player_count + 1 WHERE id = $1`, [session_id]);
    
    return {id, hash};
}

export async function addPaymentPendingPlayer(session_id: String, id: String, email: string) {
    const hash = crypto.randomUUID();
    await pool.query(`INSERT INTO attendances (id, name, email, user_token_hash, state, session_id, joined_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [id, "FILLER MAN", email, generateSHA256(hash), "payment_pending", session_id, new Date().toISOString()]);
    await pool.query(`UPDATE sessions SET player_count = player_count + 1 WHERE id = $1`, [session_id]);
    
    return {id, hash};
}

export async function addWaitlistedPlayer(session_id: String, id: String, email: String):  Promise<playerReturn> {
    const hash = crypto.randomUUID();

    await pool.query(`INSERT INTO attendances (id, name, email, user_token_hash, state, session_id, joined_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [id, "FILLER MAN", email, generateSHA256(hash), "waitlist", session_id, new Date().toISOString()]);
    return {id, hash};
}

export async function deletePlayer(player_id: String, session_id: String) {
    let { rows } = await pool.query('DELETE FROM attendances WHERE id = $1 RETURNING state', [player_id]);

    if (rows[0].state == "interested") {        
        await pool.query('UPDATE sessions SET player_count = player_count - 1 WHERE id = $1', [session_id]);
    }
}

export async function getPlayerCount(session_id: String):  Promise<number | null> {
    let { rowCount } = await pool.query('SELECT id FROM attendances WHERE session_id = $1', [session_id]);
    return rowCount;
}

export async function getSessionPlayerCount(session_id: String) {
    return (await pool.query('SELECT player_count FROM sessions WHERE id = $1', [session_id])).rows[0].player_count;
}

export async function doesPlayerExist(id: String): Promise<Boolean> {
    let { rowCount } = await pool.query(`SELECT * FROM attendances where id = $1`, [id]);

    return rowCount == 1
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

export async function getPlayerId(session_id: String) {
    const { rows } = await pool.query(`SELECT id FROM attendances WHERE session_id = $1`, [session_id]);
    return rows[0].id;
}

export async function getPlayerState(player_id: String) {
    const { rows } = await pool.query(`SELECT state FROM attendances WHERE id = $1`, [player_id]);
    return rows[0].state;
}

export async function lockSession(id: String) {
    const { rows } = await pool.query('UPDATE sessions SET state = $1 WHERE id = $2 RETURNING player_count, cost_cents', ['locked', id]);
    await pool.query('UPDATE sessions SET price_per_player = $1 WHERE id = $2', [Math.ceil(rows[0].cost_cents / rows[0].player_count), id]);
}

export async function markPlayerPaid(playerId: String) {
    await pool.query('UPDATE attendances SET state = $1 WHERE id = $2', ["confirmed", playerId])
}