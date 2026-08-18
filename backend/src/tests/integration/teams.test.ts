import { expect, test, describe } from "@jest/globals";
import request from 'supertest';
import { app } from '../../setup/app';
import {
    addAdminSession,
    addPaymentPendingPlayer,
    markPlayerPaid,
    setSessionState,
    getTeams,
    deleteTeams,
    deletePlayer,
    deleteSession,
    setPlayerTeamId,
    setPlayerAssignedPosition,
} from './helpers/session.testHelper'
import { SessionRequest } from "../../utility/types";

// FEAT-004: GET /api/teams/:sessionId - a public (non-admin-gated) read endpoint that returns
// every team defined for a session, along with the players currently assigned to each team
// (id, name, assigned_position). If the session hasn't reached `teams` state yet / no teams
// have been created, returns an empty array rather than an error, so callers can fetch
// unconditionally without checking session state first.
//
// These tests are written against FEAT/[FEAT-004].md ahead of the implementation (TDD) and
// are expected to fail/404 until the route/controller/business/repository layers exist.
//
// Two design decisions confirmed with the spec owner, since the spec itself is silent on them:
//   - An unknown/nonexistent sessionId returns 200 + empty array, not 404 - matching
//     GET /api/players/:sessionId's precedent (no existence check) rather than
//     GET /api/session/:sessionId's precedent (404 on a missing row).
//   - No test asserts a specific order for the teams/players arrays; the spec doesn't
//     require one, so assertions here are order-independent.
//
// FEAT-005 (assignTeam) and FEAT-006 (assignPosition) aren't implemented yet, so there is no
// production endpoint to assign a player to a team or set their position - these tests seed
// that state directly via setPlayerTeamId/setPlayerAssignedPosition test helpers instead.

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

describe("Getting teams for a session - happy path", () => {
    test("Session has not moved to teams yet - returns an empty array", async () => {
        const { id } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).get(`/api/teams/${id}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: [], success: true });
        } finally {
            await deleteSession(id);
        }
    });

    test("Teams exist but no players are assigned to any of them", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: "Team A" }, { name: "Team B" }]
        });

        try {
            let res = await request(app).get(`/api/teams/${id}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            for (const team of res.body.data) {
                expect(team.players).toEqual([]);
            }
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Player assigned to a team with no position set yet", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: "Team A" }, { name: "Team B" }]
        });
        const teams = await getTeams(id);
        const teamA = teams.find((t: any) => t.name === "Team A");

        const { id: playerId } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "teamsget1@gmail.com");
        await markPlayerPaid(playerId);
        await setPlayerTeamId(playerId, teamA.id);

        try {
            let res = await request(app).get(`/api/teams/${id}`);
            const returnedTeamA = res.body.data.find((t: any) => t.name === "Team A");

            expect(returnedTeamA.players).toEqual([
                { id: playerId, name: "FILLER MAN", assigned_position: null }
            ]);
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Assigned position reflects each of the four enum values", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: "Team A" }, { name: "Team B" }]
        });
        const teams = await getTeams(id);
        const teamA = teams.find((t: any) => t.name === "Team A");

        const { id: playerId } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "teamsget2@gmail.com");
        await markPlayerPaid(playerId);
        await setPlayerTeamId(playerId, teamA.id);

        try {
            for (const position of ["middle", "oppo", "outside", "lib"] as const) {
                await setPlayerAssignedPosition(playerId, position);

                let res = await request(app).get(`/api/teams/${id}`);
                const returnedTeamA = res.body.data.find((t: any) => t.name === "Team A");

                expect(returnedTeamA.players[0].assigned_position).toBe(position);
            }
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Players are grouped under the correct team, with no leakage or duplication", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: "Team A" }, { name: "Team B" }, { name: "Team C" }]
        });
        const teams = await getTeams(id);
        const teamA = teams.find((t: any) => t.name === "Team A");
        const teamB = teams.find((t: any) => t.name === "Team B");
        // Team C is intentionally left with zero players assigned.

        const { id: playerA1 } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "teamsget3-1@gmail.com");
        const { id: playerA2 } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "teamsget3-2@gmail.com");
        const { id: playerB1 } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "teamsget3-3@gmail.com");
        await markPlayerPaid(playerA1);
        await markPlayerPaid(playerA2);
        await markPlayerPaid(playerB1);
        await setPlayerTeamId(playerA1, teamA.id);
        await setPlayerTeamId(playerA2, teamA.id);
        await setPlayerTeamId(playerB1, teamB.id);

        try {
            let res = await request(app).get(`/api/teams/${id}`);
            const data = res.body.data;

            const returnedA = data.find((t: any) => t.name === "Team A");
            const returnedB = data.find((t: any) => t.name === "Team B");
            const returnedC = data.find((t: any) => t.name === "Team C");

            expect(returnedA.players.map((p: any) => p.id).sort()).toEqual([playerA1, playerA2].sort());
            expect(returnedB.players.map((p: any) => p.id)).toEqual([playerB1]);
            expect(returnedC.players).toEqual([]);
        } finally {
            await deletePlayer(playerA1, id);
            await deletePlayer(playerA2, id);
            await deletePlayer(playerB1, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Team color round-trips: explicit color vs omitted", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: "Red", color: "#FF0000" }, { name: "Blue" }]
        });

        try {
            let res = await request(app).get(`/api/teams/${id}`);
            const data = res.body.data;

            expect(data.find((t: any) => t.name === "Red").color).toBe("#FF0000");
            expect(data.find((t: any) => t.name === "Blue").color).toBeNull();
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Response envelope contains exactly the declared fields, nothing extra", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: "Team A" }, { name: "Team B" }]
        });
        const teams = await getTeams(id);
        const teamA = teams.find((t: any) => t.name === "Team A");

        const { id: playerId } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "teamsget4@gmail.com");
        await markPlayerPaid(playerId);
        await setPlayerTeamId(playerId, teamA.id);

        try {
            let res = await request(app).get(`/api/teams/${id}`);

            expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
            for (const team of res.body.data) {
                expect(Object.keys(team).sort()).toEqual(["color", "id", "name", "players"]);
                for (const player of team.players) {
                    expect(Object.keys(player).sort()).toEqual(["assigned_position", "id", "name"]);
                }
            }
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Teams from a different session are never returned", async () => {
        const { id: id1, hash: hash1 } = await addAdminSession(mock_session_with_court);
        const { id: id2, hash: hash2 } = await addAdminSession(mock_session_with_court);
        await setSessionState(id1, "completed");
        await setSessionState(id2, "completed");
        await request(app).patch(`/api/admin/${id1}/${hash1}/moveToTeams`).send({
            teams: [{ name: "Session1 Team" }, { name: "Session1 Team B" }]
        });
        await request(app).patch(`/api/admin/${id2}/${hash2}/moveToTeams`).send({
            teams: [{ name: "Session2 Team" }, { name: "Session2 Team B" }]
        });

        try {
            let res = await request(app).get(`/api/teams/${id1}`);

            expect(res.body.data).toHaveLength(2);
            expect(res.body.data.every((t: any) => t.name.startsWith("Session1"))).toBe(true);
        } finally {
            await deleteTeams(id1);
            await deleteTeams(id2);
            await deleteSession(id1);
            await deleteSession(id2);
        }
    });

    test("Requires no admin authentication - public route", async () => {
        const { id } = await addAdminSession(mock_session_with_court);

        try {
            let res = await request(app).get(`/api/teams/${id}`);

            expect(res.status).not.toBe(401);
            expect(res.status).toBe(200);
        } finally {
            await deleteSession(id);
        }
    });
});

