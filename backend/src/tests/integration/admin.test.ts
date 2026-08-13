import { expect, test, describe, beforeEach, afterEach } from "@jest/globals";

import { SessionRequest } from "../../utility/types";
import request from 'supertest';
import { app } from '../../setup/app';
import { addAdminSession, addInterestedPlayer, addWaitlistedPlayer, deletePlayer, deleteSession, doesPlayerExist, getPlayerState, getSessionState, lockSession, getPlayerCount, getSessionPlayerCount, getPricePerPlayer, addPaymentPendingPlayer } from './helpers/session.testHelper'
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
    capacity: 2,
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
        expect(await doesPlayerExist(player_2_id)).toBe(true);
        
        try {
            let res = await request(app).delete(`/api/admin/${id}/${hash}/${player_2_id}/deletePlayer`);
        
            expect(res.status).toBe(200);
            
            expect(await doesPlayerExist(player_2_id)).toBe(false);
            expect(await getPlayerState(player_1_id)).toBe("interested");
        } finally {
            await deletePlayer(player_1_id, id);
        }
    });

    test("Happy Path - deleting player promotes the correct player", async () => {
        const {id: player_3_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan812@gmail.com");
        const {id: player_4_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan822@gmail.com");

        try {
            expect(await doesPlayerExist(player_2_id)).toBe(true);

            let res = await request(app).delete(`/api/admin/${id}/${hash}/${player_2_id}/deletePlayer`);
            
            expect(res.status).toBe(200);
            
            expect(await doesPlayerExist(player_2_id)).toBe(false);
            expect(await getPlayerState(player_1_id)).toBe("interested");
            expect(await getPlayerState(player_3_id)).toBe("waitlist");
            expect(await getPlayerState(player_4_id)).toBe("waitlist");
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

// describe("Unlocking locked session", () => {
//     test("Happy Version - you can unlock", () => {

//     })

//     test("Unable to lock if player has paid already", () => {
        
//     });
// });

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