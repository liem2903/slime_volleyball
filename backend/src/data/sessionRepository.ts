import { Player, SessionDetails, SessionInformation } from "../types";
import  { pool } from "../data";
import { NotFoundError, InvalidParametersError } from "../error"
import { QueryResult } from "pg";

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
        throw new NotFoundError();
    }
}

export async function getSessionData(session_id: string): Promise<SessionInformation> {
    let session: QueryResult;
    
    try {
        session = await pool.query('SELECT * FROM sessions WHERE id = $1', [session_id]);
    } catch (err) {
        throw new NotFoundError();
    }   

    let session_data = session.rows[0]
    
    if (session.rowCount == 0) {
        throw new NotFoundError();
    }
    
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

export async function getAttendanceData(session_id: string, attendance_state: string, attendance_state_2: string | undefined, isTwoStates: boolean): Promise<Player[]> {
    let data: QueryResult;

    try {
        if (isTwoStates) {
            data = await pool.query(`SELECT id, name FROM attendances WHERE session_id = $1 AND (state = $2 OR state = $3)`, [ session_id, attendance_state, attendance_state_2]);
        } else {
            data = await pool.query(`SELECT id, name FROM attendances where session_id = $1 AND state = $2`, [session_id, attendance_state]);
        }
    } catch (err) {
        throw new NotFoundError();
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
}