describe("Getting teams for a session - error handling", () => {
    test("Unknown sessionId returns an empty array, not a 404", async () => {
        let res = await request(app).get(`/api/teams/${crypto.randomUUID()}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: [], success: true });
    });

    test("Malformed sessionId is handled gracefully, not a 500", async () => {
        let res = await request(app).get(`/api/teams/${encodeURIComponent("' OR '1'='1")}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: [], success: true });
    });

    test("Non-GET methods on the route are not handled", async () => {
        let res = await request(app).post(`/api/teams/${crypto.randomUUID()}`);

        expect(res.status).toBe(404);
    });
});

describe("Getting teams for a session - edge cases", () => {
    test("Player not assigned to any team does not appear in the response", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: "Team A" }, { name: "Team B" }]
        });

        const { id: playerId } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "teamsget5@gmail.com");
        await markPlayerPaid(playerId);
        // Deliberately never calling setPlayerTeamId - attendances.team_id stays NULL.

        try {
            let res = await request(app).get(`/api/teams/${id}`);

            for (const team of res.body.data) {
                expect(team.players.find((p: any) => p.id === playerId)).toBeUndefined();
            }
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Player's position preferences and attendance state are never leaked into the response", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        const { id: playerId, hash: playerToken } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "teamsget6@gmail.com");
        await markPlayerPaid(playerId);
        // Set preferences while still `completed` - FEAT-002 freezes this once the
        // session reaches `teams`, so it must happen before moveToTeams below.
        await request(app).patch(`/api/players/positions/${id}/${playerToken}`).send({
            primary_position: "middle",
            secondary_position: "oppo"
        });

        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: "Team A" }, { name: "Team B" }]
        });
        const teams = await getTeams(id);
        const teamA = teams.find((t: any) => t.name === "Team A");
        await setPlayerTeamId(playerId, teamA.id);

        try {
            let res = await request(app).get(`/api/teams/${id}`);
            const returnedTeamA = res.body.data.find((t: any) => t.name === "Team A");

            expect(returnedTeamA.players[0]).toEqual({
                id: playerId,
                name: "FILLER MAN",
                assigned_position: null
            });
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("assigned_position is present as an explicit null, not an omitted key", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: "Team A" }, { name: "Team B" }]
        });
        const teams = await getTeams(id);
        const teamA = teams.find((t: any) => t.name === "Team A");

        const { id: playerId } = await addPaymentPendingPlayer(id, crypto.randomUUID(), "teamsget7@gmail.com");
        await markPlayerPaid(playerId);
        await setPlayerTeamId(playerId, teamA.id);

        try {
            let res = await request(app).get(`/api/teams/${id}`);
            const player = res.body.data.find((t: any) => t.name === "Team A").players[0];

            expect(Object.prototype.hasOwnProperty.call(player, "assigned_position")).toBe(true);
            expect(player.assigned_position).toBeNull();
        } finally {
            await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Multiple players on the same team hold different positions simultaneously", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: "Team A" }, { name: "Team B" }]
        });
        const teams = await getTeams(id);
        const teamA = teams.find((t: any) => t.name === "Team A");

        const positions = ["middle", "oppo", "outside", "lib"] as const;
        const playerIds: string[] = [];
        for (let i = 0; i < positions.length; i++) {
            const { id: playerId } = await addPaymentPendingPlayer(id, crypto.randomUUID(), `teamsget8-${i}@gmail.com`);
            await markPlayerPaid(playerId);
            await setPlayerTeamId(playerId, teamA.id);
            await setPlayerAssignedPosition(playerId, positions[i]);
            playerIds.push(`${playerId}`);
        }

        try {
            let res = await request(app).get(`/api/teams/${id}`);
            const returnedTeamA = res.body.data.find((t: any) => t.name === "Team A");

            expect(returnedTeamA.players).toHaveLength(4);
            for (let i = 0; i < positions.length; i++) {
                const player = returnedTeamA.players.find((p: any) => p.id === playerIds[i]);
                expect(player.assigned_position).toBe(positions[i]);
            }
        } finally {
            for (const playerId of playerIds) await deletePlayer(playerId, id);
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Team name with quotes and unicode round-trips exactly", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        const trickyName = `O'Brien's "All-Stars" 🏐`;
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: trickyName }, { name: "Team B" }]
        });

        try {
            let res = await request(app).get(`/api/teams/${id}`);

            expect(res.body.data.find((t: any) => t.name === trickyName)).toBeDefined();
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });

    test("Large fixture: many teams and players are all grouped correctly", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");

        const teamInputs = Array.from({ length: 10 }, (_, i) => ({ name: `Team ${String(i).padStart(2, "0")}` }));
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({ teams: teamInputs });
        const teams = await getTeams(id);

        const playerIdsByTeam: Record<string, string[]> = {};
        for (const team of teams) {
            playerIdsByTeam[team.id] = [];
            for (let i = 0; i < 4; i++) {
                const { id: playerId } = await addPaymentPendingPlayer(id, crypto.randomUUID(), `teamsget-large-${team.id}-${i}@gmail.com`);
                await markPlayerPaid(playerId);
                await setPlayerTeamId(playerId, team.id);
                playerIdsByTeam[team.id].push(`${playerId}`);
            }
        }

        try {
            let res = await request(app).get(`/api/teams/${id}`);

            expect(res.body.data).toHaveLength(10);
            for (const team of res.body.data) {
                const expectedIds = playerIdsByTeam[team.id].sort();
                const actualIds = team.players.map((p: any) => p.id).sort();
                expect(actualIds).toEqual(expectedIds);
            }
        } finally {
            for (const ids of Object.values(playerIdsByTeam)) {
                for (const playerId of ids) await deletePlayer(playerId, id);
            }
            await deleteTeams(id);
            await deleteSession(id);
        }
    }, 30000);

    test("Session cancelled after reaching teams state still returns its teams", async () => {
        const { id, hash } = await addAdminSession(mock_session_with_court);
        await setSessionState(id, "completed");
        await request(app).patch(`/api/admin/${id}/${hash}/moveToTeams`).send({
            teams: [{ name: "Team A" }, { name: "Team B" }]
        });
        // The endpoint's contract is "return whatever is in the teams table for this
        // session_id" - it does not gate on session state (that's the whole point of the
        // "fetch unconditionally" design). Cancelling a session afterwards (permitted by
        // the generic state-change path, which has no guard against leaving `teams`) does
        // not delete the teams rows, so they should still be returned.
        await setSessionState(id, "cancelled");

        try {
            let res = await request(app).get(`/api/teams/${id}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
        } finally {
            await deleteTeams(id);
            await deleteSession(id);
        }
    });
});
