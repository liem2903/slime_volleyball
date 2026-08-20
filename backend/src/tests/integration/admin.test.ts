import { expect, test, describe, beforeEach, afterEach } from "@jest/globals";

import { SessionRequest } from "../../utility/types";
import request from 'supertest';
import { app } from '../../setup/app';
import { addAdminSession, addAdminSessionWithHash, addInterestedPlayer, addWaitlistedPlayer, deletePlayer, deleteSession, doesPlayerExist, getPlayerState, getSessionState, lockSession, getPlayerCount, getSessionPlayerCount, getPricePerPlayer, addPaymentPendingPlayer, markPlayerPaid, getSessionCapacity, getPlayersAndWaitlist, setSessionState, getTeams, deleteTeams, getPlayerAssignedPosition, getPlayerTeamId, setPlayerTeamId, setPlayerAssignedPosition, setPlayerState, setTeamCapacity } from './helpers/session.testHelper'
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
            expect(res.body).toEqual({ success: true });
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
            expect(res.body).toEqual({ success: true });
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
            expect(res.body).toEqual({ success: true });
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
            expect(res.body).toEqual({ success: true });
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
            expect(res.body).toEqual({ success: true });
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
            expect(res.body).toEqual({ success: true });
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

    test("Decreasing capacity with headroom (new capacity still above the current interested count) changes nobody", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        const { id: p1 } = await addInterestedPlayer(id, crypto.randomUUID(), "caphr1@gmail.com");
        const { id: p2 } = await addInterestedPlayer(id, crypto.randomUUID(), "caphr2@gmail.com");
        const { id: p3 } = await addInterestedPlayer(id, crypto.randomUUID(), "caphr3@gmail.com");
        // capacity is 20, player_count is 1 (host) + 3 = 4 -> well under both old and new capacity

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 10 });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });
            expect(await getSessionCapacity(id)).toBe(10);
            expect(await getPlayerState(p1)).toBe("interested");
            expect(await getPlayerState(p2)).toBe("interested");
            expect(await getPlayerState(p3)).toBe("interested");
            expect(await getSessionPlayerCount(id)).toBe(4);
        } finally {
            await deletePlayer(p1, id);
            await deletePlayer(p2, id);
            await deletePlayer(p3, id);
            await deleteSession(id);
        }
    });

    test("No-op - capacity sent unchanged leaves everything as-is", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court_capacity);
        const { id: player_1_id } = await addInterestedPlayer(id, crypto.randomUUID(), "capnoop@gmail.com");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 3 });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });
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
            expect(res.body).toEqual({ success: true });
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
            expect(res.body).toEqual({ success: true });
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
            expect(await getPlayerState(player_1_id)).toBe("interested");
        } finally {
            await deletePlayer(player_1_id, id);
            await deleteSession(id);
        }
    });

    test("Trying to change capacity when the session is completed", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 25 });

            expect(res.status).toBe(400);
            expect(await getSessionCapacity(id)).toBe(20);
        } finally {
            await deleteSession(id);
        }
    });

    test("Trying to change capacity when the session is cancelled", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "cancelled");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeCapacity`).send({ capacity: 25 });

            expect(res.status).toBe(400);
            expect(await getSessionCapacity(id)).toBe(20);
        } finally {
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

// FEAT-003: PATCH /api/admin/:sessionId/:adminId/moveToTeams, body { teams: [{ name: string, capacity: number, color?: string }, ...] }.
// These tests are written against FEAT/[FEAT-003].md ahead of the implementation (TDD) and are
// expected to fail/error until the route/controller/business/repository layers exist.
// `capacity` was added retroactively per FEAT-005 ("Team's should have a capacity which is set
// when the team is initially created") - every team object below carries `capacity: 10` as an
// arbitrary valid value unless a test is specifically exercising capacity.
// Deviation from the spec's literal text, confirmed with the spec owner: a session must be
// split into at least TWO teams, not one - "minimum length 1" doesn't make sense for a feature
// whose whole purpose is dividing players between teams.
describe("Moving a completed session to teams", () => {
    test("Happy Path - exactly two teams, no color", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });
            expect(await getSessionState(id)).toBe("teams");

            const teams = await getTeams(id);
            expect(teams).toHaveLength(2);
            expect(teams[0]).toMatchObject({ name: "Team A", color: null });
            expect(teams[1]).toMatchObject({ name: "Team B", color: null });
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Happy Path - two teams, both with color", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Red", color: "#FF0000" }, { capacity: 10, name: "Blue", color: "#0000FF" }]
            });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });

            const teams = await getTeams(id);
            expect(teams).toHaveLength(2);
            expect(teams.find(t => t.name === "Red")?.color).toBe("#FF0000");
            expect(teams.find(t => t.name === "Blue")?.color).toBe("#0000FF");
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Happy Path - more than two teams are all persisted atomically", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "Team B" }, { capacity: 10, name: "Team C" }, { capacity: 10, name: "Team D" }]
            });

            expect(res.status).toBe(200);
            expect(await getSessionState(id)).toBe("teams");
            expect(await getTeams(id)).toHaveLength(4);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Happy Path - large team list has no artificial cap", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        const teams = Array.from({ length: 20 }, (_, i) => ({ capacity: 10, name: `Team ${String(i).padStart(2, "0")}` }));

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({ teams });

            expect(res.status).toBe(200);
            expect(await getTeams(id)).toHaveLength(20);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Happy Path - team names only need to be unique within a session, not globally", async () => {
        const { id: id1, hash: hash1 } = await addAdminSession(mock_session_with_court);
        const { id: id2, hash: hash2 } = await addAdminSession(mock_session_with_court);
        await setSessionState(id1, "completed");
        await setSessionState(id2, "completed");

        try {
            let res1 = await request(app).patch(`/api/admin/${id1}/${hash1}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Red" }, { capacity: 10, name: "Blue" }]
            });
            let res2 = await request(app).patch(`/api/admin/${id2}/${hash2}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Red" }, { capacity: 10, name: "Green" }]
            });

            expect(res1.status).toBe(200);
            expect(res2.status).toBe(200);
            expect(await getTeams(id1)).toHaveLength(2);
            expect(await getTeams(id2)).toHaveLength(2);
        } finally {
            await deleteTeams(id1);
            await deleteTeams(id2);
            await deleteSession(id1);
            await deleteSession(id2);
        }
    });

    test("Happy Path - moving to teams does not touch existing attendances' team_id or assigned_position", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        const { id: playerId } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "movteam1@gmail.com");
        await markPlayerPaid(playerId);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(200);
            expect(await getPlayerTeamId(playerId)).toBeNull();
            expect(await getPlayerAssignedPosition(playerId)).toBeNull();
            expect(await getPlayerState(playerId)).toBe("confirmed");
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Happy Path - client-supplied id and unknown fields on a team object are ignored, not persisted", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A", id: "should-be-ignored" }, { capacity: 10, name: "Team B", extra: 123 }]
            });

            expect(res.status).toBe(200);
            const teams = await getTeams(id);
            expect(teams).toHaveLength(2);

            const teamA = teams.find(t => t.name === "Team A");
            expect(teamA?.id).toBeDefined();
            expect(teamA?.id).not.toBe("should-be-ignored");
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Missing teams field entirely", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Empty teams array is rejected", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({ teams: [] });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Exactly one team is rejected - minimum is two", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Solo Team" }]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("teams is not an array", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: "Team A"
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("A team is missing name", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { color: "#FF0000" }]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("name is not a string", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: 123 }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("name is an empty string", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "" }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("name is whitespace-only is rejected", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "   " }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Duplicate team names in the same request are rejected", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "Team A" }]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("color is not a string", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A", color: 123 }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("One valid team and one invalid team - whole request rejected, nothing persisted", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "" }]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("teams array contains non-object elements", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: ["Team A", "Team B"]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("teams array contains a null element", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, null]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("name exceeding the database's 255 character limit is rejected with a controlled error", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        const tooLongName = "A".repeat(256);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: tooLongName }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("color exceeding the database's 255 character limit is rejected with a controlled error", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        const tooLongColor = "#".repeat(256);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A", color: tooLongColor }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
            expect(await getSessionState(id)).toBe("completed");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Trying to move to teams when the session is unlocked", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Session state is not completed");
            expect(await getSessionState(id)).toBe("unlocked");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Trying to move to teams when the session is locked", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await lockSession(id);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Session state is not completed");
            expect(await getSessionState(id)).toBe("locked");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Trying to move to teams when the session is cancelled", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "cancelled");

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Session state is not completed");
            expect(await getSessionState(id)).toBe("cancelled");
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Trying to move to teams when the session is already in teams state", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let firstRes = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "Team B" }]
            });
            expect(firstRes.status).toBe(200);

            let secondRes = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team C" }, { capacity: 10, name: "Team D" }]
            });

            expect(secondRes.status).toBe(400);
            expect(secondRes.body.message).toBe("Session state is not completed");
            expect(await getSessionState(id)).toBe("teams");
            const teams = await getTeams(id);
            expect(teams).toHaveLength(2);
            expect(teams.map(t => t.name).sort()).toEqual(["Team A", "Team B"]);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Trying to move to teams when you don't have access", async () => {
        const { id } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        try {
            let res = await request(app).patch(`/api/admin/${id}/FAKE_ID/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(401);
            expect(await getTeams(id)).toHaveLength(0);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Session ID doesn't exist", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/hello/${hash}/moveToTeams`).send({
                teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "Team B" }]
            });

            expect(res.status).toBe(401);
        } finally {
            await deleteSession(id);
        }
    });
});

