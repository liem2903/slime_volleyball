import { expect, test, describe, beforeAll } from "@jest/globals";
import request from 'supertest';
import { app } from '../../setup/app';
import { deleteSession, addSession, addInterestedPlayer, deletePlayer, getPlayerCount, getPlayersAndWaitlist, getPlayerId, doesPlayerExist, addWaitlistedPlayer, lockSession, getPlayerState, getPricePerPlayer, addPaymentPendingPlayer, setSessionState, getPlayerPositions, getPlayerAssignedPosition} from './helpers/session.testHelper'
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

const mock_session_with_three_capacity: SessionRequest = {
    host_name: "Jacob Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 4,
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

const mock_session_host_not_full: SessionRequest = {
    host_name: "Jacob Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 20,
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
    });

    test("Locked session - payment pending players are still returned with their state", async () => {
        let session_id = await addSession(mock_session_with_court);
        let player = await addPaymentPendingPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");
        await lockSession(session_id);
        try {
            let res = await request(app).get(`/api/players/${session_id}`);

            expect(res.status).toBe(200);
            expect(res.body.data[0].name).toBe("FILLER MAN");
            expect(res.body.data[0].state).toBe("payment_pending");
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });
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
            expect(await getPlayerCount(session_id)).toBe(3);
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
            expect(await getPlayerCount(session_id)).toBe(1);
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

    test("Player Join when session is locked", async () => {
        const session_id = await addSession(mock_session_host_not_full);

        const player = {
            name: "Ben",
            email: "ben@gmail.com",
            session_id
        };

        await lockSession(session_id);
        const res = await request(app).post(`/api/players/create`).send(player);

        try {   
            expect(res.status).toBe(200);
            expect(await getPlayerState(res.body.data.id)).toBe("waitlist");
        } finally {
            deletePlayer(res.body.data.id, session_id);
            deleteSession(session_id);
        }
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
            expect(await getPlayerCount(session_id)).toEqual(0);
        } finally {
            await deleteSession(session_id);
        }
    });

    test("Happy Path: Player Drops Out - Waitlist player gets promoted", async () => {
        const session_id = await addSession(mock_session_with_one_capacity);
        const winston_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");
        const shrivel_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan803@gmail.com");
        
        await request(app).delete(`/api/players/delete/${session_id}/${winston_player.hash}`);
        expect(await getPlayerCount(session_id)).toBe(1);
        await request(app).delete(`/api/players/delete/${session_id}/${shrivel_player.hash}`);
        expect(await getPlayerCount(session_id)).toBe(0);
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

                expect(await getPlayerCount(session_id)).toBe(1);
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

    test("Player leaves when session is locked with waitlist", async () => {
        const session_id = await addSession(mock_session_with_two_capacity);
        const shrivel_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan803@gmail.com");
        const bella_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan807@gmail.com");
        const ben_player = await addWaitlistedPlayer(session_id, crypto.randomUUID(), "liemphan804@gmail.com");

        try {
            await lockSession(session_id);

            const res = await request(app).delete(`/api/players/delete/${session_id}/${shrivel_player.hash}`);

            expect(res.status).toBe(200);
            expect(await getPlayerState(ben_player.id)).toBe("payment_pending");
        } catch (err) {
            await deletePlayer(shrivel_player.id, session_id);
            throw err;
        } finally {
            await deletePlayer(bella_player.id, session_id);
            await deletePlayer(ben_player.id, session_id);
            await deleteSession(session_id)
        }
    });

    test("Player leaves when session is locked with no waitlist. Price remains same.", async () => {
        const session_id = await addSession(mock_session_with_two_capacity);
        const shrivel_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan803@gmail.com");
        const bella_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan807@gmail.com");
        const ben_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan804@gmail.com");
        
        try {
            await lockSession(session_id);
            expect(await getPricePerPlayer(session_id)).toBe(50);

            const res = await request(app).delete(`/api/players/delete/${session_id}/${shrivel_player.hash}`);

            expect(res.status).toBe(200);
            expect(await getPricePerPlayer(session_id)).toBe(50);
        } finally {
            await deletePlayer(bella_player.id, session_id);
            await deletePlayer(ben_player.id, session_id);
        }
    })
});

