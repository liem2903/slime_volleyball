import { expect, test, describe, beforeEach, afterEach } from "@jest/globals";

import { SessionRequest } from "../../utility/types";
import request from 'supertest';
import { app } from '../../setup/app';
import { addAdminSession, addInterestedPlayer, addWaitlistedPlayer, deletePlayer, deleteSession, doesPlayerExist, getPlayerState, getSessionState, lockSession, getPlayerCount, getSessionPlayerCount, getPricePerPlayer, addPaymentPendingPlayer, markPlayerPaid, getSessionCapacity, getPlayersAndWaitlist } from './helpers/session.testHelper'
import e from "express";
import expectCookies from "supertest/lib/cookies";

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

const mock_session_with_court_capacity: SessionRequest = {
    host_name: "Liem Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 3,
    court_name: "Olympic Park",
    date: "2026-07-10",
    host_email: "liemphan802@gmail.com",
    host_is_player: true,
}

const mock_session_with_court_capacity_2: SessionRequest = {
    host_name: "Liem Phan",
    time_start: "10:26:00",
    time_end: "11:36:00",
    cost_cents: 200,
    capacity: 3,
    court_name: "Olympic Park",
    date: "2026-07-10",
    host_email: "liemphan802@gmail.com",
    host_is_player: true,
}

describe("Patching a session state", () => {
    test("Happy Path", async () => {
        const {id, hash} = await addAdminSession(mock_session_with_court);
        const {id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "interest@gmail.com");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/lockSession`).send({state: 'locked'});
            
            expect(res.status).toBe(200);
            expect(await getSessionState(id)).toBe('locked');
            expect(await getPlayerState(player_2_id)).toBe("payment_pending");
        } finally {
            await deletePlayer(player_2_id, id);
            await deleteSession(id);
        }
    })

    test("Changing to state that it's already in", async () => {
        const {id, hash} = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/lockSession`).send({state: 'unlocked'});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Session is already in the suggested changed state");
        } finally {
            await deleteSession(id);
        }
    });

    test("Trying to change state when you don't have access", async () => {
        const { id } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/${id}/FAKE_ID/lockSession`).send({state: 'locked'});

            expect(res.status).toBe(401);
            expect(await getSessionState(id)).toBe("unlocked");
        } finally {
            await deleteSession(id);
        }
    });

    test("Changing state to one that doesn't exist", async () => {
        const {id, hash} = await addAdminSession(mock_session_with_court);

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/lockSession`).send({state: 'orange'});
            
            expect(res.status).toBe(400);
            expect(await getSessionState(id)).toBe('unlocked');
        } finally {
            await deleteSession(id);
        }
    });

    test("Checking that the price per player is correct", async () => {
        const {id, hash} = await addAdminSession(mock_session_with_court);
        const {id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "interest1@gmail.com");
        const {id: player_3_id } = await addInterestedPlayer(id, crypto.randomUUID(), "interest2@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/lockSession`).send({state: 'locked'});

            expect(res.status).toBe(200);
            expect(await getPricePerPlayer(id)).toBe(67);
        } finally {
            await deletePlayer(player_2_id, id);
            await deletePlayer(player_3_id, id);
            await deleteSession(id);
        }
    })
})