describe("Race Condition for Moving to Teams", () => {
    test("Two concurrent moveToTeams requests on the same completed session - only one succeeds", async () => {
        for (let i = 0; i <= 5; i++) {
            const { id, hash } = await addAdminSession(mock_session_with_court);
            await setSessionState(id, "completed");

            try {
                const responses = await Promise.all([
                    request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({ teams: [{ capacity: 10, name: "Team A" }, { capacity: 10, name: "Team B" }] }),
                    request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({ teams: [{ capacity: 10, name: "Team C" }, { capacity: 10, name: "Team D" }] }),
                ]);

                const statuses = responses.map(r => r.status).sort();
                expect(statuses).toEqual([200, 400]);
                expect(await getSessionState(id)).toBe("teams");

                // Exactly one payload's teams got persisted, as a consistent set - never both,
                // never zero, and never an interleaved mix of names from both payloads (which
                // would indicate a non-atomic insert racing the state check).
                const persistedNames = (await getTeams(id)).map(t => t.name).sort();
                expect([["Team A", "Team B"], ["Team C", "Team D"]]).toContainEqual(persistedNames);
            } finally {
                await deleteTeams(id);
                await deleteSession(id);
            }
        }
    });
});

// FEAT-005: PATCH /api/admin/:sessionId/:adminId/:playerId/assignTeam, body { team_id: string }.
// These tests are written against FEAT/[FEAT-005].md ahead of the implementation (TDD) and are
// expected to fail/404 until the route/controller/business/repository layers exist.
//
// Design decisions confirmed with the spec owner, since the spec text is imprecise or silent on them:
//   - adminId mismatch returns 401, not the 403 the spec text literally says - every other admin
//     route gets its auth check from the shared check_is_admin middleware, which always throws
//     401 (UnauthorisedRequest); there's no 403/ForbiddenError class anywhere in this codebase,
//     and this endpoint reuses that same middleware rather than special-casing itself.
//   - Team capacity (added to the `teams` table/moveToTeams input specifically for this feature,
//     per the spec's own note) IS enforced here: assigning a player to a team already at capacity
//     is rejected. A no-op reassignment (player already on that team) is exempt from the check,
//     since it doesn't add an occupant.
//   - An unknown/wrong-session team_id, an unknown/wrong-session playerId, and a non-'confirmed'
//     player are all 400 (BadRequestError), matching the "WRONG STATE"-style pattern used by
//     moveToTeamsRepository/confirmPlayerRepository, not 404.
//   - "reassigned to a new team" (which resets assigned_position to NULL) is read to include a
//     player's very first team assignment (team_id: NULL -> X), not only team-to-team
//     reassignment - the alternative reading (first assignment never resets) offered no reason
//     a position set before a team exists (FEAT-006 explicitly allows either order) should
//     survive the player's first team assignment.

