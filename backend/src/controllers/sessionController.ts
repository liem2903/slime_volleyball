import { NextFunction, Request, Response } from 'express';
import { getSessionBusiness, createSessionBusiness, getAttendance } from '../business/sessionBusiness';
import { NotFoundError } from '../error';

type Links = {
    host_link: string;
    join_link: string;
}

export async function createSession(req: Request, res: Response, next: NextFunction) {
    try {
        let { capacity, date, startTime, endTime, price, email, username, courtName } = req.body;
        let links: Links = await createSessionBusiness(capacity, date, startTime, endTime, price, email, username, courtName);
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

        res.status(200).json({data: waitlist, isGood: true})
    } catch (err) {
        next(err);
    }
}