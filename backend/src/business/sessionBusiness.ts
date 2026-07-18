import { createSessionData, getSessionData } from '../data/sessionRepository';
import { Links, SessionDetails, SessionInformation } from '../types'

export async function createSessionBusiness(capacity: number, date: string, startTime: string, endTime: string, price: number, email: string, name: string, courtName?: string): Promise<Links> {
    // So I need to generate session ID with code - and generate my two links.
    const created_at = new Date().toISOString();
    const time_start = new Date(`${date}T${startTime}`).toISOString();
    const time_end = new Date(`${date}T${endTime}`).toISOString();

    const session_id = crypto.randomUUID();
    const opaque_token = crypto.randomUUID();
    // GENERATE USER LINK FOR SESSION.
    const user_link = `http://localhost:5173/session/${session_id}`;
    // GENERATE ADMIN LINK FOR SESSION. 
    const admin_link = `http://localhost:5173/session/${session_id}/${opaque_token}`;

    const session_data: SessionDetails = {
        id: session_id,
        host_name: name,
        host_email: email,
        created_at,
        admin_token_hash: opaque_token,
        time_start,
        time_end,
        cost_cents: price,
        capacity,
        court_name: courtName,
        date,
    }

    await createSessionData(session_data);

    return {
        host_link: admin_link,
        join_link: user_link
    }
}

export async function getSessionBusiness(sessionId: string): Promise<SessionInformation> {    
    return await getSessionData(sessionId);
}