function teamsInput(capacities: number[]) {
    return capacities.map((capacity, i) => ({ name: `Team ${String.fromCharCode(65 + i)}`, capacity }));
}

async function setupSessionInTeamsState(capacities: number[]) {
    const { id, hash } = await addAdminSession(mock_session_with_court);
    await setSessionState(id, "completed");

    const moveRes = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({ teams: teamsInput(capacities) });
    if (moveRes.status !== 200) {
        throw new Error(`setupSessionInTeamsState: moveToTeams failed (${moveRes.status}): ${JSON.stringify(moveRes.body)}`);
    }

    const teams = await getTeams(id);
    return { id, hash, teams };
}

async function addConfirmedPlayer(sessionId: String, email: string) {
    const { id: playerId } = await addPaymentPendingPlayer(sessionId, crypto.randomUUID(), email);
    await markPlayerPaid(playerId);
    return playerId;
}

describe("Assigning a player to a team - happy path", () => {
    test("Assigns a confirmed player with no team yet to a valid team", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-hp1@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });
            expect(await getPlayerTeamId(playerId)).toBe(teams[0].id);
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Assigning a player for the first time also resets any pre-existing assigned_position to NULL", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-hp2@gmail.com");
        await setPlayerAssignedPosition(playerId, "middle");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(200);
            expect(await getPlayerAssignedPosition(playerId)).toBeNull();
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Response shape matches spec exactly", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-hp3@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(200);
            expect(Object.keys(res.body)).toEqual(["success"]);
            expect(res.body.success).toBe(true);
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("GET /api/teams/:sessionId reflects the assignment", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-hp4@gmail.com");

        try {
            const assignRes = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[0].id });
            expect(assignRes.status).toBe(200);

            const res = await request(app).get(`/api/teams/${id}`);
            const returnedTeam = res.body.data.find((t: any) => t.id === teams[0].id);

            expect(returnedTeam.players).toEqual([
                { id: playerId, name: "FILLER MAN", assigned_position: null }
            ]);
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });
});

