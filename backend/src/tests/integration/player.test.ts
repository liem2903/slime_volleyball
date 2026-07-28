import { expect, test, describe, beforeAll } from "@jest/globals";
import request from 'supertest';
import { app } from '../../setup/app';
import { deleteSession, findSession, addSession, addPlayer, deletePlayer, getPlayers, getPlayersAndWaitlist } from './helpers/session.testHelper'
import { PlayerRequest, PlayerResponse, SessionRequest } from "../../utility/types";

const mock_session_with_court: SessionRequest = {
    host_name: "Jacob Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 20,
    court_name: "Olympic Park",
    date: "2026-07-10",
    host_email: "liemphan802@gmail.com",
}

const mock_session_with_capacity: SessionRequest = {
    host_name: "Jacob Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 5,
    court_name: "Olympic Park",
    date: "2026-07-10",
    host_email: "liemphan802@gmail.com",
}

// Tests for GET Player and GET WAITLIST --> should be same thing.
describe("Getting a player", () => {
    test("Happy Pathway", async () => {
        let session_id = await addSession(mock_session_with_court);
        let player_id = await addPlayer(session_id, crypto.randomUUID());
        try {
            let res = await request(app).get(`/api/players/${session_id}`);

            expect(res.status).toBe(200);
            expect(res.body.data[0].name).toBe("FILLER MAN");
        } finally {
            await deletePlayer(player_id, session_id);
            await deleteSession(session_id);
        }
    })
});

describe("POST: Creating a player - happy path", () => {
    test("Player is INTERESTED - happy path", async () => {        
        const session_id = await addSession(mock_session_with_court);

        const players: PlayerRequest[] = [
            {
                name: "Ben",
                email: "ben@gmail.com",
                session_id
            },
            {
                name: "Liem",
                email: "piggy@gmail.com",
                session_id
            },
            {
                name: "Bella",
                email: "bella@gmail.com",
                session_id
            }
        ]

        const player = await Promise.all(players.map(async (player) => {
            return await (request(app).post('/api/players/create').send(player));
        }))
        
        for (let res of player) {
            expect(res.status).toBe(200);
        }

        try {
            expect(await getPlayers(session_id)).toBe(3);
        } finally {
            for (const res of player) {
                await deletePlayer(res.body.data.id, session_id);
            }

            await deleteSession(session_id);
        }
    });

    test("Concurrent Joins", async () =>  { 
        const session_id = await addSession(mock_session_with_capacity);

        for (let i = 0; i < 5; i += 1) {            
            const results = await Promise.all(
                Array.from({length: 20}, async (_, i) => {
                    let player: PlayerRequest = {
                        name: `player ${i}`,
                        email: `player${i}@gmail.com`,
                        session_id
                    }

                    return request(app).post(`/api/players/create`).send(player);
                })
            )

            expect(await getPlayersAndWaitlist(session_id)).toMatchObject({
                interested_players: 5,
                waitlisted_players: 15,
                total_players: 5
            })

            for (const res of results) {
                expect(res.status).toBe(200);
                await deletePlayer(res.body.data.id, session_id);
            }
        }

        await deleteSession(session_id);
    })
})
