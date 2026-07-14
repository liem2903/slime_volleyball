import { Request, Response } from 'express';
import { createSessionBusiness } from '../business/sessionBusiness';

type Links = {
    host_link: string;
    join_link: string;
}

export async function createSession(req: Request, res: Response) {
    try {
        let { capacity, date, startTime, endTime, price, email, username } = req.body;
        let links: Links = await createSessionBusiness(capacity, date, startTime, endTime, price, email, username);
        res.status(200).json(links);
    } catch (err) {
        console.error('createSession failed:', err);
        res.status(500).json({ error: 'Failed to create session' });
    }
}