import { createPlayerRepository, getPlayerRepository, getWaitlistRepository, deletePlayerRepository, getIdFromTokenRepository, setPositionsRepository } from '../data/playerRepository';
import { generateSHA256 } from '../utility/helper';
import { Player, PlayerPosition, PlayerResponse, WaitList } from '../utility/types';
import crypto from 'crypto';

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
    let user_link = `http://localhost:5173/player/${session_id}/${user_token}`;
    
    const user_token_hash = generateSHA256(user_token);
    
    let user_state = await createPlayerRepository(session_id, name, email, joined_at, user_token_hash, player_id);

    return {
        id: player_id,
        name,
        email,
        session_id,
        joined_at,
        user_link,
        user_state
    }
}

export async function deletePlayerBusiness(encryptedToken: string, sessionId: string) {
    await deletePlayerRepository(encryptedToken, sessionId);
}

export async function getIdFromTokenBusiness(encryptedToken: string) {
    return await getIdFromTokenRepository(encryptedToken);
}

export async function setPositionsBusiness(encryptedToken: string, sessionId: string, primaryPosition: PlayerPosition, secondaryPosition: PlayerPosition) {
    await setPositionsRepository(encryptedToken, sessionId, primaryPosition, secondaryPosition);
}