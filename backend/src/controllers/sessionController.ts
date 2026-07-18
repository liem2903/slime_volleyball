import { Request, Response } from 'express';
import { getSessionBusiness, createSessionBusiness } from '../business/sessionBusiness';

type Links = {
    host_link: string;
    join_link: string;
}

export async function createSession(req: Request, res: Response) {
    try {
        let { capacity, date, startTime, endTime, price, email, username, courtName } = req.body;
        let links: Links = await createSessionBusiness(capacity, date, startTime, endTime, price, email, username, courtName);
        res.status(200).json(links);
    } catch (err) {
        console.error('createSession failed:', err);
        res.status(500).json({ error: 'Failed to create session' });
    }
}

export async function getSession(req: Request, res: Response) {
    try {
        const { sessionId } = req.params;
        console.log(sessionId);

        const sessionDetails = await getSessionBusiness(sessionId);
        res.status(200).json({data: sessionDetails, success: true});
    } catch (err) {
        res.status(400).json({error: err});
    }
}