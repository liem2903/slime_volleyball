import { NextFunction, Request, Response } from 'express';
import { lockSessionBusiness, kickPlayerBusiness, swapStatesBusiness, confirmPlayerBusiness, unlockSessionBusiness, changeCapacityBusiness } from '../business/adminBusiness';

export async function lockSession(req: Request, res: Response, next: NextFunction) {
    try {
        const { state } = req.body;
        const { sessionId } = req.params;

        await lockSessionBusiness(state, sessionId);
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
        const { waitlistId, interestedId, sessionId } = req.params;
        await swapStatesBusiness(waitlistId, interestedId, sessionId);

        res.status(200).json({success: true});
    } catch (err) {
        next(err);
    }
}

export async function confirmPlayer(req: Request, res: Response, next: NextFunction) {
    try {
        const { playerId, sessionId } = req.params;

        await confirmPlayerBusiness(playerId, sessionId);

        res.status(200).json({success: true});
    } catch (err) {
        next(err);
    }
}

export async function unlockSession(req: Request, res: Response, next: NextFunction) {
    try {
        const { sessionId } = req.params;

        await unlockSessionBusiness(sessionId);
        res.status(200).json({success: true});
    } catch (err) {
        next(err);
    }
}

export async function changeCapacity(req: Request, res: Response, next: NextFunction) {
    try {
        const { capacity } = req.body;
        const { sessionId } = req.params;

        await changeCapacityBusiness(capacity, sessionId);
        res.status(200).json({success: true});
    } catch (err) {
        next(err);
    }
}