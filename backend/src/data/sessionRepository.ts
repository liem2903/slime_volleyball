import { SessionBusinessRequest, SessionRequest, SessionResult } from "../utility/types";
import  { pool } from "../setup/data";
import { NotFoundError } from "../errorHandling/error"
import { DatabaseError, QueryResult } from "pg";
import ErrorParse from '../errorHandling/DataBaseErrorParser';

export async function createSessionData(session_data: SessionBusinessRequest) {
    try {
        await pool.query(
        `INSERT INTO sessions (id, host_name, host_email, created_at, admin_token_hash, time_start, time_end, cost_cents, capacity, date, court_name, player_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
            session_data.court_name,
            session_data.player_count
        ]);
    } catch (err) {        
        if (err instanceof DatabaseError) ErrorParse(err); 
        else throw err;
    }
}

export async function getSessionData(session_id: string): Promise<SessionResult> {
    let session: QueryResult;
    
    try {
        session = await pool.query('SELECT * FROM sessions WHERE id = $1', [session_id]);
        
        if (session.rowCount == 0) {     
            throw new NotFoundError                                                                                                  
        }

        let session_data = session.rows[0]
        
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
            player_count: session_data.player_count,
        }   
    } catch (err) {
        if (err instanceof DatabaseError) ErrorParse(err)
        else throw err;
    }
}

export async function checkIsAdmin(session_id: string, admin_token_hash: string): Promise<Boolean> {
    const { rowCount } = await pool.query('SELECT * FROM sessions WHERE id = $1 AND admin_token_hash = $2', [session_id, admin_token_hash]);
    return rowCount == 1;
}