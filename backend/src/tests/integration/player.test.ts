import { expect, test, describe, beforeAll } from "@jest/globals";
import request from 'supertest';
import { app } from '../../setup/app';
import { deleteSession, addSession, addInterestedPlayer, deletePlayer, getPlayers, getPlayersAndWaitlist, getPlayerId, doesPlayerExist, addWaitlistedPlayer} from './helpers/session.testHelper'
import { PlayerRequest, SessionRequest } from "../../utility/types";

const mock_session_with_court: SessionRequest = {
    host_name: "Jacob Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 20,
    court_name: "Olympic Park",
    date: "2026-07-10",
    host_email: "liemphan802@gmail.com",
    host_is_player: true,
}

const mock_session_with_capacity: SessionRequest = {
    host_name: "Jacob Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 6,
    court_name: "Olympic Park",
    date: "2026-07-10",
    host_email: "liemphan802@gmail.com",
    host_is_player: true,
}

const mock_session_with_one_capacity: SessionRequest = {
    host_name: "Jacob Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 2,
    court_name: "Olympic Park",
    date: "2026-07-10",
    host_email: "liemphan802@gmail.com",
    host_is_player: true,
}

const mock_session_with_two_capacity: SessionRequest = {
    host_name: "Jacob Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 3,
    court_name: "Olympic Park",
    date: "2026-07-10",
    host_email: "liemphan802@gmail.com",
    host_is_player: true,
} 

const mock_session_host_not_player: SessionRequest = {
    host_name: "Jacob Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 1,
    court_name: "Olympic Park",
    date: "2026-07-10",
    host_email: "liemphan802@gmail.com",
    host_is_player: false,
} 

// Tests for GET Player and GET WAITLIST --> should be same thing.
describe("Getting a player", () => {
    test("Happy Pathway", async () => {
        let session_id = await addSession(mock_session_with_court);
        let player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");
        try {
            let res = await request(app).get(`/api/players/${session_id}`);

            expect(res.status).toBe(200);
            expect(res.body.data[0].name).toBe("FILLER MAN");
        } finally {
            await deletePlayer(player.id, session_id);
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

    test("Host not a player", async () => {        
        const session_id = await addSession(mock_session_host_not_player);

        const ben_player: PlayerRequest = {
                name: "Ben",
                email: "ben@gmail.com",
                session_id
        }

        const res = await (request(app).post('/api/players/create').send(ben_player));
       
        try {
            expect(await getPlayers(session_id)).toBe(1);
        } finally {
            await deletePlayer(res.body.data.id, session_id);
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
                total_players: 6
            })

            for (const res of results) {
                expect(res.status).toBe(200);
                await deletePlayer(res.body.data.id, session_id);
            }
        }

        await deleteSession(session_id);
    })
})

// Player Drop Out.
describe("DELETE: Player Drops Out", () => {
    test("Happy Path: Player Drops Out - No Waitlist", async () => {
        const session_id = await addSession(mock_session_with_capacity);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app).delete(`/api/players/delete/${session_id}/${player.hash}`);
            expect(res.status).toBe(200);
            expect(await getPlayers(session_id)).toEqual(0);
        } catch(err) {
            await deletePlayer(player.id, session_id);
        } finally {
            await deleteSession(session_id);
        }
    });

    test("Happy Path: Player Drops Out - Waitlist player gets promoted", async () => {
        const session_id = await addSession(mock_session_with_one_capacity);
        const winston_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");
        const shrivel_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan803@gmail.com");
        
        await request(app).delete(`/api/players/delete/${session_id}/${winston_player.hash}`);
        expect(await getPlayers(session_id)).toBe(1);
        await request(app).delete(`/api/players/delete/${session_id}/${shrivel_player.hash}`);
        expect(await getPlayers(session_id)).toBe(0);
        await deleteSession(session_id);
    });

    test("Happy Path: Player Drops Out - race conditions", async () => {
        const session_id = await addSession(mock_session_with_two_capacity);

        for (let i = 0; i < 2; i += 1) {
            const winston_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");
            const shrivel_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan803@gmail.com");
            const ben_player = await addWaitlistedPlayer(session_id, crypto.randomUUID(), "liemphan804@gmail.com");

            const deleting_ids = [winston_player.hash, shrivel_player.hash]
            
            try {
                let res = await Promise.all(deleting_ids.map((hash) => {
                    return request(app).delete(`/api/players/delete/${session_id}/${hash}`);
                }))

                for (let r of res) {
                    expect(r.status).toBe(200);
                }

                expect(await getPlayers(session_id)).toBe(1);
                expect(await getPlayerId(session_id)).toEqual(ben_player.id);
            } catch (err) {
                for (const id of deleting_ids) {
                    if (await doesPlayerExist(id)) await deletePlayer(id, session_id);
                }

                expect(1).toEqual(2);
            } finally {
                await deletePlayer(ben_player.id, session_id);
            }
        }

        await deleteSession(session_id);
    });
});
 