describe("Assigning a player to a team - reassignment behavior", () => {
    test("Reassigns a player already on team A to team B", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-re1@gmail.com");
        await setPlayerTeamId(playerId, teams[0].id);

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[1].id });

            expect(res.status).toBe(200);
            expect(await getPlayerTeamId(playerId)).toBe(teams[1].id);
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Reassignment resets assigned_position to NULL", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-re2@gmail.com");
        await setPlayerTeamId(playerId, teams[0].id);
        await setPlayerAssignedPosition(playerId, "oppo");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[1].id });

            expect(res.status).toBe(200);
            expect(await getPlayerAssignedPosition(playerId)).toBeNull();
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Reassigning to the SAME team the player is already on succeeds as a no-op", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-re3@gmail.com");
        await setPlayerTeamId(playerId, teams[0].id);

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });
            expect(await getPlayerTeamId(playerId)).toBe(teams[0].id);
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("No-op reassignment does NOT reset assigned_position", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-re4@gmail.com");
        await setPlayerTeamId(playerId, teams[0].id);
        await setPlayerAssignedPosition(playerId, "lib");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(200);
            expect(await getPlayerAssignedPosition(playerId)).toBe("lib");
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("No-op reassignment succeeds even when the team is already at full capacity", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([1, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-re5@gmail.com");
        await setPlayerTeamId(playerId, teams[0].id);

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(200);
            expect(await getPlayerTeamId(playerId)).toBe(teams[0].id);
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });
});

