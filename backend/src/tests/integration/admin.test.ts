import { expect, test, describe } from "@jest/globals";

import { SessionRequest } from "../../utility/types";
import request from 'supertest';
import { app } from '../../setup/app';
import { addAdminSession, addInterestedPlayer, addSession, addWaitlistedPlayer, deletePlayer, deleteSession, doesPlayerExist, getPlayerState, getSessionState } from './helpers/session.testHelper'

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

describe("Patching a session state", () => {
    test("Happy Path", async () => {
        const {id, hash} = await addAdminSession(mock_session_with_court);

        try {
            await request(app).patch(`/api/admin/${id}/${hash}/changeSessionState`).send({state: 'locked'});
            expect(await getSessionState(id)).toBe('locked');
        } finally {
            await deleteSession(id);
        }
    })

    test("Changing to state that it's already in", async () => {
        const {id, hash} = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/changeSessionState`).send({state: 'unlocked'});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Session is already in the suggested changed state");
        } finally {
            await deleteSession(id);
        }
    });

    test("Trying to change state when you don't have access", async () => {
        const {id } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).patch(`/api/admin/${id}/"FAKE_ID/changeSessionState"`).send({state: 'locked'});

            expect(res.status).toBe(401);
        } finally {
            await deleteSession(id);
        }
    })
})

describe("Deleting a player", () => {
    test("Happy Path - deleting player - UPDATE", async () => {
        let {id, hash } = await addAdminSession(mock_session_with_court_capacity);        
        
        const {id: player_1_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan802@gmail.com");
        const {id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "interest@gmail.com");
        
        try {
            expect(await doesPlayerExist(player_2_id)).toBe(true);

            let res = await request(app).delete(`/api/admin/${id}/${hash}/${player_2_id}/deletePlayer`);
            
            expect(res.status).toBe(200);
            
            expect(await doesPlayerExist(player_2_id)).toBe(false);
            expect(await getPlayerState(player_1_id)).toBe("interested");
        } finally {
            await deletePlayer(player_1_id, id);
            await deleteSession(id);
        }
    });

    test("Happy Path - deleting player promotes the correct player", async () => {
        let {id, hash } = await addAdminSession(mock_session_with_court_capacity);        
        
        const {id: player_1_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan802@gmail.com");
        const {id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "interest@gmail.com");
        const {id: player_3_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan812@gmail.com");
        const {id: player_4_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan822@gmail.com");

        try {
            expect(await doesPlayerExist(player_2_id)).toBe(true);

            let res = await request(app).delete(`/api/admin/${id}/${hash}/${player_2_id}/deletePlayer`);
            
            expect(res.status).toBe(200);
            
            expect(await doesPlayerExist(player_2_id)).toBe(false);
            expect(await getPlayerState(player_1_id)).toBe("interested");
            expect(await getPlayerState(player_3_id)).toBe("waitlisted");
            expect(await getPlayerState(player_4_id)).toBe("waitlisted");
        } finally {
            await deletePlayer(player_1_id, id);
            await deletePlayer(player_3_id, id);
            await deletePlayer(player_4_id, id);

            await deleteSession(id);
        }
    });
})

describe("Swapping States - HAPPY CASE", () => {
    test("Full Waitlist - swapping players", async () => {
        const {id, hash } = await addAdminSession(mock_session_with_court_capacity);        
        const {id: player_1_id } = await addWaitlistedPlayer(id, crypto.randomUUID(), "liemphan802@gmail.com");
        const {id: player_2_id } = await addInterestedPlayer(id, crypto.randomUUID(), "interest@gmail.com");
        
        try {
            let res = await request(app).patch(`/api/admin/${id}/${hash}/${player_1_id}/${player_2_id}/swapStates`);

            expect(res.status).toBe(200);
            expect(await getPlayerState(player_1_id)).toBe("interested");
            expect(await getPlayerState(player_2_id)).toBe("waitlist");
        } finally {
            await deletePlayer(player_1_id, id);
            await deletePlayer(player_2_id, id);
            await deleteSession(id);
        }
    });
})
