import { getTeamsRepository } from '../data/teamsRepository';
import { TeamWithPlayers } from '../utility/types';

export async function getTeamsBusiness(sessionId: string): Promise<TeamWithPlayers[]> {
    return await getTeamsRepository(sessionId);
}
