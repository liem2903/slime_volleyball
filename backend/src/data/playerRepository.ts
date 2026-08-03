import { Player, WaitList } from "../utility/types";
import  { pool } from "../setup/data";
import { DatabaseError } from "pg";
import ErrorParse from '../errorHandling/DataBaseErrorParser';

export async function getPlayerRepository(session_id: string) {
    try {
        const data = await pool.query(`SELECT id, name FROM attendances where session_id = $1 AND (state = $2 OR state = $3)`, [session_id, "interested", "confirmed"]);

        let players: Player[] = data.rows.map((player) => {
            return {
                id: player.id,
                name: player.name
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
        const data = await pool.query(`SELECT id, name FROM attendances where session_id = $1 AND state = $2`, [session_id, "waitlist"]);

        let waitlist: WaitList[] = data.rows.map((player) => {
            return {
                id: player.id,
                name: player.name
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
        const { rowCount } = await client.query(`UPDATE sessions SET player_count = player_count + 1 WHERE id = $1 AND player_count < capacity`, [session_id]);        
        const attendance_state = rowCount == 1 ? "interested" : "waitlist";
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
        let {  rows  } = await client.query(`SELECT player_count, capacity FROM sessions WHERE id = $1 FOR UPDATE`, [sessionId]);

        const interested_players_count = rows[0].player_count;
        const interested_player_capacity = rows[0].capacity;
        // Delete my player id.
        await client.query(`DELETE FROM attendances WHERE user_token_hash = $1`, [encryptedToken]);
        // Now check if I need to move waitlist and change player count.
        if (interested_players_count == interested_player_capacity) {
            let { rows } = await client.query(`SELECT id FROM attendances WHERE session_id = $1 AND state = $2 ORDER BY joined_at ASC LIMIT 1`, [sessionId, 'waitlist'])
            // If there's a player in waitlist then I want to promote them.
            if (rows[0]) {
                await client.query(`UPDATE attendances SET state = $1 WHERE id = $2`, ['interested', rows[0].id]);
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
        
        return rows[0];
    } catch (err) {
        if (err instanceof DatabaseError) ErrorParse(err);
        else throw err
    }
}