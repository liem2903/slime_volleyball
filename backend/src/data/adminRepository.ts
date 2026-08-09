import { pool } from "../setup/data";
import { BadRequestError } from "../errorHandling/error"
import { DatabaseError } from "pg";
import ErrorParse from '../errorHandling/DataBaseErrorParser';

export async function changeSessionStateRepository(state: string, sessionId: string) {
    const { rowCount } = await pool.query('SELECT * FROM sessions WHERE id = $1 AND state = $2', [sessionId, state]);

    if (rowCount == 1) throw new BadRequestError("Session is already in the suggested changed state", "REDUNDANT CHANGE");

    try {
        await pool.query('UPDATE sessions SET state = $1 WHERE id = $2', [state, sessionId]);
    } catch (err) {
        if (err instanceof DatabaseError) ErrorParse(err)
        else throw err;
    }
}

export async function kickPlayerRepository(playerId: string, sessionId: string) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        let { rows } = await client.query('SELECT player_count, capacity FROM sessions WHERE id = $1 FOR UPDATE', [sessionId]);

        const player_count = rows[0].player_count;
        const capacity =  rows[0].capacity;

        if (player_count == capacity) {
            let { rows } = await client.query(`SELECT id FROM attendances WHERE session_id = $1 AND state = $2 ORDER BY joined_at ASC LIMIT 1`, [sessionId, 'waitlist'])

            if (rows[0]) {
                await client.query(`UPDATE attendances SET state = $1 WHERE id = $2`, ['interested', rows[0].id]);
            } else {
                await client.query(`UPDATE sessions SET player_count = player_count - 1 WHERE id = $1`, [sessionId])
            }
        } else {
            let { rows } = await client.query('SELECT state FROM attendances WHERE id = $1', [playerId]);
                        
            if (rows[0].state == "interested") {
                await client.query('UPDATE sessions SET player_count = player_count - 1 WHERE id = $1', [sessionId]);
            }
        }

        await client.query('DELETE FROM attendances WHERE id = $1', [playerId]);
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        if (err instanceof DatabaseError) ErrorParse(err)
        else throw err;
    } finally {
        client.release();
    }
}


export async function swapStatesRepository(waitlistId: string, interestedId: string) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        // SWAP. SO LOCK IN BOTH ATTENDANCES FIRST. THEN SWAP. THEN BOOM.
        await client.query(`SELECT * FROM attendances WHERE id = $1 OR id = $2 FOR UPDATE`, [waitlistId, interestedId]);
        await client.query('UPDATE attendances SET state = $1 WHERE id = $2', ["interested", waitlistId]);

        await client.query('UPDATE attendances SET state = $1 WHERE id = $2', ["waitlist", interestedId]);
        console.log("SSS");

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");

        if (err instanceof DatabaseError) ErrorParse(err);
        else throw err;
    } finally {
        client.release();
    }
}