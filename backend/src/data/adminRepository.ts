import { pool } from "../setup/data";
import { BadRequestError, InvalidParametersError, NotFoundError } from "../errorHandling/error"
import { DatabaseError } from "pg";
import ErrorParse from '../errorHandling/DataBaseErrorParser';

export async function lockSessionRepository(state: string, sessionId: string) {
    const client = await pool.connect();

    try {
        client.query('BEGIN');

        const { rows: broken_session } = (await client.query('SELECT * FROM sessions WHERE id = $1 AND state = $2', [sessionId, state]))

        if (broken_session.length != 0) throw new BadRequestError("Session is already in the suggested changed state", "REDUNDANT CHANGE");
        
        const { rows: session_data } = (await client.query('SELECT cost_cents, player_count FROM sessions WHERE id = $1 FOR UPDATE', [sessionId]))

        if (session_data[0].player_count < 2) throw new BadRequestError("Not enough players to lock", "NOT ENOUGH PLAYERS"); 

        await client.query('UPDATE sessions SET state = $1 WHERE id = $2', [state, sessionId]);

        // I want to set the price - so I have to calculate COST_CENTS / PLAYER_COUNT
        const price : Number = Math.ceil(((Number((session_data[0].cost_cents)) / Number(session_data[0].player_count))));
        
        await client.query('UPDATE sessions SET price_per_player = $1 WHERE id = $2', [price, sessionId]);
        await client.query('UPDATE attendances SET state = $1 WHERE session_id = $2 AND state = $3', ["payment_pending", sessionId, "interested"] );
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');

        if (err instanceof DatabaseError) ErrorParse(err)
        else throw err;
    } finally {
        client.release();
    }
}

export async function kickPlayerRepository(playerId: string, sessionId: string) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { rows: session_data } = await client.query('SELECT player_count, capacity, state FROM sessions WHERE id = $1 FOR UPDATE', [sessionId]);

        if (session_data.length === 0 || (await client.query('SELECT * FROM attendances WHERE id = $1', [playerId])).rows.length === 0) throw new InvalidParametersError();
        if (session_data[0].state != "unlocked") throw new BadRequestError("Session state is not unlocked", "WRONG STATE");

        const player_count = session_data[0].player_count;
        const capacity =  session_data[0].capacity;

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


export async function swapStatesRepository(waitlistId: string, interestedId: string, sessionId: string) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
         
        const { rows: waitlistedPlayer } = await client.query(`SELECT state FROM attendances WHERE id = $1 FOR UPDATE`, [waitlistId]);
        const { rows: interestedPlayer } = await client.query(`SELECT state FROM attendances WHERE id = $1 FOR UPDATE`, [interestedId]);

        if (waitlistedPlayer[0].length === 0 || interestedPlayer[0].length === 0 || waitlistedPlayer[0].state != "waitlist" || interestedPlayer[0].state != "interested") throw new InvalidParametersError(); 

        if (((await client.query('SELECT state FROM sessions WHERE id = $1', [sessionId])).rows[0].state) != "unlocked") throw new BadRequestError("Locked state can not swap players", "Wrong State");

        await client.query('UPDATE attendances SET state = $1 WHERE id = $2', ["interested", waitlistId]);
        await client.query('UPDATE attendances SET state = $1 WHERE id = $2', ["waitlist", interestedId]);

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");

        if (err instanceof DatabaseError) ErrorParse(err);
        else throw err;
    } finally {
        client.release();
    }
}

// Confirm player.

// Check if all players have been confirmed --> IF HAVE THEN SET SESSION TO COMPLETE.

export async function confirmPlayerRepository(playerId: string, sessionId: string) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows: sessionData } = await client.query('SELECT state, id FROM sessions WHERE id = $1 FOR UPDATE', [sessionId]);

        if (sessionData.length == 0) throw new InvalidParametersError();
        if (sessionData[0].state != "locked") throw new BadRequestError("Player is not in locked session", "State Error");

        const { rows: playerData } = await client.query('SELECT state FROM attendances WHERE id = $1 AND session_id = $2', [playerId, sessionId]);

        if (playerData.length == 0) throw new NotFoundError();
        if (playerData[0].state != "payment_pending") throw new BadRequestError("Player is not in locked session", "State Error");

        await client.query('UPDATE attendances SET state = $1 WHERE id = $2', ["confirmed", playerId]);

        if ((await client.query('SELECT id FROM attendances WHERE session_id = $1 AND state = $2', [sessionId, "payment_pending"])).rows.length == 0) {            
            await client.query('UPDATE sessions SET state = $1 WHERE id = $2', ["completed", sessionId])
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');

        if (err instanceof DatabaseError) ErrorParse(err);
        else throw err;
    } finally {
        client.release();
    }
}