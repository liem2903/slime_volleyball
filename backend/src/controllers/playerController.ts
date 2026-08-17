import { NextFunction, Request, Response } from 'express';
import { createPlayerBusiness, getWaitlistBusiness, getPlayersBusiness, deletePlayerBusiness, getIdFromTokenBusiness, setPositionsBusiness } from '../business/playerBusiness';
import { PlayerResponse } from '../utility/types';
import { generateSHA256 } from '../utility/helper';

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
        const { userToken, sessionId } = req.params;
        
        const encryptedToken = generateSHA256(userToken);

        await deletePlayerBusiness(encryptedToken, sessionId); 

        res.status(200).json({success: true});
    } catch (err) {
        next(err);
    }
}

export async function getIdFromToken(req: Request, res: Response, next: NextFunction) {
    try {
        const { userToken } = req.params;

        let data = await getIdFromTokenBusiness(generateSHA256(userToken));
        res.status(200).json({data, success: true});
    } catch (err) {
        next(err);
    }
}

export async function setPositions(req: Request, res: Response, next: NextFunction) {
    try {
        const { sessionId, userToken } = req.params;
        const { primary_position, secondary_position } = req.body;

        const encryptedToken = generateSHA256(userToken);

        await setPositionsBusiness(encryptedToken, sessionId, primary_position, secondary_position);

        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
}