describe("Assigning a player to a team - capacity", () => {
    test("Rejects assignment when the target team is already at capacity", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([1, 10]);
        const occupantId = await addConfirmedPlayer(id, "assignteam-cap1a@gmail.com");
        await setPlayerTeamId(occupantId, teams[0].id);
        const newPlayerId = await addConfirmedPlayer(id, "assignteam-cap1b@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${newPlayerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(400);
            expect(await getPlayerTeamId(newPlayerId)).toBeNull();
        } finally {
            await deletePlayer(occupantId, id);
            await deletePlayer(newPlayerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Succeeds at exactly capacity - 1 -> capacity", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([2, 10]);
        const occupantId = await addConfirmedPlayer(id, "assignteam-cap2a@gmail.com");
        await setPlayerTeamId(occupantId, teams[0].id);
        const newPlayerId = await addConfirmedPlayer(id, "assignteam-cap2b@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${newPlayerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(200);
            expect(await getPlayerTeamId(newPlayerId)).toBe(teams[0].id);
        } finally {
            await deletePlayer(occupantId, id);
            await deletePlayer(newPlayerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Moving a player from a full team to a different team frees a slot on the original team", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([1, 10]);
        const movingPlayerId = await addConfirmedPlayer(id, "assignteam-cap3a@gmail.com");
        await setPlayerTeamId(movingPlayerId, teams[0].id);
        const newPlayerId = await addConfirmedPlayer(id, "assignteam-cap3b@gmail.com");

        try {
            const moveAwayRes = await request(app).patch(`/api/admin/${id}/${hash}/${movingPlayerId}/assignTeam`).send({ team_id: teams[1].id });
            expect(moveAwayRes.status).toBe(200);

            const res = await request(app).patch(`/api/admin/${id}/${hash}/${newPlayerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(200);
            expect(await getPlayerTeamId(newPlayerId)).toBe(teams[0].id);
        } finally {
            await deletePlayer(movingPlayerId, id);
            await deletePlayer(newPlayerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Moving a player to a different team removes them from the original team's roster", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const movingPlayerId = await addConfirmedPlayer(id, "assignteam-cap4@gmail.com");
        await setPlayerTeamId(movingPlayerId, teams[0].id);

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${movingPlayerId}/assignTeam`).send({ team_id: teams[1].id });
            expect(res.status).toBe(200);

            const teamsRes = await request(app).get(`/api/teams/${id}`);
            const originalTeam = teamsRes.body.data.find((t: any) => t.id === teams[0].id);
            const newTeam = teamsRes.body.data.find((t: any) => t.id === teams[1].id);

            expect(originalTeam.players.map((p: any) => p.id)).not.toContain(movingPlayerId);
            expect(newTeam.players.map((p: any) => p.id)).toContain(movingPlayerId);
        } finally {
            await deletePlayer(movingPlayerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Rejects assignment to a team with zero remaining capacity", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        await setTeamCapacity(teams[0].id, 0);
        const playerId = await addConfirmedPlayer(id, "assignteam-cap5@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(400);
            expect(await getPlayerTeamId(playerId)).toBeNull();
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });
});

describe("Race Condition for Assigning a Player to a Team", () => {
    test("Two concurrent assignTeam calls for the last open slot on a team resolve to exactly one success", async () => {
        for (let i = 0; i <= 5; i++) {
            const { id, hash, teams } = await setupSessionInTeamsState([1, 10]);
            const playerAId = await addConfirmedPlayer(id, `assignteam-race${i}a@gmail.com`);
            const playerBId = await addConfirmedPlayer(id, `assignteam-race${i}b@gmail.com`);

            try {
                const responses = await Promise.all([
                    request(app).patch(`/api/admin/${id}/${hash}/${playerAId}/assignTeam`).send({ team_id: teams[0].id }),
                    request(app).patch(`/api/admin/${id}/${hash}/${playerBId}/assignTeam`).send({ team_id: teams[0].id }),
                ]);

                const statuses = responses.map(r => r.status).sort();
                expect(statuses).toEqual([200, 400]);

                const teamIds = [await getPlayerTeamId(playerAId), await getPlayerTeamId(playerBId)];
                expect(teamIds.filter(t => t === teams[0].id)).toHaveLength(1);
            } finally {
                await deletePlayer(playerAId, id);
                await deletePlayer(playerBId, id);
                await deleteTeams(id);
                await deleteSession(id);
            }
        }
    });

    test("Two concurrent assignTeam calls for the SAME player to two different teams leave that player on exactly one team, consistently", async () => {
        for (let i = 0; i <= 5; i++) {
            const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
            const playerId = await addConfirmedPlayer(id, `assignteam-selfrace${i}@gmail.com`);

            try {
                const responses = await Promise.all([
                    request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[0].id }),
                    request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[1].id }),
                ]);

                expect(responses.map(r => r.status)).toEqual([200, 200]);

                const finalTeamId = await getPlayerTeamId(playerId);
                expect([teams[0].id, teams[1].id]).toContain(finalTeamId);

                const teamsRes = await request(app).get(`/api/teams/${id}`);
                const teamsContainingPlayer = teamsRes.body.data.filter((t: any) =>
                    t.players.some((p: any) => p.id === playerId)
                );
                expect(teamsContainingPlayer).toHaveLength(1);
                expect(teamsContainingPlayer[0].id).toBe(finalTeamId);
            } finally {
                await deletePlayer(playerId, id);
                await deleteTeams(id);
                await deleteSession(id);
            }
        }
    });
});

describe("Assigning a player to a team - player validation", () => {
    test.each(["waitlist", "interested", "payment_pending", "cancelled", "payment_cancelled"] as const)(
        "Rejects a player whose state is '%s', not 'confirmed'",
        async (state) => {
            const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
            const { id: playerId } = await addPaymentPendingPlayer(id, crypto.randomUUID(), `assignteam-status-${state}@gmail.com`);
            await setPlayerState(playerId, state);

            try {
                const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[0].id });

                expect(res.status).toBe(400);
                expect(await getPlayerTeamId(playerId)).toBeNull();
            } finally {
                await deletePlayer(playerId, id);
                await deleteTeams(id);
                await deleteSession(id);
            }
        }
    );

    test("Rejects a playerId that does not exist", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${crypto.randomUUID()}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(400);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Rejects a playerId that exists but belongs to a different session", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const { id: otherId } = await addAdminSession(mock_session_with_court);
        const foreignPlayerId = await addConfirmedPlayer(otherId, "assignteam-foreign-player@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${foreignPlayerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(400);
            expect(await getPlayerTeamId(foreignPlayerId)).toBeNull();
        } finally {
            await deletePlayer(foreignPlayerId, otherId);
            await deleteSession(otherId);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Rejects a playerId belonging to a different session, even when the same admin owns both sessions", async () => {
        const sharedHash = crypto.randomUUID();
        const { id, hash } = await addAdminSessionWithHash(mock_session_with_court, sharedHash);
        const { id: otherId } = await addAdminSessionWithHash(mock_session_with_court, sharedHash);
        await setSessionState(otherId, "completed");
        const moveRes = await request(app).patch(`/api/admin/${otherId}/${hash}/moveToTeams`).send({ teams: teamsInput([10, 10]) });
        if (moveRes.status !== 200) {
            throw new Error(`setup failed (${moveRes.status}): ${JSON.stringify(moveRes.body)}`);
        }
        const foreignPlayerId = await addConfirmedPlayer(otherId, "assignteam-samadmin-player@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${foreignPlayerId}/assignTeam`).send({ team_id: crypto.randomUUID() });

            expect(res.status).toBe(400);
            expect(await getPlayerTeamId(foreignPlayerId)).toBeNull();
        } finally {
            await deletePlayer(foreignPlayerId, otherId);
            await deleteTeams(otherId);
            await deleteSession(otherId);
            await deleteSession(id);
        }
    });

    test("Rejects a playerId that does not exist and is not a well-formed identifier", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/not-a-valid-id/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(400);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Rejects reassignment when a player who already has a team has since left the 'confirmed' state", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-degraded@gmail.com");
        await setPlayerTeamId(playerId, teams[0].id);
        await setPlayerState(playerId, "cancelled");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: teams[1].id });

            expect(res.status).toBe(400);
            expect(await getPlayerTeamId(playerId)).toBe(teams[0].id);
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });
});

