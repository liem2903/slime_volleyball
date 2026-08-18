import { NextFunction, Request, Response } from 'express';
import { getTeamsBusiness } from '../business/teamsBusiness';

export async function getTeams(req: Request, res: Response, next: NextFunction) {
    try {
        const { sessionId } = req.params;
        const teams = await getTeamsBusiness(sessionId);
        res.status(200).json({ data: teams, success: true });
    } catch (err) {
        next(err);
    }
}
