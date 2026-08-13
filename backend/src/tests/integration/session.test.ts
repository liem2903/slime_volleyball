import { expect, test, describe } from "@jest/globals";

import { SessionRequest } from "../../utility/types";
import request from 'supertest';
import { app } from '../../setup/app';
import { deleteSession, findSession, addSession } from './helpers/session.testHelper'

const mock_session_with_court: SessionRequest = {
    host_name: "Liem Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 20,
    court_name: "Olympic Park",
    date: "2026-07-10",
    host_email: "liemphan802@gmail.com",
    host_is_player: true,
}

const mock_session_with_invalid_email: SessionRequest = {
    host_name: "Liem Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 20,
    date: "2026-07-10",
    host_email: "liemp80gmail.com",
    court_name: "Olympic Park",
    host_is_player: true,
}

// Tests for session. 
describe("Posting a session", () => {
    test("post ./create Happy Case with Court Name", async () => {
        let session_id: string | undefined;
        try {
            let res = await request(app).post('/api/session/create').send(mock_session_with_court);
            expect(res.status).toBe(200);
            expect(res.body.data).toMatchObject({
                host_link: expect.any(String),
                join_link: expect.any(String),
                session_id: expect.any(String)
            })

            session_id = res.body.data.session_id as string
            const data = (await findSession(session_id));

            expect(data).toMatchObject({
                id: session_id,
                host_name: "Liem Phan",
                time_start: new Date("2026-07-10T00:26:00.000Z"),
                time_end: new Date("2026-07-10T01:36:00.000Z"),
                cost_cents: 20000,
                capacity: 20,
                court_name: "Olympic Park",
                date: new Date("2026-07-09T14:00:00.000Z")
            });
        } finally {
            if (session_id) await deleteSession(session_id);
        }
    })

    test("ZOD catches error", async () => {
        let res = await request(app).post('/api/session/create').send(mock_session_with_invalid_email);
        expect(res.status).toBe(400);
    })
})

// Tests for GET SESSION.
describe("Getting a session", () => {
    test("Happy Path", async () => {
        const session_id = await addSession(mock_session_with_court);
        try {
            let res = await request(app).get(`/api/session/${session_id}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toMatchObject({
                id: session_id,
                host_name: "Liem Phan",
                admin_token_hash: "hello",
                time_start: "2026-07-10T01:36:00.000Z",
                time_end: "2026-07-10T01:36:00.000Z",
                cost_cents: 100,
                capacity: 20,
                court_name: "Olympic Park",
                date: "2026-07-09T14:00:00.000Z"
            });
        } finally {
            await deleteSession(session_id);
        }
    });
});


describe("Session marked as completed once all players have paid", () => {

});