describe("Assigning a player to a team - team validation", () => {
    test("Rejects a team_id that does not exist at all", async () => {
        const { id, hash } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-noteam@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: crypto.randomUUID() });

            expect(res.status).toBe(400);
            expect(await getPlayerTeamId(playerId)).toBeNull();
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Rejects a team_id that exists but belongs to a different session", async () => {
        const { id, hash } = await setupSessionInTeamsState([10, 10]);
        const { id: otherId, teams: foreignTeams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-foreign-team@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: foreignTeams[0].id });

            expect(res.status).toBe(400);
            expect(await getPlayerTeamId(playerId)).toBeNull();
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
            await deleteTeams(otherId);
            await deleteSession(otherId);
        }
    });

    test("Rejects a team_id belonging to a different session, even when the same admin owns both sessions", async () => {
        const sharedHash = crypto.randomUUID();
        const { id, hash } = await addAdminSessionWithHash(mock_session_with_court, sharedHash);
        const { id: otherId } = await addAdminSessionWithHash(mock_session_with_court, sharedHash);
        await setSessionState(otherId, "completed");
        const moveRes = await request(app).patch(`/api/admin/${otherId}/${hash}/moveToTeams`).send({ teams: teamsInput([10, 10]) });
        if (moveRes.status !== 200) {
            throw new Error(`setup failed (${moveRes.status}): ${JSON.stringify(moveRes.body)}`);
        }
        const foreignTeams = await getTeams(otherId);
        await setSessionState(id, "completed");
        const moveOwnRes = await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({ teams: teamsInput([10, 10]) });
        if (moveOwnRes.status !== 200) {
            throw new Error(`setup failed (${moveOwnRes.status}): ${JSON.stringify(moveOwnRes.body)}`);
        }
        const playerId = await addConfirmedPlayer(id, "assignteam-samadmin-team@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: foreignTeams[0].id });

            expect(res.status).toBe(400);
            expect(await getPlayerTeamId(playerId)).toBeNull();
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
            await deleteTeams(otherId);
            await deleteSession(otherId);
        }
    });

    test("Rejects a team_id that is not a well-formed identifier", async () => {
        const { id, hash } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-malformedteam@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: "not-a-valid-id" });

            expect(res.status).toBe(400);
            expect(await getPlayerTeamId(playerId)).toBeNull();
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Rejects any team_id when the session has zero teams", async () => {
        const { id, hash } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-noteamsatall@gmail.com");
        await deleteTeams(id);

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: crypto.randomUUID() });

            expect(res.status).toBe(400);
            expect(await getPlayerTeamId(playerId)).toBeNull();
        } finally {
            await deletePlayer(playerId, id);
            await deleteSession(id);
        }
    });
});