// Player Sets Position Preference.
describe("PATCH: Setting position preferences", () => {
    test("Happy Path: First time setting position preference", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "oppo" });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: "middle",
                secondary_position: "oppo"
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Happy Path: Changing an already-set position preference overwrites it", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "oppo" });

            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "lib", secondary_position: "outside" });

            expect(res.status).toBe(200);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: "lib",
                secondary_position: "outside"
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Happy Path: Preference can be changed repeatedly, last write wins", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        const sequence = [
            { primary_position: "middle", secondary_position: "oppo" },
            { primary_position: "outside", secondary_position: "lib" },
            { primary_position: "lib", secondary_position: "middle" },
        ];

        try {
            for (const body of sequence) {
                const res = await request(app)
                    .patch(`/api/players/positions/${session_id}/${player.hash}`)
                    .send(body);
                expect(res.status).toBe(200);
            }

            expect(await getPlayerPositions(player.id)).toEqual(sequence[sequence.length - 1]);
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test.each([
        ["middle", "oppo"],
        ["oppo", "outside"],
        ["outside", "lib"],
        ["lib", "middle"],
    ])("Happy Path: '%s' is accepted as primary_position", async (primary_position, secondary_position) => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position, secondary_position });

            expect(res.status).toBe(200);
            expect(await getPlayerPositions(player.id)).toEqual({ primary_position, secondary_position });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Happy Path: Allowed while session is locked", async () => {
        const session_id = await addSession(mock_session_with_two_capacity);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");
        const other_player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan803@gmail.com");

        try {
            await lockSession(session_id);

            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "oppo" });

            expect(res.status).toBe(200);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: "middle",
                secondary_position: "oppo"
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deletePlayer(other_player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Happy Path: Allowed while session is completed", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            await setSessionState(session_id, "completed");

            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "oppo" });

            expect(res.status).toBe(200);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: "middle",
                secondary_position: "oppo"
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Happy Path: A waitlisted player can set their position preference", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addWaitlistedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "oppo" });

            expect(res.status).toBe(200);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: "middle",
                secondary_position: "oppo"
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Happy Path: Allowed while session is cancelled", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            await setSessionState(session_id, "cancelled");

            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "oppo" });

            expect(res.status).toBe(200);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: "middle",
                secondary_position: "oppo"
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Extraneous fields such as assigned_position are ignored, not written", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "oppo", assigned_position: "lib" });

            expect(res.status).toBe(200);
            expect(await getPlayerAssignedPosition(player.id)).toBeNull();
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });
});

describe("PATCH: Setting position preferences - validation errors", () => {
    test("Rejects when primary_position equals secondary_position", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "middle" });

            expect(res.status).toBe(400);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: null,
                secondary_position: null
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Rejects an invalid primary_position value", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "setter", secondary_position: "oppo" });

            expect(res.status).toBe(400);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: null,
                secondary_position: null
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Rejects an invalid secondary_position value", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "setter" });

            expect(res.status).toBe(400);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: null,
                secondary_position: null
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Rejects when primary_position is missing", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ secondary_position: "oppo" });

            expect(res.status).toBe(400);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: null,
                secondary_position: null
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Rejects when secondary_position is missing", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle" });

            expect(res.status).toBe(400);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: null,
                secondary_position: null
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Rejects an empty body", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({});

            expect(res.status).toBe(400);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: null,
                secondary_position: null
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Rejects an incorrectly-cased primary_position value", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "Middle", secondary_position: "oppo" });

            expect(res.status).toBe(400);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: null,
                secondary_position: null
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Rejects an incorrectly-cased secondary_position value", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "Oppo" });

            expect(res.status).toBe(400);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: null,
                secondary_position: null
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });
});

describe("PATCH: Setting position preferences - identity errors", () => {
    test("Rejects a non-existent sessionId", async () => {
        const res = await request(app)
            .patch(`/api/players/positions/${crypto.randomUUID()}/${crypto.randomUUID()}`)
            .send({ primary_position: "middle", secondary_position: "oppo" });

        expect(res.status).toBe(404);
    });

    test("Rejects an unknown userToken", async () => {
        const session_id = await addSession(mock_session_with_court);

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${crypto.randomUUID()}`)
                .send({ primary_position: "middle", secondary_position: "oppo" });

            expect(res.status).toBe(404);
        } finally {
            await deleteSession(session_id);
        }
    });

    test("Rejects a userToken that belongs to a different session", async () => {
        const session_id = await addSession(mock_session_with_court);
        const other_session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(other_session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "oppo" });

            expect(res.status).toBe(404);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: null,
                secondary_position: null
            });
        } finally {
            await deletePlayer(player.id, other_session_id);
            await deleteSession(session_id);
            await deleteSession(other_session_id);
        }
    });
});

describe("PATCH: Setting position preferences - frozen once session reaches 'teams' state", () => {
    test("Rejects changing an already-set preference once session is in 'teams' state", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "oppo" });

            await setSessionState(session_id, "teams");

            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "lib", secondary_position: "outside" });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/teams/i);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: "middle",
                secondary_position: "oppo"
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });

    test("Rejects a first-time preference set once session is in 'teams' state", async () => {
        const session_id = await addSession(mock_session_with_court);
        const player = await addInterestedPlayer(session_id, crypto.randomUUID(), "liemphan802@gmail.com");

        try {
            await setSessionState(session_id, "teams");

            const res = await request(app)
                .patch(`/api/players/positions/${session_id}/${player.hash}`)
                .send({ primary_position: "middle", secondary_position: "oppo" });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/teams/i);
            expect(await getPlayerPositions(player.id)).toEqual({
                primary_position: null,
                secondary_position: null
            });
        } finally {
            await deletePlayer(player.id, session_id);
            await deleteSession(session_id);
        }
    });
});
