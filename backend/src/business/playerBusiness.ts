import { createPlayerRepository, getPlayerRepository, getWaitlistRepository, deletePlayerRepository } from '../data/playerRepository';
import { generateSHA256 } from '../utility/helper';
import { Player, PlayerResponse, WaitList } from '../utility/types'

export async function getPlayersBusiness(sessionId: string): Promise<Player[]> {
    return await getPlayerRepository(sessionId);
}

export async function getWaitlistBusiness(sessionId: string): Promise<WaitList[]> {
    return await getWaitlistRepository(sessionId);
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

export async function deletePlayerBusiness(playerId: string, sessionId: string) {
    await deletePlayerRepository(playerId, sessionId);
}