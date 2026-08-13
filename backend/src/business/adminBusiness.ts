import { changeSessionStateRepository, kickPlayerRepository, swapStatesRepository } from '../data/adminRepository';

export async function changeSessionStateBusiness(state: string, sessionId: string) {
    await changeSessionStateRepository(state, sessionId);
}

export async function kickPlayerBusiness(playerId: string, sessionId: string) {
    await kickPlayerRepository(playerId, sessionId);
}

export async function swapStatesBusiness(waitlistId: string, interestedId: string, sessionId: string) {
    await swapStatesRepository(waitlistId, interestedId, sessionId);
}