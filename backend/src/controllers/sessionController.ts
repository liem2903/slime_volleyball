import { NextFunction, Request, Response } from 'express';
import { getSessionBusiness, createSessionBusiness } from '../business/sessionBusiness';
import { Links } from '../utility/types'

export async function createSession(req: Request, res: Response, next: NextFunction) {
    try {
        let { capacity, date, time_start, time_end, cost_cents, host_email, host_name, court_name, host_is_player } = req.body;

        let links: Links = await createSessionBusiness(capacity, date, time_start, time_end, cost_cents, host_email, host_name, court_name, host_is_player);
        res.status(200).json({data: links});
    } catch (err) {
        next(err);       
    }
}

export async function getSession(req: Request, res: Response, next: NextFunction ) {
    try {
        const { sessionId } = req.params;
        
        const sessionDetails = await getSessionBusiness(sessionId);
        res.status(200).json({data: sessionDetails, success: true});
    } catch (err) {
        next(err);
    }
}
