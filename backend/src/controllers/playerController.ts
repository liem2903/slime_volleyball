import { NextFunction, Request, Response } from 'express';
import { createPlayerBusiness, getWaitlistBusiness, getPlayersBusiness, deletePlayerBusiness } from '../business/playerBusiness';
import { PlayerResponse } from '../utility/types';

export async function getPlayers(req: Request, res: Response, next: NextFunction) {
    try {
        const { sessionId } = req.params;
        const players = await getPlayersBusiness(sessionId);
        res.status(200).json({data: players, success: true});
    } catch (err) {
        next(err);
    }
}

export async function getWaitlist(req: Request, res: Response, next: NextFunction) {
    try {
        const { sessionId } = req.params;
        const waitlist = await getWaitlistBusiness(sessionId);

        res.status(200).json({data: waitlist, success: true})
    } catch (err) {
        next(err);
    }
}

export async function createPlayer(req: Request, res: Response, next: NextFunction) {
    try {
        const { session_id, name, email } = req.body; 

        let data: PlayerResponse = await createPlayerBusiness(session_id, name, email);
        res.status(200).json({data, success: true});
    } catch (err) {
        next(err);
    }
}

export async function deletePlayer(req: Request, res: Response, next: NextFunction) {
    try {
        const { playerId, sessionId } = req.params;
        await deletePlayerBusiness(playerId, sessionId); 

        res.status(200).json({success: true});
    } catch (err) {
        next(err);
    }
}