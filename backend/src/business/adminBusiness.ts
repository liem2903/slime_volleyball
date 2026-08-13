import { lockSessionRepository, kickPlayerRepository, swapStatesRepository, confirmPlayerRepository } from '../data/adminRepository';

export async function lockSessionBusiness(state: string, sessionId: string) {
    await lockSessionRepository(state, sessionId);
}

export async function kickPlayerBusiness(playerId: string, sessionId: string) {
    await kickPlayerRepository(playerId, sessionId);
}

export async function swapStatesBusiness(waitlistId: string, interestedId: string, sessionId: string) {
    await swapStatesRepository(waitlistId, interestedId, sessionId);
}

export async function confirmPlayerBusiness(playerId: string, sessionId: string) {
    await confirmPlayerRepository(playerId, sessionId);
}