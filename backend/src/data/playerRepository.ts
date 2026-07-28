import { Player, PlayerResponse } from "../utility/types";
import  { pool } from "../setup/data";
import { NotFoundError } from "../errorHandling/error"
import { DatabaseError, QueryResult } from "pg";
import ErrorParse from '../errorHandling/DataBaseErrorParser';
import { Console } from "console";

export async function getAttendanceData(session_id: string, attendance_state: string, attendance_state_2: string | undefined, isTwoStates: boolean): Promise<Player[]> {
    let data: QueryResult;

    try {
        if (isTwoStates) {
            data = await pool.query(`SELECT id, name FROM attendances WHERE session_id = $1 AND (state = $2 OR state = $3)`, [ session_id, attendance_state, attendance_state_2]);
        } else {
            data = await pool.query(`SELECT id, name FROM attendances where session_id = $1 AND state = $2`, [session_id, attendance_state]);
        }

        if (data.rowCount == 0) {
            throw new NotFoundError();
        }
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

export async function createPlayerRepository(session_id: string, name: string, email: string, joined_at: string, user_token_hash: string, player_id: string) {
    try {         
        const { rowCount } = await pool.query(`UPDATE sessions SET player_count = player_count + 1 WHERE id = $1 AND player_count < capacity`, [session_id]);        
        const attendance_state = rowCount == 1 ? "interested" : "waitlist";
        await pool.query(`INSERT INTO attendances (id, name, email, user_token_hash, state, session_id, joined_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [player_id, name, email, user_token_hash, attendance_state, session_id, joined_at]);
    } catch (err) {
        console.log(err);

        if (err instanceof DatabaseError) ErrorParse(err);
        else throw err;
    }   
}