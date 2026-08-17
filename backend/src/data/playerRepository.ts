import { Player, WaitList } from "../utility/types";
import  { pool } from "../setup/data";
import { DatabaseError } from "pg";
import ErrorParse from '../errorHandling/DataBaseErrorParser';
import { BadRequestError, ConflictError } from "../errorHandling/error";

export async function getPlayerRepository(session_id: string) {
    try {
        const data = await pool.query(`SELECT id, name, state FROM attendances where session_id = $1 AND (state = $2 OR state = $3 OR state = $4)`, [session_id, "interested", "confirmed", "payment_pending"]);

        let players: Player[] = data.rows.map((player) => {
            return {
                id: player.id,
                name: player.name,
                state: player.state
            }
        });

        return players;

    } catch (err) {
        if (err instanceof DatabaseError) ErrorParse(err);
        else throw err
    }
}

export async function getWaitlistRepository(session_id: string) {
    try {
        const data = await pool.query(`SELECT id, name, state FROM attendances where session_id = $1 AND state = $2`, [session_id, "waitlist"]);

        let waitlist: WaitList[] = data.rows.map((player) => {
            return {
                id: player.id,
                name: player.name,
                state: player.state
            }
        });

        return waitlist;
    } catch (err) {
        if (err instanceof DatabaseError) ErrorParse(err);
        else throw err
    }
}

export async function createPlayerRepository(session_id: string, name: string, email: string, joined_at: string, user_token_hash: string, player_id: string) {
    const client = await pool.connect();
    
    try {         
        client.query('BEGIN');

        let attendance_state: string;

        const { rows: currentSession } = await client.query('SELECT state FROM sessions WHERE id = $1 FOR UPDATE', [session_id]);

        if (currentSession[0].state == "locked") {
            attendance_state = "waitlist";
        } else {
            const { rowCount } = await client.query(`UPDATE sessions SET player_count = player_count + 1 WHERE id = $1 AND player_count < capacity`, [session_id]);        
            attendance_state = rowCount == 1 ? "interested" : "waitlist";
        }
            
        await client.query(`INSERT INTO attendances (id, name, email, user_token_hash, state, session_id, joined_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [player_id, name, email, user_token_hash, attendance_state, session_id, joined_at]);
        client.query('COMMIT');

        return attendance_state;
    } catch (err) {
        await client.query('ROLLBACK');
        if (err instanceof DatabaseError) ErrorParse(err);
        else throw err;
    } finally {
        client.release();
    }
}

export async function deletePlayerRepository(encryptedToken: string, sessionId: string) {
    const client = await pool.connect();

    try {
        client.query('BEGIN');
        // Check for player_count - and lock the session.
        const {  rows: session  } = await client.query(`SELECT player_count, capacity, state FROM sessions WHERE id = $1 FOR UPDATE`, [sessionId]);

        // Delete my player id.
        await client.query(`DELETE FROM attendances WHERE user_token_hash = $1`, [encryptedToken]);
        // Now check if I need to move waitlist and change player count.
        if (session[0].player_count == session[0].capacity) {
            let { rows } = await client.query(`SELECT id FROM attendances WHERE session_id = $1 AND state = $2 ORDER BY joined_at ASC LIMIT 1`, [sessionId, 'waitlist'])
            // If there's a player in waitlist then I want to promote them.
            if (rows.length > 0) {
                // If the state of my current session is locked - then the one I am updating should change to payment pending.
                const state = session[0].state == "locked" ? "payment_pending" : "interested";
                await client.query(`UPDATE attendances SET state = $1 WHERE id = $2`, [state, rows[0].id]);
            } else {
                await client.query(`UPDATE sessions SET player_count = player_count - 1 WHERE id = $1`, [sessionId])
            }
        } else {
            await client.query(`UPDATE sessions SET player_count = player_count - 1 WHERE id = $1`, [sessionId])
        }
 
        client.query('COMMIT');
    } catch (err) {        
        await client.query('ROLLBACK');
        if (err instanceof DatabaseError) ErrorParse(err);
        else throw err;
    } finally {
        client.release();
    }
}

export async function getIdFromTokenRepository(encryptedToken: String) {
    try {
        const { rows } = await pool.query(`SELECT id FROM attendances WHERE user_token_hash = $1`, [encryptedToken]);

        return rows[0]?.id;
    } catch (err) {
        if (err instanceof DatabaseError) ErrorParse(err);
        else throw err
    }
}