describe("Assigning a player to a team - session state", () => {
    test.each(["unlocked", "locked", "completed", "cancelled"] as const)(
        "Rejects when session state is '%s', not 'teams'",
        async (state) => {
            const { id, hash } = await addAdminSession(mock_session_with_court);
            const playerId = await addConfirmedPlayer(id, `assignteam-sessstate-${state}@gmail.com`);
            await setSessionState(id, state);

            try {
                const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: crypto.randomUUID() });

                expect(res.status).toBe(400);
                expect(res.body.message).toBe("Session state is not teams");
                expect(await getPlayerTeamId(playerId)).toBeNull();
            } finally {
                await deletePlayer(playerId, id);
                await deleteSession(id);
            }
        }
    );
});

describe("Assigning a player to a team - admin authorization", () => {
    test("Rejects when adminId does not match the session's actual admin", async () => {
        const { id, teams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-badadmin@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/FAKE_ID/${playerId}/assignTeam`).send({ team_id: teams[0].id });

            expect(res.status).toBe(401);
            expect(await getPlayerTeamId(playerId)).toBeNull();
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Rejects when the session does not exist", async () => {
        const res = await request(app)
            .patch(`/api/admin/${crypto.randomUUID()}/FAKE_ID/${crypto.randomUUID()}/assignTeam`)
            .send({ team_id: crypto.randomUUID() });

        expect(res.status).toBe(401);
    });
});

describe("Assigning a player to a team - request validation", () => {
    test("Rejects a missing team_id in the request body", async () => {
        const { id, hash } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-missingteamid@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Rejects a non-string team_id", async () => {
        const { id, hash } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-nonstringteamid@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: 12345 });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Rejects an empty-string team_id", async () => {
        const { id, hash } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-emptyteamid@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: "" });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Rejects a whitespace-only team_id", async () => {
        const { id, hash } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-whitespaceteamid@gmail.com");

        try {
            const res = await request(app).patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`).send({ team_id: "   " });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("errors");
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Ignores unexpected extra fields in the request body, such as a stray position", async () => {
        const { id, hash, teams } = await setupSessionInTeamsState([10, 10]);
        const playerId = await addConfirmedPlayer(id, "assignteam-extrafield@gmail.com");

        try {
            const res = await request(app)
                .patch(`/api/admin/${id}/${hash}/${playerId}/assignTeam`)
                .send({ team_id: teams[0].id, position: "middle" });

            expect(res.status).toBe(200);
            expect(await getPlayerTeamId(playerId)).toBe(teams[0].id);
            expect(await getPlayerAssignedPosition(playerId)).toBeNull();
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });
});