import { NextFunction, Request, Response } from 'express';
import { changeSessionStateBusiness, kickPlayerBusiness, swapStatesBusiness } from '../business/adminBusiness';

export async function changeSessionState(req: Request, res: Response, next: NextFunction) {
    try {
        const { state } = req.body;
        const { sessionId } = req.params;

        console.log(req.params);

        await changeSessionStateBusiness(state, sessionId);
        res.status(200).json({success: true});
    } catch (err) {
        next(err);
    }
}

export async function kickPlayer(req: Request, res: Response, next: NextFunction) {
    try {
        const { playerId, sessionId } = req.params;
        await kickPlayerBusiness(playerId, sessionId);

        res.status(200).json({success: true});
    } catch (err) {
        next(err);
    }
}

export async function swapStates(req: Request, res: Response, next: NextFunction) {
    try {
        const { waitlistId, interestedId } = req.params;
        await swapStatesBusiness(waitlistId, interestedId);

        res.status(200).json({success: true});
    } catch (err) {
        next(err);
    }
}