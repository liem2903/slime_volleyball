import { lockSessionRepository, kickPlayerRepository, swapStatesRepository, confirmPlayerRepository, unlockSessionRepository, changeCapacityRepository, moveToTeamsRepository, assignTeamRepository } from '../data/adminRepository';
import { TeamInput } from '../utility/types';
import crypto from 'crypto';

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

export async function unlockSessionBusiness(sessionId: string) {
    await unlockSessionRepository(sessionId);
}

export async function changeCapacityBusiness(capacity: number, sessionId: string) {
    await changeCapacityRepository(capacity, sessionId);
}

export async function moveToTeamsBusiness(teams: TeamInput[], sessionId: string) {
    const teamsWithIds = teams.map(team => ({
        id: crypto.randomUUID(),
        name: team.name,
        color: team.color ?? null,
        capacity: team.capacity,
    }));

    await moveToTeamsRepository(teamsWithIds, sessionId);
}

export async function assignTeamBusiness(playerId: string, teamId: string, sessionId: string) {
    await assignTeamRepository(playerId, teamId, sessionId);
}