describe("Deleting a player", () => {
    let id: String;
    let hash: String;
    let player_1_id: String;
    let player_2_id: String;
    
    beforeEach(async () => {
        ({id, hash} = await addAdminSession(mock_session_with_court_capacity));        
        
        ({id: player_1_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan802@gmail.com"));
        ({id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "interest@gmail.com"));
    });

    afterEach(async () => {
        await deleteSession(id);
    })

    test("Happy Path - deleting player - UPDATE", async () => {
        let { id: player_3_id } = await addInterestedPlayer(id, crypto.randomUUID(), "liem123@gmail.com");

        expect(await doesPlayerExist(player_2_id)).toBe(true);
        
        try {
            let res = await request(app).delete(`/api/admin/${id}/${hash}/${player_2_id}/deletePlayer`);
        
            expect(res.status).toBe(200);
            
            expect(await doesPlayerExist(player_2_id)).toBe(false);
            expect(await getPlayerState(player_1_id)).toBe("interested");
        } finally {
            await deletePlayer(player_3_id, id);
            await deletePlayer(player_1_id, id);
        }
    });

    test("Happy Path - deleting player promotes the correct player", async () => {
        const {id: player_3_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan812@gmail.com");
        const {id: player_4_id } = await addInterestedPlayer(id, crypto.randomUUID(), "liemphan822@gmail.com");

        try {
            expect(await doesPlayerExist(player_2_id)).toBe(true);

            let res = await request(app).delete(`/api/admin/${id}/${hash}/${player_2_id}/deletePlayer`);
            
            expect(res.status).toBe(200);
            
            expect(await doesPlayerExist(player_2_id)).toBe(false);
            expect(await getPlayerState(player_1_id)).toBe("interested");
            expect(await getPlayerState(player_3_id)).toBe("waitlist");
            expect(await getPlayerState(player_4_id)).toBe("interested");
        } finally {
            await deletePlayer(player_1_id, id);
            await deletePlayer(player_3_id, id);
            await deletePlayer(player_4_id, id);
        }
    });

    test("Deleting player when state is locked", async () => {
        try {
            await lockSession(id);

            let res = await request(app).delete(`/api/admin/${id}/${hash}/${player_2_id}/deletePlayer`);

            expect(res.status).toBe(400);
            expect(await getPlayerCount(id)).toBe(2);
        } finally {
            await deletePlayer(player_1_id, id);
            await deletePlayer(player_2_id, id);
        }
    });

    test("Deleting player when there's no waitlist", async () => {
        const {id: player_3_id } = await addInterestedPlayer(id, crypto.randomUUID(), "liemphan812@gmail.com");

        try {
            await deletePlayer(player_1_id, id);

            let res = await request(app).delete(`/api/admin/${id}/${hash}/${player_3_id}/deletePlayer`);

            expect(res.status).toBe(200);
            expect(await getSessionPlayerCount(id)).toBe(2);
        } finally {
            await deletePlayer(player_2_id, id);
        }
    });

    test("Deleting a player that doesn't exist", async () => {
        await deletePlayer(player_2_id, id);

        try {
            let res = await request(app).delete(`/api/admin/${id}/${hash}/${player_2_id}/deletePlayer`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Parameters don't exist");
        } finally {
            await deletePlayer(player_1_id, id);
        }
    });

    test("Trying to delete player when you don't have access", async () => {
        try {
            let res = await request(app).delete(`/api/admin/${id}/fakeidfails/${player_2_id}/deletePlayer`);

            expect(res.status).toBe(401);
            expect(await doesPlayerExist(player_2_id)).toBe(true);
        } finally {
            await deletePlayer(player_1_id, id);
            await deletePlayer(player_2_id, id);
        }
    });
})

describe("Race Condition for deleting", () => {
    let id: String;
    let hash: String;

    beforeEach(async () => {
        ({id, hash} = await addAdminSession(mock_session_with_court_capacity_2));         
    });

     afterEach(async () => {
        await deleteSession(id);
    });

    test("Deleting two players - one waitlisted - RACE CONDITION", async () => {
        for (let i: number = 0; i <= 5; i++) {
            const {id: player_1_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan812@gmail.com");
            const {id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "liemphan822@gmail.com");
            const {id: player_3_id } = await addInterestedPlayer(id, crypto.randomUUID(), "liemphan832@gmail.com");

            const player_id = [player_2_id, player_3_id]

            try {
                await Promise.all(player_id.map(async (player_id) => {
                    return request(app).delete(`/api/admin/${id}/${hash}/${player_id}/deletePlayer`)
                }));

                expect(await getSessionPlayerCount(id)).toBe(2);
            } finally {
                await deletePlayer(player_1_id, id);
            }
        }
    });

    test("Deleting two players - two waitlisted - RACE CONDITION", async () => {
        for (let i: number = 0; i <= 5; i++) {
            const {id: player_1_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan812@gmail.com");
            const {id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "liemphan822@gmail.com");
            const {id: player_3_id } = await addInterestedPlayer(id, crypto.randomUUID(), "liemphan832@gmail.com");
            const {id: player_4_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan842@gmail.com");

            try {
                const player_id = [player_2_id, player_3_id]

                await Promise.all(player_id.map(async (player_id) => {
                    return request(app).delete(`/api/admin/${id}/${hash}/${player_id}/deletePlayer`)
                }));

                expect(await doesPlayerExist(player_2_id)).toBe(false);
                expect(await doesPlayerExist(player_3_id)).toBe(false);
                expect(await getPlayerState(player_1_id)).toBe("interested");
                expect(await getPlayerState(player_4_id)).toBe("interested");
            } finally {
                await deletePlayer(player_1_id, id);
                await deletePlayer(player_4_id, id);
            }
        }
    });
})
describe("Swapping States", () => {
    let id: String;
    let hash: String;
    let player_1_id: String;
    let player_2_id: String


    beforeEach(async () => {
        ({id, hash } = await addAdminSession(mock_session_with_court_capacity));        
        ({id: player_1_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan802@gmail.com"));
        ({id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "interest@gmail.com"));
    });

    afterEach(async () => {
        await deletePlayer(player_1_id, id);
        await deletePlayer(player_2_id, id);
        await deleteSession(id);
    });

    test("Full Waitlist - swapping players", async () => {
        let res = await request(app).patch(`/api/admin/${id}/${hash}/${player_1_id}/${player_2_id}/swapStates`);

        expect(res.status).toBe(200);
        expect(await getPlayerState(player_1_id)).toBe("interested");
        expect(await getPlayerState(player_2_id)).toBe("waitlist");
    });

    test("Trying to swap when session is LOCKED", async () => {
        await lockSession(id);
        let res = await request(app).patch(`/api/admin/${id}/${hash}/${player_1_id}/${player_2_id}/swapStates`);

        expect(res.status).toBe(400);
        expect(await getPlayerState(player_1_id)).toBe("waitlist");
        expect(await getPlayerState(player_2_id)).toBe("interested");
    });

    test("Trying to swap players when you don't have access", async () => {
        let res = await request(app).patch(`/api/admin/${id}/fakeidfails/${player_1_id}/${player_2_id}/swapStates`);

        expect(res.status).toBe(401);
        expect(await getPlayerState(player_1_id)).toBe("waitlist");
        expect(await getPlayerState(player_2_id)).toBe("interested");
    });
})

describe("Unlocking locked session", () => {
    let id: String;
    let hash: String;
    let player_1_id: String;
    let player_2_id: String


    beforeEach(async () => {
        ({id, hash } = await addAdminSession(mock_session_with_court_capacity));        
        ({id: player_1_id } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "liemphan802@gmail.com"));
        ({id: player_2_id } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "interest@gmail.com"));
    });

    afterEach(async () => {
        await deletePlayer(player_1_id, id);
        await deletePlayer(player_2_id, id);
        await deleteSession(id);
    });


    test("Happy Version - you can unlock and your price per person becomes null again", async () => {
        await lockSession(id);

        let res = await request(app).patch(`/api/admin/${id}/${hash}/unlockSession`);

        expect(res.status).toBe(200);
        expect(await getSessionState(id)).toBe("unlocked");
    })

    test("Can only unlock if there are no players who have paid - if someone has paid you can't.", async () => {
        await lockSession(id);
        await markPlayerPaid(player_1_id);
        let res = await request(app).patch(`/api/admin/${id}/${hash}/unlockSession`);

        expect(res.status).toBe(400);
        expect(await getSessionState(id)).toBe("locked");
    });

    test("Session ID doesn't exist", async () => {
        await lockSession(id);

        let res = await request(app).patch(`/api/admin/hello/${hash}/unlockSession`);

        expect(res.status).toBe(401);
        
    });
});

describe("Marking someone as paid", () => {
    let id: String;
    let hash: String;
    let player_id_1: String;

    beforeEach(async () => {
        ({id, hash} = await addAdminSession(mock_session_with_court_capacity_2));  
        
        ({id: player_id_1} = await addPaymentPendingPlayer(id, crypto.randomUUID(), "lime123@gmail.com"));
    })
    
    test("Happy Version - successfully marked as paid", async () => {
        await lockSession(id);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/${player_id_1}/confirm`);

            expect(res.status).toBe(200);
            expect(await getPlayerState(player_id_1)).toBe("confirmed");
        } finally {
            deletePlayer(player_id_1, id);
        }
    });

    test("Player marked as paid is not in correct state", async () => {
        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/${player_id_1}/confirm`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Player is not in locked session");
            expect(await getPlayerState(player_id_1)).toBe("payment_pending");
        } finally {
            deletePlayer(player_id_1, id);
        }
    });

    test("Session is complete after all players have paid", async () => {
        await lockSession(id);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/${player_id_1}/confirm`);

            expect(res.status).toBe(200);
            expect(await getSessionState(id)).toBe("completed");
        } finally {
            deletePlayer(player_id_1, id);
        }
    });

    test("Player does not exist", async () => {
        await lockSession(id);
        const player_filler_id = crypto.randomUUID();

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/${player_filler_id}/confirm`);

            expect(res.status).toBe(404);
        } finally {
            deletePlayer(player_id_1, id);
        }
    })

    test("Player is not payment_pending", async () => {
        await lockSession(id);

        const { id: interested_player } = await addInterestedPlayer(id, crypto.randomUUID(), "12345@gmail.com");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/${interested_player}/confirm`);

            expect(res.status).toBe(400);
        } finally {
            await deletePlayer(interested_player, id);
            await deletePlayer(player_id_1, id);
        }
    })
})

describe("Race Condition for Updating Player", () => {
    test("2 Players Concurrently paying - only two interested players. Session should update", async () => {
        
        for (let i = 0; i < 5; i += 1) {
            const {id, hash} = await addAdminSession(mock_session_with_court_capacity_2);

            await lockSession(id);

            const { id: player_1_id } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "123@gmail.com");
            const { id: player_2_id } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "133@gmail.com");

            const players = [player_1_id, player_2_id];

            try {
                const player_res = await Promise.all(players.map(async (player_id) => {
                    return request(app).patch(`/api/admin/${id}/${hash}/${player_id}/confirm`);
                }));

                for (let res of player_res) {
                    console.error(res.body);
                }

                expect(await getPlayerState(player_1_id)).toBe("confirmed");
                expect(await getPlayerState(player_2_id)).toBe("confirmed");
                expect(await getSessionState(id)).toBe("completed");
            } finally {
                await deletePlayer(player_1_id, id);
                await deletePlayer(player_2_id, id);
                await deleteSession(id);
            }
        }
    })
})

// FEAT-001: PATCH /api/admin/:sessionId/:adminId/changeCapacity, body { capacity: number }.
// These tests are written against spec/[FEAT-001].md ahead of the implementation (TDD) and
// are expected to fail/error until the route/controller/business/repository layers exist.
describe("Changing session capacity", () => {
    test("Happy Path - increasing capacity when session is not full does not touch players", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        const { id: player_1_id } = await addInterestedPlayer(id, crypto.randomUUID(), "cap1@gmail.com");
        const { id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "cap2@gmail.com");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 25 });

            expect(res.status).toBe(200);
            expect(await getSessionCapacity(id)).toBe(25);
            expect(await getPlayerState(player_1_id)).toBe("interested");
            expect(await getPlayerState(player_2_id)).toBe("interested");
        } finally {
            await deletePlayer(player_1_id, id);
            await deletePlayer(player_2_id, id);
            await deleteSession(id);
        }
    });

    test("Happy Path - increasing capacity by 1 on a full session promotes the earliest waitlisted player", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court_capacity);
        const { id: player_1_id } = await addInterestedPlayer(id, crypto.randomUUID(), "cap1@gmail.com");
        const { id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "cap2@gmail.com");
        // player_count is now 1 (host) + 2 = 3 = capacity -> full
        const { id: waitlist_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "capw1@gmail.com");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 4 });

            expect(res.status).toBe(200);
            expect(await getSessionCapacity(id)).toBe(4);
            expect(await getPlayerState(waitlist_id)).toBe("interested");
            expect(await getSessionPlayerCount(id)).toBe(4);
        } finally {
            await deletePlayer(player_1_id, id);
            await deletePlayer(player_2_id, id);
            await deletePlayer(waitlist_id, id);
            await deleteSession(id);
        }
    });

    test("Happy Path - increasing capacity by 2 on a full session promotes the 2 earliest waitlisted players, in order", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court_capacity);
        const { id: player_1_id } = await addInterestedPlayer(id, crypto.randomUUID(), "cap1@gmail.com");
        const { id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "cap2@gmail.com");
        // Sequential awaits give w1 < w2 < w3 distinct joined_at values.
        const { id: w1 } = await addWaitlistedPlayer(id, crypto.randomUUID(), "capw1@gmail.com");
        const { id: w2 } = await addWaitlistedPlayer(id, crypto.randomUUID(), "capw2@gmail.com");
        const { id: w3 } = await addWaitlistedPlayer(id, crypto.randomUUID(), "capw3@gmail.com");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 5 });

            expect(res.status).toBe(200);
            expect(await getSessionCapacity(id)).toBe(5);
            expect(await getPlayerState(w1)).toBe("interested");
            expect(await getPlayerState(w2)).toBe("interested");
            expect(await getPlayerState(w3)).toBe("waitlist");
            expect(await getSessionPlayerCount(id)).toBe(5);
        } finally {
            await deletePlayer(player_1_id, id);
            await deletePlayer(player_2_id, id);
            await deletePlayer(w1, id);
            await deletePlayer(w2, id);
            await deletePlayer(w3, id);
            await deleteSession(id);
        }
    });

    test("Happy Path - increasing capacity by more than the waitlist size promotes everyone and still sets the requested capacity", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court_capacity);
        const { id: player_1_id } = await addInterestedPlayer(id, crypto.randomUUID(), "cap1@gmail.com");
        const { id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "cap2@gmail.com");
        const { id: waitlist_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "capw1@gmail.com");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 10 });

            expect(res.status).toBe(200);
            expect(await getSessionCapacity(id)).toBe(10);
            expect(await getPlayerState(waitlist_id)).toBe("interested");
            expect(await getSessionPlayerCount(id)).toBe(4);
        } finally {
            await deletePlayer(player_1_id, id);
            await deletePlayer(player_2_id, id);
            await deletePlayer(waitlist_id, id);
            await deleteSession(id);
        }
    });

    test("Happy Path - decreasing capacity on a full session waitlists the latest-joined players first (5 -> 3)", async () => {
        const mock_session_capacity_5: SessionRequest = { ...mock_session_with_court, capacity: 5 };
        const { id, hash } = await addAdminSession(mock_session_capacity_5);

        const { id: p1 } = await addInterestedPlayer(id, crypto.randomUUID(), "capp1@gmail.com");
        const { id: p2 } = await addInterestedPlayer(id, crypto.randomUUID(), "capp2@gmail.com");
        const { id: p3 } = await addInterestedPlayer(id, crypto.randomUUID(), "capp3@gmail.com");
        const { id: p4 } = await addInterestedPlayer(id, crypto.randomUUID(), "capp4@gmail.com");
        // player_count is now 1 (host) + 4 = 5 = capacity -> full

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 3 });

            expect(res.status).toBe(200);
            expect(await getSessionCapacity(id)).toBe(3);
            expect(await getPlayerState(p1)).toBe("interested");
            expect(await getPlayerState(p2)).toBe("interested");
            expect(await getPlayerState(p3)).toBe("waitlist");
            expect(await getPlayerState(p4)).toBe("waitlist");
            expect(await getSessionPlayerCount(id)).toBe(3);
        } finally {
            await deletePlayer(p1, id);
            await deletePlayer(p2, id);
            await deletePlayer(p3, id);
            await deletePlayer(p4, id);
            await deleteSession(id);
        }
    });

    test("Boundary - decreasing capacity to exactly the current interested count changes nobody", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        const { id: p1 } = await addInterestedPlayer(id, crypto.randomUUID(), "capb1@gmail.com");
        const { id: p2 } = await addInterestedPlayer(id, crypto.randomUUID(), "capb2@gmail.com");
        const { id: p3 } = await addInterestedPlayer(id, crypto.randomUUID(), "capb3@gmail.com");
        const { id: p4 } = await addInterestedPlayer(id, crypto.randomUUID(), "capb4@gmail.com");
        // player_count is now 1 (host) + 4 = 5

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 5 });

            expect(res.status).toBe(200);
            expect(await getSessionCapacity(id)).toBe(5);
            expect(await getPlayerState(p1)).toBe("interested");
            expect(await getPlayerState(p2)).toBe("interested");
            expect(await getPlayerState(p3)).toBe("interested");
            expect(await getPlayerState(p4)).toBe("interested");
            expect(await getSessionPlayerCount(id)).toBe(5);
        } finally {
            await deletePlayer(p1, id);
            await deletePlayer(p2, id);
            await deletePlayer(p3, id);
            await deletePlayer(p4, id);
            await deleteSession(id);
        }
    });

    test("No-op - capacity sent unchanged leaves everything as-is", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court_capacity);
        const { id: player_1_id } = await addInterestedPlayer(id, crypto.randomUUID(), "capnoop@gmail.com");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 3 });

            expect(res.status).toBe(200);
            expect(await getSessionCapacity(id)).toBe(3);
            expect(await getPlayerState(player_1_id)).toBe("interested");
            expect(await getSessionPlayerCount(id)).toBe(2);
        } finally {
            await deletePlayer(player_1_id, id);
            await deleteSession(id);
        }
    });

    // Assumption: the spec only spells out demotion for a session that was already "full" at
    // its old capacity. The natural general rule - capacity can never end up below the current
    // interested-player count - is the only reading consistent with player_count being
    // maintained as an invariant elsewhere in this codebase, so this asserts that reading.
    test("Edge case - decreasing capacity below the interested count on a non-full session still waitlists the excess", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        const { id: p1 } = await addInterestedPlayer(id, crypto.randomUUID(), "capnf1@gmail.com");
        const { id: p2 } = await addInterestedPlayer(id, crypto.randomUUID(), "capnf2@gmail.com");
        const { id: p3 } = await addInterestedPlayer(id, crypto.randomUUID(), "capnf3@gmail.com");
        const { id: p4 } = await addInterestedPlayer(id, crypto.randomUUID(), "capnf4@gmail.com");
        // capacity is 20, player_count is 1 (host) + 4 = 5 -> not full

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 3 });

            expect(res.status).toBe(200);
            expect(await getSessionCapacity(id)).toBe(3);
            expect(await getPlayerState(p1)).toBe("interested");
            expect(await getPlayerState(p2)).toBe("interested");
            expect(await getPlayerState(p3)).toBe("waitlist");
            expect(await getPlayerState(p4)).toBe("waitlist");
            expect(await getSessionPlayerCount(id)).toBe(3);
        } finally {
            await deletePlayer(p1, id);
            await deletePlayer(p2, id);
            await deletePlayer(p3, id);
            await deletePlayer(p4, id);
            await deleteSession(id);
        }
    });

    test("Edge case - decreasing capacity leaves pre-existing waitlisted players untouched", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court_capacity);
        const { id: waitlist_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "capmix0@gmail.com");
        const { id: p1 } = await addInterestedPlayer(id, crypto.randomUUID(), "capmix1@gmail.com");
        const { id: p2 } = await addInterestedPlayer(id, crypto.randomUUID(), "capmix2@gmail.com");
        // player_count is now 1 (host) + 2 = 3 = capacity -> full, plus 1 pre-existing waitlisted player

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 2 });

            expect(res.status).toBe(200);
            expect(await getSessionCapacity(id)).toBe(2);
            expect(await getPlayerState(p1)).toBe("interested");
            expect(await getPlayerState(p2)).toBe("waitlist");
            expect(await getPlayerState(waitlist_id)).toBe("waitlist");
            expect(await getSessionPlayerCount(id)).toBe(2);
        } finally {
            await deletePlayer(waitlist_id, id);
            await deletePlayer(p1, id);
            await deletePlayer(p2, id);
            await deleteSession(id);
        }
    });

    test("Trying to change capacity when the session is locked", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court_capacity);
        const { id: player_1_id } = await addInterestedPlayer(id, crypto.randomUUID(), "caplocked@gmail.com");
        await lockSession(id);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 5 });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Session state is not unlocked");
            expect(await getSessionCapacity(id)).toBe(3);
            expect(await getPlayerState(player_1_id)).toBe("payment_pending");
        } finally {
            await deletePlayer(player_1_id, id);
            await deleteSession(id);
        }
    });

    test("Missing capacity in the request body", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({});

            expect(res.status).toBe(400);
            expect(await getSessionCapacity(id)).toBe(20);
        } finally {
            await deleteSession(id);
        }
    });

    test("Capacity is not a number", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: "five" });

            expect(res.status).toBe(400);
            expect(await getSessionCapacity(id)).toBe(20);
        } finally {
            await deleteSession(id);
        }
    });

    test("Capacity is zero", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 0 });

            expect(res.status).toBe(400);
            expect(await getSessionCapacity(id)).toBe(20);
        } finally {
            await deleteSession(id);
        }
    });

    test("Capacity is negative", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: -5 });

            expect(res.status).toBe(400);
            expect(await getSessionCapacity(id)).toBe(20);
        } finally {
            await deleteSession(id);
        }
    });

    test("Capacity is not an integer", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 3.5 });

            expect(res.status).toBe(400);
            expect(await getSessionCapacity(id)).toBe(20);
        } finally {
            await deleteSession(id);
        }
    });

    test("Trying to change capacity when you don't have access", async () => {
        const { id } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/${id}/FAKE_ID/changeCapacity`).send({ capacity: 25 });

            expect(res.status).toBe(401);
            expect(await getSessionCapacity(id)).toBe(20);
        } finally {
            await deleteSession(id);
        }
    });

    test("Session ID doesn't exist", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/hello/${hash}/changeCapacity`).send({ capacity: 25 });

            expect(res.status).toBe(401);
        } finally {
            await deleteSession(id);
        }
    });
});

describe("Race Condition for Changing Capacity", () => {
    test("Two concurrent requests to the same new capacity only promote each waitlisted player once", async () => {
        for (let i = 0; i <= 5; i++) {
            const { id, hash } = await addAdminSession(mock_session_with_court_capacity);
            const { id: player_1_id } = await addInterestedPlayer(id, crypto.randomUUID(), "caprace1@gmail.com");
            const { id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "caprace2@gmail.com");
            const { id: w1 } = await addWaitlistedPlayer(id, crypto.randomUUID(), "capracew1@gmail.com");
            const { id: w2 } = await addWaitlistedPlayer(id, crypto.randomUUID(), "capracew2@gmail.com");
            // player_count is now 1 (host) + 2 = 3 = capacity -> full, 2 waitlisted players queued

            try {
                await Promise.all([1, 2].map(async () => {
                    return request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 4 });
                }));

                expect(await getSessionCapacity(id)).toBe(4);
                expect(await getPlayerState(w1)).toBe("interested");
                expect(await getPlayerState(w2)).toBe("waitlist");
                expect(await getSessionPlayerCount(id)).toBe(4);
            } finally {
                await deletePlayer(player_1_id, id);
                await deletePlayer(player_2_id, id);
                await deletePlayer(w1, id);
                await deletePlayer(w2, id);
                await deleteSession(id);
            }
        }
    });
});