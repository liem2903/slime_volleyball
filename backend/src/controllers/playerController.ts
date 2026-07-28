import { NextFunction, Request, Response } from 'express';
import { getAttendance, createPlayerBusiness } from '../business/playerBusiness';
import { PlayerResponse } from '../utility/types';

export async function getPlayers(req: Request, res: Response, next: NextFunction) {
    try {
        const { sessionId } = req.params;
        const attendance_state = 'interested';
        const attendance_state_2 = 'confirmed';
        const players = await getAttendance(sessionId, attendance_state, attendance_state_2);

        res.status(200).json({data: players, success: true});
    } catch (err) {
        next(err);
    }
}

export async function getWaitlist(req: Request, res: Response, next: NextFunction) {
    try {
        const { sessionId } = req.params;
        const attendance_state = 'waitlist';
        const waitlist = await getAttendance(sessionId, attendance_state, undefined);

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