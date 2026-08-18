import { TeamPlayer, TeamWithPlayers } from "../utility/types";
import { pool } from "../setup/data";
import { DatabaseError } from "pg";
import ErrorParse from '../errorHandling/DataBaseErrorParser';

export async function getTeamsRepository(session_id: string) {
    try {
        const data = await pool.query(
            `SELECT
                t.id AS team_id,
                t.name AS team_name,
                t.color AS team_color,
                a.id AS player_id,
                a.name AS player_name,
                a.assigned_position AS player_assigned_position
             FROM teams t
             LEFT JOIN attendances a
                ON a.team_id = t.id AND a.session_id = t.session_id
             WHERE t.session_id = $1
             ORDER BY t.name, a.name`,
            [session_id]
        );

        const teamsById = new Map<string, TeamWithPlayers>();

        for (const row of data.rows) {
            let team = teamsById.get(row.team_id);

            if (!team) {
                team = {
                    id: row.team_id,
                    name: row.team_name,
                    color: row.team_color,
                    players: []
                };
                teamsById.set(row.team_id, team);
            }

            if (row.player_id) {
                const player: TeamPlayer = {
                    id: row.player_id,
                    name: row.player_name,
                    assigned_position: row.player_assigned_position
                };
                team.players.push(player);
            }
        }

        return Array.from(teamsById.values());
    } catch (err) {
        if (err instanceof DatabaseError) ErrorParse(err);
        else throw err
    }
}
