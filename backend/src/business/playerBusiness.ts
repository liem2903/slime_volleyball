import { getAttendanceData, createPlayerRepository } from '../data/playerRepository';
import { generateSHA256 } from '../utility/helper';
import { Player, PlayerResponse } from '../utility/types'

export async function getAttendance(sessionId: string, attendance_state: string, attendance_state_2: string | undefined): Promise<Player[]> {
    if (!attendance_state_2) {
        return await getAttendanceData(sessionId, attendance_state, undefined, false);
    } else {
        return await getAttendanceData(sessionId, attendance_state, attendance_state_2, true);
    }
}


export async function createPlayerBusiness(session_id: string, name: string, email: string): Promise<PlayerResponse> {
    let joined_at = new Date().toISOString();
    let user_token = crypto.randomUUID();
    let player_id = crypto.randomUUID();
    let user_link = `http://localhost:5173/player/${user_token}`;
    
    const user_token_hash = generateSHA256(user_token);
    
    await createPlayerRepository(session_id, name, email, joined_at, user_token_hash, player_id);

    return {
        id: player_id,
        name,
        email,
        session_id,
        joined_at,
        user_link,
    }
}